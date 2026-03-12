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

It uses styled components from Tamagui as well as custom component styling with design tokens defined in Styles.ts or with Nativewind/Tailwind.

When a user logs in, the app authenticates them with the server and receives a token uniquely identifying this user. This token is then sent along with any subsequent request to the server where it is used to check whether the user is authorized for the action they're trying to do.

The app implements almost all functionality through communication with the Netwrk backend, with the only logic handled on the frontend being optional collection of the user's location and rendering contacts on a map.

### Backend
The backend is a Python Flask app deployed with AWS Elastic Beanstalk as a Gunicorn WSGI server with a Postgres database on Neon accessed with SQLAlchemy.

Requests come to endpoints on my domain 'mynetwrk.com' and are routed through an HTTPS proxy-ing request balancer to the EB instance.

Auth is implemented by verifying a token sent with each request that is associated with a user in the database.

Semantic search is implemented on the backend through a vector similarity search using pgvector + OpenAI embeddings. Geographic sorting is implemented with PostGIS distance queries. And images are served to users as secure presigned S3 opject URLs.

## User experience

In the video below I walk through the main features of the Netwrk app, namely:
- Logging in (0:00)
- Semantic search of contacts (0:28)
- Filtering contacts by tags (0:42)
- Viewing a contact's details (0:55)
- Sorting by different rules (1:18)
- Viewing contacts on a map (2:07)
- Adding a new contact (2:20)
- Editing a contact (3:38)
- Viewing/editing the user's profile (4:00)
- Importing contacts from the phone's contacts app (4:06)
- Filtering contacts by date added (4:49)
- Logging out (5:00)


<video src="./readme-resources/netwrk-app-walkthrough.mov" controls width="200">
  Your browser does not support the video tag.
</video>
