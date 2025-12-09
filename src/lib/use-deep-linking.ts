import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CapacitorUtils } from './capacitor-utils';
import { parseDeepLink, buildRoutePath } from './deep-link-router';

/**
 * Custom hook to handle deep links in the app
 * Sets up listeners for deep link URLs and navigates to the appropriate route
 */
export function useDeepLinking() {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      
      const route = parseDeepLink(url);
      if (route) {
        const fullPath = buildRoutePath(route);
        console.log('Navigating to:', fullPath);
        
        // Navigate to the parsed route
        navigate(fullPath);
      } else {
        console.warn('Could not parse deep link:', url);
      }
    };

    const setupListener = async () => {
      // Check if app was launched with a deep link
      const initialUrl = await CapacitorUtils.getInitialUrl();
      if (initialUrl) {
        console.log('App launched with URL:', initialUrl);
        handleDeepLink(initialUrl);
      }

      // Setup listener for future deep links (when app is already running)
      cleanup = await CapacitorUtils.setupDeepLinkListener(handleDeepLink);
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [navigate]);
}
