# BDR Game Webserver

### How to get the webserver running

For local deployment:
- Change the websocket url in /frontend/src/components/App.js
- Change the backend url in server.js

This methods first creates an updated frontend production build and then starts the server
- npm i
- npm start

or

This method just starts the webserver and hosts the current frontend build which is located at /frontend/build

- npm i
- npm run server