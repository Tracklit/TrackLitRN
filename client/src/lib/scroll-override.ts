// Aggressive scroll position override system
let isNavigating = false;

export const initializeScrollOverride = () => {
  // Set scroll restoration to manual immediately
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Force scroll to top on any navigation
  const forceScrollTop = () => {
    if (typeof window !== 'undefined') {
      // Use all available scroll reset methods
      window.scrollTo(0, 0);
      window.scroll(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Reset all scrollable elements
      const allElements = document.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i] as HTMLElement;
        if (element.scrollTop > 0 || element.scrollLeft > 0) {
          element.scrollTop = 0;
          element.scrollLeft = 0;
        }
      }
    }
  };

  // Override all navigation methods
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(state, title, url) {
    isNavigating = true;
    originalPushState.call(this, state, title, url);
    forceScrollTop();
    setTimeout(() => {
      forceScrollTop();
      isNavigating = false;
    }, 0);
  };

  history.replaceState = function(state, title, url) {
    isNavigating = true;
    originalReplaceState.call(this, state, title, url);
    forceScrollTop();
    setTimeout(() => {
      forceScrollTop();
      isNavigating = false;
    }, 0);
  };

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    isNavigating = true;
    forceScrollTop();
    setTimeout(() => {
      forceScrollTop();
      isNavigating = false;
    }, 0);
  });

  // Intercept any scroll attempts during navigation
  let scrollInterceptor: (e: Event) => void;
  
  const startScrollIntercept = () => {
    scrollInterceptor = (e: Event) => {
      if (isNavigating) {
        e.preventDefault();
        e.stopImmediatePropagation();
        forceScrollTop();
      }
    };
    
    window.addEventListener('scroll', scrollInterceptor, { 
      passive: false, 
      capture: true 
    });
    
    document.addEventListener('scroll', scrollInterceptor, { 
      passive: false, 
      capture: true 
    });
  };

  const stopScrollIntercept = () => {
    if (scrollInterceptor) {
      window.removeEventListener('scroll', scrollInterceptor, { capture: true });
      document.removeEventListener('scroll', scrollInterceptor, { capture: true });
    }
  };

  // Set up scroll interception
  startScrollIntercept();

  // Override window.onbeforeunload to reset scroll
  window.addEventListener('beforeunload', forceScrollTop);

  // Return cleanup function
  return () => {
    stopScrollIntercept();
    window.removeEventListener('beforeunload', forceScrollTop);
  };
};