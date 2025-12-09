interface MetaData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const fetchMetaTags = async (url: string): Promise<MetaData | null> => {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.warn('Meta fetch failed with status:', response.status);
      return null;
    }
    
    const data = await response.json();
    const html = data.contents;
    
    if (!html) return null;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const getMetaContent = (property: string): string | null => {
      const meta = doc.querySelector(`meta[property="${property}"]`) || 
                    doc.querySelector(`meta[name="${property}"]`);
      return meta?.getAttribute('content') || null;
    };
    
    return {
      title: getMetaContent('og:title') || doc.querySelector('title')?.textContent || undefined,
      description: getMetaContent('og:description') || getMetaContent('description') || undefined,
      image: getMetaContent('og:image') || undefined,
      url: getMetaContent('og:url') || url
    };
  } catch (error) {
    console.error('Failed to fetch meta tags:', error);
    return null;
  }
};
