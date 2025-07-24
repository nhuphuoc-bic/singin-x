// Mock image generator for testing
export const createMockImage = (
  width: number = 400,
  height: number = 300,
  text: string = 'Mock Image'
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add some geometric shapes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.3, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.rect(width * 0.6, height * 0.6, 80, 40);
    ctx.fill();

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    // Add timestamp
    ctx.font = '12px Arial';
    ctx.fillText(
      `Generated: ${new Date().toLocaleTimeString()}`,
      width / 2,
      height - 20
    );

    // Convert to blob
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
};

// Mock API response for testing
export const mockImageResponse = async (imageId: string): Promise<Response> => {
  const mockBlob = await createMockImage(400, 300, `Mock: ${imageId}`);

  return new Response(mockBlob, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': mockBlob.size.toString(),
    },
  });
};

// Check if we should use mock data
export const shouldUseMock = (): boolean => {
  // Use mock if in development and backend is not available
  return (
    process.env.NODE_ENV === 'development' &&
    (process.env.NEXT_PUBLIC_USE_MOCK === 'true' ||
      process.env.NEXT_PUBLIC_BACKEND_URL === undefined)
  );
};
