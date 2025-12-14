export default {
  "expo": {
    "name": "netwrk",
    "slug": "expo-frontend",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/netwrk-icon-square.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.joshsilv.netwrk",
      "config": {
        "googleMapsApiKey": process.env.IOS_GOOGLE_API_KEY
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/netwrk-icon-square.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      "package": "com.joshsilv.netwrk",
      "config": {
        "googleMaps": {
          "apiKey": process.env.ANDROID_GOOGLE_API_KEY,
        }
      }
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "We use your location to show nearby contacts on the map and help you discover people in your area. Your location is only used while the app is open.",
          "locationWhenInUsePermission": "We use your location to show nearby contacts on the map while you're using the app.",
          "isIosBackgroundLocationEnabled": false
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "We need access to your photo library so you can select profile pictures for your contacts and personalize your account.",
          "cameraPermission": "We need access to your camera so you can take profile pictures for your contacts and account."
        }
      ],
      [
        "expo-contacts",
        {
          "contactsPermission": "We need access to your contacts to import them into Netwrk."
        }
      ],
      "expo-font",
      "expo-secure-store",
      "expo-web-browser"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "046bde21-6a9b-40bd-a5a9-1605fd64e7df"
      }
    }
  }
}
