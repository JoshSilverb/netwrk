import * as SecureStore from 'expo-secure-store';

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync('user_token', token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync('user_token');
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync('user_token');
};
