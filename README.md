# Gatherly

A real-time chat app where users can have one-to-one conversations and group chats. Built with Node.js, Express, MongoDB, and Socket.io for the messaging layer, with Passport.js handling auth. Online/offline presence is tracked per socket connection so you can see who's active in real time.

Currently server-side rendered with EJS. React frontend migration and additional features are planned.


## Features

**Authentication**
Users register and log in through Passport.js. Sessions are persisted in MongoDB so logins survive server restarts. All chat routes are protected — unauthenticated users get redirected to login.

**One-to-One Chat**
Any two registered users can open a direct conversation. Messages are delivered instantly via Socket.io and stored in MongoDB so chat history loads on revisit.

**Group Chat**
Users can create group rooms and chat with multiple people simultaneously. All members in a room receive messages in real time.

**Online / Offline Status**
Each user's connection is tracked by their Socket ID. When a user connects, they're marked online. When they disconnect (close tab, lose connection), their status flips to offline. This updates live for everyone without a page refresh.

## Project Structure

Gatherly/
├── bin/                  # Server startup (www entry point)
├── public/
│   └── stylesheets/      # CSS for the EJS-rendered views
├── routes/               # Express route definitions — auth, chat, users
├── views/                # EJS templates — login, register, chat UI
├── socketapi.js          # All Socket.io logic — connection, messaging, presence
├── app.js                # Express setup, session config, middleware, route mounting
└── package.json


The Socket.io logic lives in its own  socketapi.js file rather than being crammed into app.js. This keeps the real-time layer separate and easier to reason about — you can read all socket events, room management, and presence tracking in one place.


## Tech Stack

Node.js · Express.js · MongoDB · Mongoose · Socket.io · Passport.js · EJS · CSS


## Getting Started

bash
git clone https://github.com/Samadali123/Gatherly.git
cd Gatherly
npm install


Create a `.env` file in the root:

env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret


Start the server:

bash
npm start


App runs at `http://localhost:5000`.


## How the Real-Time Layer Works

When a user logs in and opens the chat, their browser establishes a Socket.io connection. The server records their socket ID and marks them as online. From there:

- **Direct messages** are emitted to the target user's specific socket ID so only they receive it
- **Group messages** are emitted to a named Socket.io room so all members get it simultaneously
- **Presence updates** fire on connect  and disconnect events, updating the online status for all connected clients

Messages are also saved to MongoDB on every emit so history persists across sessions.


## Roadmap

- React frontend migration — move from EJS to a React SPA with a proper API layer
- Read receipts — show when messages have been delivered and seen
- Typing indicators — show when the other user is typing
- File and image sharing in chat
- Push notifications for new messages when the tab is in the background


## Topics

nodejs` `expressjs` `mongodb` `socket-io` `passport` `real-time` `chat-app` `group-chat` `websocket` `ejs` `session-auth` `online-status` `fullstack` `messaging`


## Author

Syed Samad Ali — [LinkedIn](https://www.linkedin.com/in/syedsamad125)
