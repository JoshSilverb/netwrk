// This file contains URLs for APIs used in this app

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PROD_BASE_URL = 'https://api.mynetwrk.com';

function resolveLocalHost(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname;
    }
    return 'localhost';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return host;
    }
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

function resolveBaseURL(): { url: string; target: string } {
  const explicitURL = process.env.EXPO_PUBLIC_API_URL;
  if (explicitURL) {
    return { url: explicitURL, target: 'url' };
  }

  const target = process.env.EXPO_PUBLIC_API_TARGET ?? (__DEV__ ? 'local' : 'prod');

  if (target === 'prod') {
    return { url: PROD_BASE_URL, target };
  }

  return { url: `http://${resolveLocalHost()}:8000`, target };
}

const { url: baseURL, target: apiTarget } = resolveBaseURL();

if (__DEV__) {
  console.log('[api] target=%s baseURL=%s', apiTarget, baseURL);
}

export { baseURL, apiTarget };

export const addContactForUserURL       = baseURL + '/addContactForUser';
export const getContactByIdURL          = baseURL + '/getContactById';
export const removeContactForUserURL    = baseURL + '/removeContactForUser';
export const updateContactForUserURL    = baseURL + '/updateContactForUser';
export const validateUserCredentialsURL = baseURL + '/validateUserCredentials';
export const storeUserCredentialsURL    = baseURL + '/storeUserCredentials';
export const deleteUserURL              = baseURL + '/deleteUser';
export const searchContactsURL          = baseURL + '/searchContacts';
export const getUserDetailsURL          = baseURL + '/getUserDetails';
export const getTagsForUserURL          = baseURL + '/getTagsForUser';
export const updateUserDetailsURL       = baseURL + '/updateUserDetails';
export const updateUserPictureURL       = baseURL + '/updateUserPicture';
export const getS3UploadURL             = baseURL + '/generate_upload_url';
export const searchUsersURL             = baseURL + '/searchUsers';
export const getUserByIdURL             = baseURL + '/getUserById';
export const placesAutocompleteURL      = baseURL + '/places/autocomplete';
