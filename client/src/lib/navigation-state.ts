// Global navigation state to prevent double mounting issues
let isNavigatingToChat = false;
let navigationTimeout: NodeJS.Timeout | null = null;

export const chatNavigationState = {
  isNavigating: () => isNavigatingToChat,
  
  startNavigation: (): boolean => {
    if (isNavigatingToChat) {
      console.log('Chat navigation already in progress, blocking duplicate');
      return false; // Block navigation
    }
    
    isNavigatingToChat = true;
    console.log('Starting chat navigation');
    
    // Clear any existing timeout
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
    }
    
    // Reset after 1 second to allow future navigation
    navigationTimeout = setTimeout(() => {
      isNavigatingToChat = false;
      console.log('Chat navigation state reset');
    }, 1000);
    
    return true; // Allow navigation
  },
  
  reset: () => {
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
      navigationTimeout = null;
    }
    isNavigatingToChat = false;
    console.log('Chat navigation state force reset');
  }
};