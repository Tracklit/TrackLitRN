// Direct Google OAuth implementation without Firebase
console.log('Using direct Google OAuth authentication');

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Load Google OAuth script
const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google OAuth script'));
    document.head.appendChild(script);
  });
};

// Initialize Google OAuth
const initializeGoogle = async (): Promise<void> => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  await loadGoogleScript();
  
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: () => {}, // Will be handled by signInWithGoogle
  });
};

// Google sign-in function
export const signInWithGoogle = async (): Promise<{ user: any }> => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    await initializeGoogle();

    return new Promise((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            // Decode the JWT token to get user info
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            const user = {
              uid: payload.sub,
              displayName: payload.name,
              email: payload.email,
              photoURL: payload.picture,
            };
            
            resolve({ user });
          } catch (error) {
            reject(error);
          }
        },
      });

      // Trigger the sign-in popup
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to manual popup if auto-prompt fails
          window.google.accounts.id.renderButton(
            document.createElement('div'),
            { theme: 'outline', size: 'large' }
          );
          
          // Create a temporary button and click it
          const tempDiv = document.createElement('div');
          tempDiv.style.display = 'none';
          document.body.appendChild(tempDiv);
          
          window.google.accounts.id.renderButton(tempDiv, {
            theme: 'outline',
            size: 'large',
            click_listener: () => {
              document.body.removeChild(tempDiv);
            }
          });
          
          // Programmatically click the button
          const button = tempDiv.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            button.click();
          } else {
            reject(new Error('Google sign-in button not found'));
          }
        }
      });
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const signOutFromGoogle = async () => {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
  console.log('Google sign-out completed');
};

// Mock auth object for compatibility
export const auth = null;
export const googleProvider = null;

// Mock auth state change listener
export const onAuthStateChanged = () => {
  console.log('Google auth state change listener (mock)');
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}