import { CapacitorUtils } from './capacitor-utils';

/**
 * Share utilities with deep link support
 * Use these functions to share content that opens in the app
 */

export class ShareUtils {
  /**
   * Share a product with a deep link
   * @param productId The product ID
   * @param productName The product name
   * @param trackingSource Optional tracking source (e.g., 'whatsapp', 'email')
   */
  static async shareProduct(
    productId: string | number,
    productName: string,
    trackingSource?: string
  ) {
    let deepLink = `mazeedapp://open/product/${productId}`;
    
    if (trackingSource) {
      deepLink += `?ref=${trackingSource}`;
    }

    const shareText = `Check out ${productName} on Mazeed! ${deepLink}`;

    return await CapacitorUtils.share({
      title: 'Share Product',
      text: shareText,
      dialogTitle: 'Share via',
    });
  }

  /**
   * Share the offers page
   * @param trackingSource Optional tracking source
   */
  static async shareOffers(trackingSource?: string) {
    let deepLink = 'mazeedapp://open/offers';
    
    if (trackingSource) {
      deepLink += `?ref=${trackingSource}`;
    }

    const shareText = `Check out amazing offers on Mazeed! ${deepLink}`;

    return await CapacitorUtils.share({
      title: 'Share Offers',
      text: shareText,
      dialogTitle: 'Share via',
    });
  }

  /**
   * Share a category
   * @param categoryName The category name
   * @param trackingSource Optional tracking source
   */
  static async shareCategory(categoryName: string, trackingSource?: string) {
    let deepLink = 'mazeedapp://open/categories';
    
    if (trackingSource) {
      deepLink += `?ref=${trackingSource}`;
    }

    const shareText = `Explore ${categoryName} on Mazeed! ${deepLink}`;

    return await CapacitorUtils.share({
      title: 'Share Category',
      text: shareText,
      dialogTitle: 'Share via',
    });
  }

  /**
   * Share the app (home page)
   * @param trackingSource Optional tracking source
   */
  static async shareApp(trackingSource?: string) {
    let deepLink = 'mazeedapp://open';
    
    if (trackingSource) {
      deepLink += `?ref=${trackingSource}`;
    }

    const shareText = `Download and explore Mazeed app! ${deepLink}`;

    return await CapacitorUtils.share({
      title: 'Share Mazeed App',
      text: shareText,
      dialogTitle: 'Share via',
    });
  }

  /**
   * Generate a deep link URL
   * @param route The route to link to (e.g., '/product/123')
   * @param params Optional query parameters
   */
  static generateDeepLink(route: string, params?: Record<string, string>): string {
    let deepLink = 'mazeedapp://open';
    
    // Ensure route starts with /
    if (!route.startsWith('/')) {
      route = '/' + route;
    }
    
    deepLink += route;
    
    // Add query parameters if provided
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      deepLink += `?${queryString}`;
    }
    
    return deepLink;
  }

  /**
   * Share a custom deep link
   * @param route The route to share
   * @param title Share dialog title
   * @param message Custom message
   * @param params Optional query parameters
   */
  static async shareCustomLink(
    route: string,
    title: string,
    message: string,
    params?: Record<string, string>
  ) {
    const deepLink = this.generateDeepLink(route, params);
    const shareText = `${message} ${deepLink}`;

    return await CapacitorUtils.share({
      title,
      text: shareText,
      dialogTitle: 'Share via',
    });
  }
}

/**
 * Example Usage:
 * 
 * // Share a product
 * await ShareUtils.shareProduct(123, 'Amazing T-Shirt', 'whatsapp');
 * // Generates: "Check out Amazing T-Shirt on Mazeed! mazeedapp://open/product/123?ref=whatsapp"
 * 
 * // Share offers
 * await ShareUtils.shareOffers('email');
 * // Generates: "Check out amazing offers on Mazeed! mazeedapp://open/offers?ref=email"
 * 
 * // Generate custom deep link
 * const link = ShareUtils.generateDeepLink('/product/456', { source: 'campaign', utm: 'summer2024' });
 * // Returns: "mazeedapp://open/product/456?source=campaign&utm=summer2024"
 * 
 * // Share custom link
 * await ShareUtils.shareCustomLink(
 *   '/cart',
 *   'Share Cart',
 *   'Check out my cart!',
 *   { ref: 'friend' }
 * );
 */
