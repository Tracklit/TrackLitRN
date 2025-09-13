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
export const signInWithGoogle = async (): Promise<{ idToken: string }> => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    await initializeGoogle();

    return new Promise((resolve, reject) => {
      // Generate a random nonce for security
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            // Return the actual ID token for server verification
            resolve({ idToken: response.credential });
          } catch (error) {
            reject(error);
          }
        },
        nonce: nonce,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: false,
      });

      // Try One Tap first
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: Create a visible Google Sign-In button
          const buttonContainer = document.createElement('div');
          buttonContainer.id = 'google-signin-button';
          buttonContainer.style.position = 'fixed';
          buttonContainer.style.top = '50%';
          buttonContainer.style.left = '50%';
          buttonContainer.style.transform = 'translate(-50%, -50%)';
          buttonContainer.style.zIndex = '10000';
          buttonContainer.style.backgroundColor = 'white';
          buttonContainer.style.padding = '20px';
          buttonContainer.style.borderRadius = '8px';
          buttonContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          
          document.body.appendChild(buttonContainer);
          
          // Add a close button
          const closeButton = document.createElement('button');
          closeButton.textContent = '✕';
          closeButton.style.position = 'absolute';
          closeButton.style.top = '10px';
          closeButton.style.right = '10px';
          closeButton.style.border = 'none';
          closeButton.style.background = 'none';
          closeButton.style.cursor = 'pointer';
          closeButton.onclick = () => {
            document.body.removeChild(buttonContainer);
            reject(new Error('Google sign-in cancelled'));
          };
          buttonContainer.appendChild(closeButton);
          
          // Render the actual Google button
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
          });
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