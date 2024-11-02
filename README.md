# Gatherly a chatting app which gather different different users through chatting

This project is a mini application similar to WhatsApp, built using Node.js, Express.js, MongoDB, Socket.io for real-time messaging, and Passport.js for authentication/authorization. It includes features for one-to-one chat, group chat, online/offline status tracking using Socket IDs, and secure user authentication.

## Table of Contents
- [Demo](#demo)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Demo
There is no live demo available for this mini app.

## Features
- Real-time one-to-one chat using Socket.io
- Real-time group chat using Socket.io
- Online/offline status tracking using Socket.io and Socket IDs
- User authentication and authorization using Passport.js

## Technologies Used
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Socket.io](https://socket.io/)
- [Passport.js](http://www.passportjs.org/)

## Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/whatsapp-mini-app.git
    cd whatsapp-mini-app
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_uri
    SESSION_SECRET=your_session_secret
    ```

4. Run the development server:
    ```bash
    npm start
    ```

5. The server will be running at `http://localhost:5000`.

## Usage
- **Authentication**: Register and log in using Passport.js authentication.
- **One-to-One Chat**: Real-time chat between two users.
- **Group Chat**: Real-time chat among multiple users in a group.
- **Online/Offline Status**: Track users' online/offline status using Socket IDs.

## Project Structure
