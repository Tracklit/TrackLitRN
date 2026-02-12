import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  '268893486266-li716ogbs1ge35etog7ekrvf03poo3gt.apps.googleusercontent.com';
const IOS_CLIENT_ID =
  '268893486266-kjumekii3vl3l9vq32tooao06p8h0jhr.apps.googleusercontent.com';

export const googleSignInStatusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
};

export function useGoogleAuthRequest() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
}

export async function handleGoogleResponse(
  response: any
): Promise<{ idToken: string } | null> {
  if (response?.type === 'success') {
    const idToken = response.params?.id_token;
    if (idToken) {
      return { idToken };
    }
    return null;
  }
  if (response?.type === 'cancel' || response?.type === 'dismiss') {
    const err: any = new Error('Sign in cancelled');
    err.code = googleSignInStatusCodes.SIGN_IN_CANCELLED;
    throw err;
  }
  if (response?.type === 'error') {
    throw new Error(response.error?.message || 'Google sign-in failed');
  }
  return null;
}
