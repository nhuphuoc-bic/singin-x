import React from 'react';
import StreamedImage from './StreamedImage';

interface ImageFrameProps {
  imageId: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  showBorder?: boolean;
  showTitle?: boolean;
}

export const ImageFrame: React.FC<ImageFrameProps> = ({
  imageId,
  title = 'eKYC Image',
  width = 400,
  height = 300,
  showBorder = true,
  showTitle = true
}) => {
  const handleImageLoad = () => {
    console.log('Image loaded successfully:', imageId);
  };

  const handleImageError = (error: Error) => {
    console.error('Failed to load image:', imageId, error);
  };

  return (
    <div
      style={{
        border: showBorder ? '2px solid #e2e8f0' : 'none',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#ffffff',
        boxShadow: showBorder ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {showTitle && (
        <div
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            textAlign: 'center'
          }}
        >
          {title}
        </div>
      )}
      
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}
      >
        <StreamedImage
          imageId={imageId}
          width={width}
          height={height}
          alt={`${title} - ${imageId}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          fallbackSrc="/placeholder-image.png" // Optional fallback image
          className="image-frame-content"
        />
      </div>
    </div>
  );
};

export default ImageFrame; 