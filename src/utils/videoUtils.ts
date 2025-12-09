export const detectVideoType = (url: string) => {
  if (url.includes('tiktok.com') || url.includes('vt.tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  return 'direct';
};

export const getYouTubeEmbedUrl = (url: string) => {
  const videoId = url.includes('youtu.be') 
    ? url.split('/').pop()?.split('?')[0]
    : new URLSearchParams(new URL(url).search).get('v');
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&loop=1&playlist=${videoId}`;
};

export const fetchTikTokOembed = async (url: string) => {
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch TikTok oembed:', error);
    return null;
  }
};
