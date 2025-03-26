import * as Location from 'expo-location';
import { saveLocation, getLocation } from '@/utils/locationstore'

async function updateLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;  // Return null if permission is denied
    }

    let location = await Location.getCurrentPositionAsync({});
    saveLocation(location.coords);
}

export const getCurrentLocation = async () => {
      
    const storedLocation = await getLocation(); // Get saved location

    // Return the stored location immediately
    if (storedLocation) {
        console.log("Util got stored location:", storedLocation)
        // Call updateLocation in the background
        updateLocation().catch(console.error);
        return storedLocation;
    }

    // If no stored location, wait for updateLocation to return new location
    return await updateLocation();
}