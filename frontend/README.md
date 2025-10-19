# Netwrk frontend codebase

The Netwrk frontend is a react-native app built on the expo framework.

For styling it uses a combination of tailwind and centralized CSS opptions, and communicates with the backend via axios requests. 

It gets a new token for the user from the backend upon successful authentication of the user's details. This token is saved in memory or to local secure storage if "remember me" is ticked, and attached to every request to the backend.