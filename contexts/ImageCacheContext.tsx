import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import imageCacheDB from '../utils/indexedDB';
import { createMockImage } from '../utils/mockImage';

interface ImageCacheItem {
  blob: Blob;
  objectUrl: string;
  timestamp: number;
}

interface ImageCacheContextType {
  getImage: (imageId: string) => Promise<string>;
  clearCache: () => void;
  removeFromCache: (imageId: string) => void;
  getCacheStats: () => Promise<{ count: number; totalSize: number }>;
}

const ImageCacheContext = createContext<ImageCacheContextType | null>(null);

interface ImageCacheProviderProps {
  children: React.ReactNode;
  maxCacheSize?: number;
  cacheExpiryMs?: number;
}

export const ImageCacheProvider: React.FC<ImageCacheProviderProps> = ({
  children,
  maxCacheSize = 50,
  cacheExpiryMs = 5 * 60 * 1000 // 5 minutes
}) => {
  const [cache, setCache] = useState<Map<string, ImageCacheItem>>(new Map());
  const pendingRequests = useRef<Map<string, Promise<string>>>(new Map());
  const cacheRef = useRef<Map<string, ImageCacheItem>>(new Map());

  // Keep cacheRef in sync with cache state
  React.useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  const cleanupExpiredItems = useCallback(async () => {
    const now = Date.now();
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      const entries = Array.from(newCache.entries());
      for (const [key, item] of entries) {
        if (now - item.timestamp > cacheExpiryMs) {
          URL.revokeObjectURL(item.objectUrl);
          newCache.delete(key);
        }
      }
      return newCache;
    });

    // Also cleanup IndexedDB
    try {
      await imageCacheDB.cleanupExpired(cacheExpiryMs);
    } catch (error) {
      console.warn('Failed to cleanup IndexedDB:', error);
    }
  }, [cacheExpiryMs]);

  const getImage = useCallback(async (imageId: string): Promise<string> => {
    // Check if we have a cached version using ref to avoid dependency
    const cachedItem = cacheRef.current.get(imageId);
    if (cachedItem) {
      const now = Date.now();
      if (now - cachedItem.timestamp < cacheExpiryMs) {
        return cachedItem.objectUrl;
      } else {
        // Remove expired item
        URL.revokeObjectURL(cachedItem.objectUrl);
        setCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(imageId);
          return newCache;
        });
      }
    }

    // Check if there's already a pending request for this imageId
    const pendingRequest = pendingRequests.current.get(imageId);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        // First, try to get from IndexedDB
        const dbCachedImage = await imageCacheDB.getImage(imageId);
        if (dbCachedImage) {
          const now = Date.now();
          if (now - dbCachedImage.timestamp < cacheExpiryMs) {
            // Create object URL from IndexedDB blob
            const objectUrl = URL.createObjectURL(dbCachedImage.blob);
            
            // Add to memory cache
            setCache(prev => {
              const newCache = new Map(prev);
              newCache.set(imageId, {
                blob: dbCachedImage.blob,
                objectUrl,
                timestamp: dbCachedImage.timestamp
              });
              return newCache;
            });

            return objectUrl;
          } else {
            // Remove expired item from IndexedDB
            await imageCacheDB.removeImage(imageId);
          }
        }

        // If not in IndexedDB or expired, fetch from API
        console.log('fetching image', imageId);
        const requestTimestamp = Date.now();
        
        // Retry logic for network issues
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Attempt ${attempt} to fetch image`);
            
            // Try different fetch strategies
            let response;
            if (attempt === 1) {
              // First attempt: Normal fetch
              response = await fetch(`http://localhost:3008/public/me/ekyc/image/${imageId}?t=${requestTimestamp}`, {
                method: 'GET',
                headers: {
                  'Accept': 'image/*',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                },
              });
            } else if (attempt === 2) {
              // Second attempt: Without cache headers
              response = await fetch(`http://localhost:3008/public/me/ekyc/image/${imageId}?t=${requestTimestamp}`, {
                method: 'GET',
                headers: {
                  'Accept': 'image/*'
                },
              });
            } else {
              // Third attempt: With different Accept header
              response = await fetch(`http://localhost:3008/public/me/ekyc/image/${imageId}?t=${requestTimestamp}`, {
                method: 'GET',
                headers: {
                  'Accept': 'image/jpeg,image/png,image/*;q=0.9,*/*;q=0.8'
                },
              });
            }

            console.log('Response status:', response.status, response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            console.log('Response type:', response.type);
            console.log('Response bodyUsed:', response.bodyUsed);

            // Check if response is actually an image
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            // For streaming responses, Content-Type might not be available immediately
            // We'll validate the blob type instead
            if (contentType && !contentType.startsWith('image/')) {
              console.warn('Response is not an image, content-type:', contentType);
              // Try to read as text to see what we actually got
              const textResponse = await response.text();
              console.error('Response body (first 200 chars):', textResponse.substring(0, 200));
              throw new Error(`Server returned non-image content: ${contentType}`);
            }

            if (!response.ok) {
              // If backend is not available, try to create a mock image for testing
              if (response.status === 404 || response.status === 400) {
                console.log('Backend returned error, creating mock image for testing');
                const mockBlob = await createMockImage(400, 300, `Mock: ${imageId}`);
                const objectUrl = URL.createObjectURL(mockBlob);
                const timestamp = Date.now();
                
                // Add to memory cache
                setCache(prev => {
                  const newCache = new Map(prev);
                  newCache.set(imageId, {
                    blob: mockBlob,
                    objectUrl,
                    timestamp
                  });
                  return newCache;
                });

                return objectUrl;
              }
              throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            console.log('Blob created:', {
              size: blob.size,
              type: blob.type
            });
            
            // Validate that we have a valid image blob
            if (!blob.type.startsWith('image/')) {
              console.warn('Blob is not an image type:', blob.type);
              throw new Error(`Invalid image type: ${blob.type}`);
            }
            
            if (blob.size === 0) {
              console.warn('Blob is empty');
              throw new Error('Empty image data');
            }

            // Test if blob can be read as image
            try {
              const testUrl = URL.createObjectURL(blob);
              const testImg = new Image();
              await new Promise((resolve, reject) => {
                testImg.onload = () => {
                  console.log('Blob validation successful:', {
                    width: testImg.width,
                    height: testImg.height
                  });
                  URL.revokeObjectURL(testUrl);
                  resolve(true);
                };
                testImg.onerror = () => {
                  console.error('Blob validation failed - not a valid image');
                  URL.revokeObjectURL(testUrl);
                  reject(new Error('Blob is not a valid image'));
                };
                testImg.src = testUrl;
              });
            } catch (error) {
              console.error('Blob validation error:', error);
              throw new Error('Invalid image data from server');
            }
            
            const objectUrl = URL.createObjectURL(blob);
            console.log('Object URL created:', objectUrl);
            const timestamp = Date.now();
            
            // Add to memory cache
            setCache(prev => {
              const newCache = new Map(prev);
              
              // Remove oldest items if cache is full
              if (newCache.size >= maxCacheSize) {
                const oldestKey = newCache.keys().next().value;
                const oldestItem = newCache.get(oldestKey);
                if (oldestItem) {
                  URL.revokeObjectURL(oldestItem.objectUrl);
                  newCache.delete(oldestKey);
                }
              }
              
              newCache.set(imageId, {
                blob,
                objectUrl,
                timestamp
              });
              
              return newCache;
            });

            // Also save to IndexedDB for persistence
            try {
              await imageCacheDB.setImage(imageId, blob, timestamp);
            } catch (error) {
              console.warn('Failed to save to IndexedDB:', error);
            }

            return objectUrl;
          } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt < 3) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        
        // All attempts failed
        console.error('All fetch attempts failed:', lastError);
        
        // Fallback to mock image for testing
        console.log('Using mock image as fallback');
        const mockBlob = await createMockImage(400, 300, `Mock: ${imageId}`);
        const objectUrl = URL.createObjectURL(mockBlob);
        const timestamp = Date.now();
        
        // Add to memory cache
        setCache(prev => {
          const newCache = new Map(prev);
          newCache.set(imageId, {
            blob: mockBlob,
            objectUrl,
            timestamp
          });
          return newCache;
        });

        return objectUrl;
      } finally {
        // Remove from pending requests
        pendingRequests.current.delete(imageId);
      }
    })();

    // Store pending request
    pendingRequests.current.set(imageId, requestPromise);
    
    return requestPromise;
  }, [cacheExpiryMs, maxCacheSize]); // Removed cache from dependencies

  const clearCache = useCallback(async () => {
    // Clean up all object URLs
    const items = Array.from(cache.values());
    for (const item of items) {
      URL.revokeObjectURL(item.objectUrl);
    }
    setCache(new Map());
    // Also clear pending requests
    pendingRequests.current.clear();

    // Clear IndexedDB
    try {
      await imageCacheDB.clearAll();
    } catch (error) {
      console.warn('Failed to clear IndexedDB:', error);
    }
  }, []); // Removed cache dependency

  const removeFromCache = useCallback(async (imageId: string) => {
    const item = cache.get(imageId);
    if (item) {
      URL.revokeObjectURL(item.objectUrl);
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(imageId);
        return newCache;
      });
    }

    // Also remove from IndexedDB
    try {
      await imageCacheDB.removeImage(imageId);
    } catch (error) {
      console.warn('Failed to remove from IndexedDB:', error);
    }
  }, []); // Removed cache dependency

  const getCacheStats = useCallback(async () => {
    try {
      return await imageCacheDB.getCacheStats();
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { count: 0, totalSize: 0 };
    }
  }, []);

  // Cleanup expired items periodically
  React.useEffect(() => {
    const interval = setInterval(cleanupExpiredItems, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [cleanupExpiredItems]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  return (
    <ImageCacheContext.Provider value={{ getImage, clearCache, removeFromCache, getCacheStats }}>
      {children}
    </ImageCacheContext.Provider>
  );
};

export const useImageCache = (): ImageCacheContextType => {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error('useImageCache must be used within an ImageCacheProvider');
  }
  return context;
}; 