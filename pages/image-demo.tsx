import React, { useState, useCallback } from 'react';
import ImageFrame from '../components/ImageFrame';
import StreamedImage from '../components/StreamedImage';
import CacheStats from '../components/CacheStats';
import { ImageCacheProvider } from '../contexts/ImageCacheContext';

const ImageDemoContent: React.FC = () => {
  const [imageId, setImageId] = useState(''); // Start with empty string
  const [isValidInput, setIsValidInput] = useState(false);

  const handleImageIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setImageId(value);
    setIsValidInput(value.length > 0); // Only valid if not empty
  };

  const handleBasicImageLoad = useCallback(() => {
    console.log('Basic image loaded successfully');
  }, []);

  const handleBasicImageError = useCallback((error: Error) => {
    console.error('Basic image error:', error.message);
  }, []);

  const handleErrorDemoError = useCallback((error: Error) => {
    console.error('Error demo:', error.message);
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <CacheStats />

      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Streamed Image Demo (with Caching)
      </h1>

      {/* Input for image ID */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <label htmlFor="imageId" style={{ marginRight: '10px' }}>
          Image ID:
        </label>
        <input
          id="imageId"
          type="text"
          value={imageId}
          onChange={handleImageIdChange}
          placeholder="Enter image ID to load..."
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            width: '300px'
          }}
        />
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Try: 7ec2e963-239a-4296-92e9-439f97102439, test-image-002, or any valid UUID from your backend
        </div>
        {!isValidInput && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#f59e0b' }}>
            Enter an image ID to start loading images
          </div>
        )}
      </div>

      {/* Only render images when user has entered a valid imageId */}
      {isValidInput ? (
        <>
          {/* Example 1: Basic StreamedImage */}
          <div style={{ marginBottom: '40px' }}>
            <h2>Basic StreamedImage</h2>
            <StreamedImage
              imageId={imageId}
              width={300}
              height={200}
              alt="Basic streamed image"
              onLoad={handleBasicImageLoad}
              onError={handleBasicImageError}
            />
          </div>

          {/* Example 2: ImageFrame with Border */}
          <div style={{ marginBottom: '40px' }}>
            <h2>ImageFrame with Border</h2>
            <ImageFrame
              imageId={imageId}
              title="eKYC Document"
              width={400}
              height={300}
              showBorder={true}
              showTitle={true}
            />
          </div>

          {/* Example 3: ImageFrame without Border */}
          <div style={{ marginBottom: '40px' }}>
            <h2>ImageFrame without Border</h2>
            <ImageFrame
              imageId={imageId}
              title="Clean Document"
              width={350}
              height={250}
              showBorder={false}
              showTitle={true}
            />
          </div>

          {/* Example 4: Multiple Images */}
          <div style={{ marginBottom: '40px' }}>
            <h2>Multiple Images (Same ID - Cached)</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <ImageFrame
                imageId={imageId}
                title="Document 1"
                width={200}
                height={150}
                showBorder={true}
                showTitle={true}
              />
              <ImageFrame
                imageId={imageId}
                title="Document 2"
                width={200}
                height={150}
                showBorder={true}
                showTitle={true}
              />
              <ImageFrame
                imageId={imageId}
                title="Document 3"
                width={200}
                height={150}
                showBorder={true}
                showTitle={true}
              />
            </div>
          </div>

          {/* Example 5: Error handling demonstration */}
          <div style={{ marginBottom: '40px' }}>
            <h2>Error Handling Demo</h2>
            <p>This will show error state if the image ID doesn't exist in backend:</p>
            <StreamedImage
              imageId={imageId}
              width={300}
              height={200}
              alt="Error demo"
              onError={handleErrorDemoError}
              fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
            />
          </div>
        </>
      ) : (
        // Show placeholder when no imageId is entered
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '10px' }}>
            📷 Enter an Image ID above to start loading images
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            The images will be cached automatically for better performance
          </div>
        </div>
      )}
    </div>
  );
};

const ImageDemo: React.FC = () => {
  return (
    <ImageCacheProvider maxCacheSize={20} cacheExpiryMs={10 * 60 * 1000}>
      <ImageDemoContent />
    </ImageCacheProvider>
  );
};

export default ImageDemo; 