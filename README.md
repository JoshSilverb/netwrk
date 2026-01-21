# Netwrk

Netwrk is a cross-platform app designed to make managing, tracking, and growing your network easy.

It makes your contacts intuitively searchable and groupable, introducing transparency and flexibility into your global networks.

## Features
- Search your contacts using natural language queries
- Tag contacts to quickly search and view specific segments of your network
- Sort contacts according to a number of criteria, including:
  - When you last interacted with them
  - When you next plan to interact with them
  - Proximity to your current location
  - When you added them to your profile
- Import contacts straight from your phone's contacts app

## Technical details
### Frontend
The frontend is a cross-platform react-native app built on the expo framework and is designed to run on Android and IOS phones.

It uses styled components from Tamagui as well as some custom components styled with nativewind.

When a user logs in, the app authenticates them with the server and receives a token uniquely identifying this user, which is then sent along with any subsequent request to the server. This token is used to check whether the user is authorized for the action they're trying to do.