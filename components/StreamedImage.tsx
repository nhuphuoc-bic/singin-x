import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useImageCache } from '../contexts/ImageCacheContext';

interface StreamedImageProps {
  imageId: string;
  className?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallbackSrc?: string;
}

export const StreamedImage: React.FC<StreamedImageProps> = ({
  imageId,
  className = '',
  alt = 'Streamed image',
  width,
  height,
  onLoad,
  onError,
  fallbackSrc
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getImage } = useImageCache();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stabilize callback functions to prevent infinite re-renders
  const handleLoad = useCallback(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  const handleError = useCallback((error: Error) => {
    if (onError) {
      onError(error);
    }
  }, [onError]);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create abort controller for cleanup
        abortControllerRef.current = new AbortController();

        // Get image from cache (this will handle deduplication)
        const objectUrl = await getImage(imageId);
        
        if (!isMounted) return;

        setImageSrc(objectUrl);
        console.log('ImageSrc set to:', objectUrl);
        setIsLoading(false);
        
        // Add a small delay to ensure blob URL is properly registered
        setTimeout(() => {
          if (isMounted) {
            handleLoad();
          }
        }, 100);
      } catch (err) {
        if (!isMounted) return;
        
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('400')) {
          errorMessage = `Image not found or invalid ID: ${imageId}`;
        } else if (error.message.includes('404')) {
          errorMessage = `Image not found: ${imageId}`;
        } else if (error.message.includes('500')) {
          errorMessage = `Server error while loading image: ${imageId}`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        
        handleError(new Error(errorMessage));
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [imageId, getImage, handleLoad, handleError]);

  if (isLoading) {
    return (
      <div 
        className={`streamed-image-loading ${className}`}
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd'
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`streamed-image-error ${className}`}
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#fff5f5',
          border: '1px solid #fed7d7',
          color: '#c53030',
          flexDirection: 'column',
          padding: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Failed to load image</div>
          <div style={{ fontSize: '12px', color: '#c53030' }}>{error}</div>
        </div>
        {fallbackSrc && (
          <img 
            src={fallbackSrc} 
            alt={alt} 
            className={className}
            style={{ width: '50%', height: 'auto', maxHeight: '50%' }}
            onLoad={handleLoad}
            onError={() => {
              console.warn('Fallback image also failed to load');
            }}
          />
        )}
      </div>
    );
  }

  // Only render img tag if we have a valid imageSrc
  if (!imageSrc) {
    return (
      <div 
        className={`streamed-image-no-src ${className}`}
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          color: '#666'
        }}
      >
        <div>No image source</div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`streamed-image ${className}`}
      style={{ width, height }}
      onLoad={() => {
        console.log('Image loaded successfully in img tag:', imageId, imageSrc);
        handleLoad();
      }}
      onError={(e) => {
        console.error('Image failed to load in img tag:', {
          imageId,
          imageSrc,
          error: e
        });
        const error = new Error('Image failed to load');
        setError(error.message);
        handleError(error);
      }}
    />
  );
};

export default StreamedImage; 