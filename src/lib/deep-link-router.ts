/**
 * Deep Link Router
 * Handles parsing and routing of deep link URLs
 */

export interface DeepLinkParams {
  [key: string]: string;
}

export interface DeepLinkRoute {
  path: string;
  params?: DeepLinkParams;
}

/**
 * Parse a deep link URL and extract the route and parameters
 * 
 * Supported formats:
 * - mazeedapp://open?page=/product/123
 * - mazeedapp://open?page=/cart
 * - mazeedapp://open?page=/product/123&ref=whatsapp
 * - mazeedapp://open/product/123
 * - mazeedapp://open/cart
 * 
 * @param url The deep link URL
 * @returns The parsed route and parameters
 */
export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    console.log('Parsing deep link:', url);

    // Check if it's our custom scheme
    if (!url.startsWith('mazeedapp://')) {
      console.warn('URL does not match mazeedapp:// scheme');
      return null;
    }

    // Remove the scheme
    const urlWithoutScheme = url.replace('mazeedapp://', '');
    
    // Split by '?' to separate path and query params
    const [pathPart, queryPart] = urlWithoutScheme.split('?');
    
    // Remove 'open' prefix if present
    let path = pathPart.replace(/^open\/?/, '');
    
    // Parse query parameters
    const params: DeepLinkParams = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      // If there's a 'page' parameter, use it as the path
      if (params.page) {
        path = params.page;
        delete params.page;
      }
    }
    
    // Ensure path starts with /
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Default to home if no path
    if (!path) {
      path = '/';
    }

    console.log('Parsed deep link - Path:', path, 'Params:', params);

    return {
      path,
      params: Object.keys(params).length > 0 ? params : undefined
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Build a full route path with query parameters
 * @param route The deep link route
 * @returns The full path with query string
 */
export function buildRoutePath(route: DeepLinkRoute): string {
  let fullPath = route.path;
  
  if (route.params && Object.keys(route.params).length > 0) {
    const queryString = new URLSearchParams(route.params).toString();
    fullPath += `?${queryString}`;
  }
  
  return fullPath;
}

/**
 * Example deep link URLs and their expected routes:
 * 
 * mazeedapp://open?page=/product/123
 * -> { path: '/product/123', params: undefined }
 * 
 * mazeedapp://open?page=/product/123&ref=whatsapp
 * -> { path: '/product/123', params: { ref: 'whatsapp' } }
 * 
 * mazeedapp://open/cart
 * -> { path: '/cart', params: undefined }
 * 
 * mazeedapp://open/product/456?source=email
 * -> { path: '/product/456', params: { source: 'email' } }
 */
