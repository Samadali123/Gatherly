# Gatherly Socket Events

## Connection Authentication

- Socket clients must connect with `auth: { token: <accessToken> }`.
- If the access token is expired, the server rejects the connection with `TOKEN_EXPIRED`.
- If the access token is invalid, the server rejects the connection with `INVALID_TOKEN`.

## Client -> Server

- `join-server`
  - Payload: optional
  - Purpose: marks the authenticated user online, stores `socketId`, and loads their groups and currently online users.

- `private-message`
  - Payload: `{ message, receiver, ttl?, parentMessageId? }`
  - Purpose: persists a direct or group message and emits it to the target user or group members.

- `fetch-conversation`
  - Payload: `{ sender, receiver }`
  - Purpose: fetches either a DM thread or the message history for a group chat.

- `create-new-group`
  - Payload: `{ groupName, sender }`
  - Purpose: creates a new group and adds the requesting user as the first member.

- `join-group`
  - Payload: `{ groupName, sender }`
  - Purpose: adds the requesting user to an existing group.

- `room:message:send`
  - Payload: `{ content }`
  - Purpose: sends a message in an anonymous room.

## Server -> Client

- `all-groups`
  - Payload: `group`
  - Purpose: sends each existing group the connected user belongs to.

- `new-user-join`
  - Payload: `{ username, profileImage }`
  - Purpose: announces online users to the newly connected client and broadcasts the new arrival to others.

- `receive-private-message`
  - Payload: `{ messageId, chatId, message }`
  - Purpose: delivers a newly received DM or group message.

- `send-conversation`
  - Payload: `message[]`
  - Purpose: returns the stored conversation history for the selected chat.

- `group-created`
  - Payload: `group`
  - Purpose: confirms a new group was created.

- `group-joined`
  - Payload: `group`
  - Purpose: confirms the user joined an existing group.

- `not-found`
  - Payload: `{ groupName }`
  - Purpose: indicates the requested group could not be found.

- `message:expired`
  - Payload: `{ messageId, chatId }`
  - Purpose: notifies clients when a disappearing message is deleted.

- `message:pinned`
  - Payload: `{ message, chatId, pinnedBy }`
  - Purpose: notifies clients that a message was pinned.

- `message:unpinned`
  - Payload: `{ messageId, chatId }`
  - Purpose: notifies clients that a message was unpinned.

- `poll:new`
  - Payload: serialized poll
  - Purpose: announces a newly created poll.

- `poll:updated`
  - Payload: `{ pollId, options }`
  - Purpose: broadcasts vote updates.

- `reaction:added`
  - Payload: `{ messageId, emoji, userId, count }`
  - Purpose: updates reaction counts when a reaction is added.

- `reaction:removed`
  - Payload: `{ messageId, emoji, count }`
  - Purpose: updates reaction counts when a reaction is removed.

- `room:joined`
  - Payload: `{ roomCode, sessionId, alias }`
  - Purpose: announces an anonymous participant joining a room.

- `room:left`
  - Payload: `{ roomCode, sessionId }`
  - Purpose: announces an anonymous participant leaving a room.

- `room:expired`
  - Payload: `{ code }`
  - Purpose: announces that an anonymous room has expired.

- `room:participant:kicked`
  - Payload: `{ sessionId }`
  - Purpose: notifies clients that a participant was removed by the room creator.

- `room:message:new`
  - Payload: anonymous room message
  - Purpose: delivers a new anonymous room chat message.
