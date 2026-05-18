const config = require('../configs');

const serverUrl =
  config.NODE_ENV === 'production'
    ? '/api/v1'
    : `http://localhost:${config.PORT}/api/v1`;

const authHeader = {
  name: 'Authorization',
  in: 'header',
  required: true,
  schema: {
    type: 'string',
    example: 'Bearer <accessToken>',
  },
};

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Gatherly Backend API',
    version: '1.0.0',
    description:
      'Production-oriented API documentation for Gatherly. Use JWT bearer tokens for protected routes and allow the browser cookie jar to carry the refresh-token and anonymous-room cookies.',
  },
  servers: [
    {
      url: serverUrl,
      description: config.NODE_ENV === 'production' ? 'Production server' : 'Local development server',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health checks' },
    { name: 'Auth', description: 'JWT authentication and refresh-token rotation' },
    { name: 'Chat', description: 'Conversation and chat list endpoints' },
    { name: 'Groups', description: 'Group creation and joining' },
    { name: 'Messages', description: 'Messages, pins, threads, and reactions' },
    { name: 'Polls', description: 'Poll creation and voting' },
    { name: 'Users', description: 'User profiles and social graph' },
    { name: 'Rooms', description: 'Anonymous room lifecycle and participants' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { nullable: true },
        },
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            nullable: true,
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: '"email" must be a valid email' },
              },
            },
          },
        },
      },
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6630a124c4fb58edce4d1001' },
          name: { type: 'string', example: 'Samad Ali' },
          email: { type: 'string', example: 'samad@example.com' },
          avatar: { type: 'string', nullable: true },
          lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Message: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6630a24bc4fb58edce4d1008' },
          msg: { type: 'string', example: 'hello group' },
          sender: { type: 'string', example: 'samad@example.com' },
          receiver: { type: 'string', example: 'team-alpha' },
          chatId: { type: 'string', example: '6630a201c4fb58edce4d1006' },
          ttl: { type: 'string', nullable: true, example: '5m' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          isPinned: { type: 'boolean', example: false },
          parentMessageId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Poll: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6630a2e1c4fb58edce4d1010' },
          question: { type: 'string', example: 'Lunch?' },
          chatId: { type: 'string', example: '6630a201c4fb58edce4d1006' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          isAnonymous: { type: 'boolean', example: false },
          isActive: { type: 'boolean', example: true },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'opt_01' },
                text: { type: 'string', example: 'Pizza' },
                voteCount: { type: 'integer', example: 1 },
                votes: {
                  type: 'array',
                  nullable: true,
                  items: { type: 'string', example: '6630a124c4fb58edce4d1001' },
                },
              },
            },
          },
        },
      },
      Room: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'A1b2C3d4E5' },
          shareUrl: { type: 'string', example: '/room/A1b2C3d4E5' },
          expiresAt: { type: 'string', format: 'date-time' },
          maxParticipants: { type: 'integer', example: 50 },
          isActive: { type: 'boolean', example: true },
          requiresPassword: { type: 'boolean', example: true },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is healthy',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Samad Ali' },
                  email: { type: 'string', format: 'email', example: 'samad@example.com' },
                  password: { type: 'string', format: 'password', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful. Sets refresh-token cookie.' },
          409: { description: 'Email already registered' },
          422: { description: 'Validation failed' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'samad@example.com' },
                  password: { type: 'string', format: 'password', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful. Sets refresh-token cookie.' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token and get a new access token',
        description: 'Requires the httpOnly refresh-token cookie from a previous login/register.',
        responses: {
          200: { description: 'Token refreshed' },
          401: { description: 'Refresh token missing, invalid, revoked, or expired' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout and revoke refresh token',
        parameters: [authHeader],
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile' },
          401: { description: 'Access token missing, invalid, or expired' },
        },
      },
    },
    '/groups': {
      post: {
        tags: ['Groups'],
        summary: 'Create a group',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['groupName'],
                properties: {
                  groupName: { type: 'string', example: 'team-alpha' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Group created' },
        },
      },
    },
    '/groups/join': {
      post: {
        tags: ['Groups'],
        summary: 'Join an existing group',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['groupName'],
                properties: {
                  groupName: { type: 'string', example: 'team-alpha' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Group joined' },
          404: { description: 'Group not found' },
        },
      },
    },
    '/chat/conversation': {
      get: {
        tags: ['Chat'],
        summary: 'Get direct or group conversation',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'receiver',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'team-alpha' },
          },
        ],
        responses: {
          200: { description: 'Conversation fetched' },
        },
      },
    },
    '/chat/groups': {
      get: {
        tags: ['Chat'],
        summary: 'List groups for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Groups fetched' },
        },
      },
    },
    '/chats/{chatId}/pins': {
      get: {
        tags: ['Chat'],
        summary: 'Get pinned messages for a chat',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '6630a201c4fb58edce4d1006' },
          },
        ],
        responses: {
          200: { description: 'Pinned messages fetched' },
          403: { description: 'User is not a member of the chat' },
        },
      },
    },
    '/messages': {
      post: {
        tags: ['Messages'],
        summary: 'Send a direct or group message',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['receiver', 'message'],
                properties: {
                  receiver: { type: 'string', example: 'team-alpha' },
                  message: { type: 'string', example: 'hello group' },
                  ttl: {
                    type: 'string',
                    nullable: true,
                    enum: ['5m', '1h', '24h', '7d'],
                  },
                  parentMessageId: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Message sent' },
        },
      },
    },
    '/messages/{id}/pin': {
      post: {
        tags: ['Messages'],
        summary: 'Pin a message',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Message pinned' },
          403: { description: 'User is not allowed to pin this message' },
          404: { description: 'Message not found' },
        },
      },
      delete: {
        tags: ['Messages'],
        summary: 'Unpin a message',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Message unpinned' },
        },
      },
    },
    '/messages/{id}/thread': {
      get: {
        tags: ['Messages'],
        summary: 'Get a thread for a parent message',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Thread fetched' },
          404: { description: 'Message not found' },
        },
      },
    },
    '/messages/{id}/reactions': {
      post: {
        tags: ['Messages'],
        summary: 'Add an emoji reaction to a message',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['emoji'],
                properties: {
                  emoji: { type: 'string', example: '🔥' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Reaction added' },
        },
      },
    },
    '/messages/{id}/reactions/{emoji}': {
      delete: {
        tags: ['Messages'],
        summary: 'Remove an emoji reaction from a message',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'emoji', in: 'path', required: true, schema: { type: 'string', example: '🔥' } },
        ],
        responses: {
          200: { description: 'Reaction removed' },
          404: { description: 'Reaction not found' },
        },
      },
    },
    '/polls': {
      post: {
        tags: ['Polls'],
        summary: 'Create a poll',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question', 'options', 'chatId'],
                properties: {
                  question: { type: 'string', example: 'Lunch?' },
                  options: {
                    type: 'array',
                    minItems: 2,
                    items: { type: 'string' },
                    example: ['Pizza', 'Burger'],
                  },
                  chatId: { type: 'string', example: '6630a201c4fb58edce4d1006' },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                  isAnonymous: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Poll created' },
          422: { description: 'Validation failed' },
        },
      },
    },
    '/polls/{id}/vote': {
      post: {
        tags: ['Polls'],
        summary: 'Vote on a poll',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['optionId'],
                properties: {
                  optionId: { type: 'string', example: 'opt_01' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Poll updated' },
          400: { description: 'Invalid option' },
          409: { description: 'Already voted on this poll' },
        },
      },
    },
    '/polls/{id}': {
      get: {
        tags: ['Polls'],
        summary: 'Get a poll',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Poll fetched' },
          404: { description: 'Poll not found' },
        },
      },
    },
    '/rooms': {
      post: {
        tags: ['Rooms'],
        summary: 'Create an anonymous room',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  expiry: { type: 'string', enum: ['1h', '24h', '7d'], example: '24h' },
                  password: { type: 'string', nullable: true, example: 'roompass123' },
                  maxParticipants: { type: 'integer', example: 2 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Room created' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/rooms/{code}': {
      get: {
        tags: ['Rooms'],
        summary: 'Get anonymous room metadata',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Room fetched' },
          404: { description: 'Room not found' },
          410: { description: 'Room expired' },
        },
      },
    },
    '/rooms/{code}/join': {
      post: {
        tags: ['Rooms'],
        summary: 'Join an anonymous room',
        description: 'Sets a signed anonSession cookie used by the participant-list endpoint and anonymous socket auth.',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  password: { type: 'string', nullable: true, example: 'roompass123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Joined room' },
          401: { description: 'Invalid room password' },
          403: { description: 'Room is full' },
        },
      },
    },
    '/rooms/{code}/participants': {
      get: {
        tags: ['Rooms'],
        summary: 'List anonymous room participants',
        description: 'Requires the signed anonSession cookie from a successful join request.',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Participants fetched' },
          401: { description: 'Anonymous session missing' },
          403: { description: 'Anonymous session does not belong to this room' },
        },
      },
    },
    '/rooms/{code}/participants/{sessionId}': {
      delete: {
        tags: ['Rooms'],
        summary: 'Kick an anonymous participant',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Participant removed' },
          403: { description: 'Only the room creator may kick participants' },
          404: { description: 'Room or participant not found' },
        },
      },
    },
  },
};

module.exports = openApiSpec;
