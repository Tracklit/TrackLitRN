// Firebase disabled temporarily - using session-based authentication instead
console.log('Firebase authentication disabled - using session-based auth');

// Mock Firebase functions to prevent errors
export const auth = null;
export const googleProvider = null;

export const signInWithGoogle = async () => {
  throw new Error('Google sign-in is currently disabled. Please use username/password login.');
};

export const signOutFromGoogle = async () => {
  console.log('Firebase sign-out called but disabled');
};

export const onAuthStateChanged = () => {
  console.log('Firebase auth state change listener disabled');
};