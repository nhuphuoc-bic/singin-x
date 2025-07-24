import React from 'react';
import { useImageCache } from '../contexts/ImageCacheContext';

export const CacheStats: React.FC = () => {
  const { clearCache, getCacheStats } = useImageCache();
  const [cacheInfo, setCacheInfo] = React.useState<{
    count: number;
    totalSize: number;
  }>({ count: 0, totalSize: 0 });

  React.useEffect(() => {
    const updateCacheInfo = async () => {
      try {
        const stats = await getCacheStats();
        setCacheInfo(stats);
      } catch (error) {
        console.warn('Failed to get cache stats:', error);
      }
    };

    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [getCacheStats]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      setCacheInfo({ count: 0, totalSize: 0 });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
        Cache Statistics
      </h3>
      <div style={{ fontSize: '12px', marginBottom: '8px' }}>
        <div>Cached Images: {cacheInfo.count}</div>
        <div>Memory Usage: {formatBytes(cacheInfo.totalSize)}</div>
      </div>
      <button
        onClick={handleClearCache}
        style={{
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Clear Cache
      </button>
    </div>
  );
};

export default CacheStats; 