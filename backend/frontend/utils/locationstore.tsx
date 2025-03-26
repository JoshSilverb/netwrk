import * as SecureStore from 'expo-secure-store';

export const saveLocation = async (coordinate: {latitude: number, longitude: number}) => {
    // const coordinate: string = longitude.toString() + ';' + latitude.toString();
    await SecureStore.setItemAsync('user_coordinate', JSON.stringify(coordinate));
};

export const getLocation = async () => {
  const coord_string = await SecureStore.getItemAsync('user_coordinate');
  return coord_string ? JSON.parse(coord_string) : null;
};

export const removeLocation = async () => {
  await SecureStore.deleteItemAsync('user_coordinate');
};
