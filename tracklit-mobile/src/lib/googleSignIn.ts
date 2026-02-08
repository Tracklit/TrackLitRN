import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID =
  '268893486266-li716ogbs1ge35etog7ekrvf03poo3gt.apps.googleusercontent.com';
const IOS_CLIENT_ID =
  '268893486266-kjumekii3vl3l9vq32tooao06p8h0jhr.apps.googleusercontent.com';

let configured = false;

export const googleSignInStatusCodes = statusCodes;

export function ensureGoogleSigninConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
  });
  configured = true;
}

export async function nativeGoogleSignIn(): Promise<{ idToken: string }> {
  ensureGoogleSigninConfigured();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const userInfo = await GoogleSignin.signIn();
  const idToken = (userInfo as any)?.idToken as string | undefined;

  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token.');
  }

  return { idToken };
}
