-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "number" INTEGER,
    "phone" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'personal',
    "profileImage" TEXT NOT NULL DEFAULT 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg',
    "avatar" TEXT,
    "socketId" TEXT NOT NULL DEFAULT '',
    "refreshTokenHash" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "dndEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dndSchedule" JSONB,
    "dndPeriod" JSONB,
    "dndWhitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "msg" TEXT NOT NULL DEFAULT '',
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "chatId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "ttl" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedBy" TEXT,
    "parentMessageId" TEXT,
    "replyTo" JSONB,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "hiddenFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "statusContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileImage" TEXT NOT NULL DEFAULT 'https://imgs.search.brave.com/0bM_YGELGhDRpkha170xdj62rM1gANg5mUFtcD3Jcqw/rs:fit:860:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzJmLzU5/L2VmLzJmNTllZjc0/M2ZkYjliZmNmN2Yw/YTIxYjYzYTAwZjdlLmpwZw',
    "users" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "chatId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "mediaUrl" TEXT NOT NULL DEFAULT '',
    "style" JSONB,
    "replies" JSONB NOT NULL DEFAULT '[]',
    "reactions" JSONB NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "callerId" TEXT,
    "receiverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'calling',
    "type" TEXT NOT NULL DEFAULT 'one-to-one',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anon_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "passwordHash" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anon_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anon_participants" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL,
    "avatarAnimal" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anon_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anon_messages" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedBySessionId" TEXT,
    "parentMessageId" TEXT,
    "replyTo" JSONB,
    "reactions" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anon_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anon_polls" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "createdBySessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anon_polls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "messages_chatId_idx" ON "messages"("chatId");

-- CreateIndex
CREATE INDEX "messages_parentMessageId_idx" ON "messages"("parentMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");

-- CreateIndex
CREATE INDEX "polls_chatId_idx" ON "polls"("chatId");

-- CreateIndex
CREATE INDEX "reactions_messageId_idx" ON "reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_messageId_userId_key" ON "reactions"("messageId", "userId");

-- CreateIndex
CREATE INDEX "statuses_userId_idx" ON "statuses"("userId");

-- CreateIndex
CREATE INDEX "statuses_expiresAt_idx" ON "statuses"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "calls_callId_key" ON "calls"("callId");

-- CreateIndex
CREATE INDEX "calls_roomId_idx" ON "calls"("roomId");

-- CreateIndex
CREATE INDEX "calls_callerId_idx" ON "calls"("callerId");

-- CreateIndex
CREATE INDEX "calls_receiverId_idx" ON "calls"("receiverId");

-- CreateIndex
CREATE INDEX "calls_status_idx" ON "calls"("status");

-- CreateIndex
CREATE UNIQUE INDEX "anon_rooms_code_key" ON "anon_rooms"("code");

-- CreateIndex
CREATE INDEX "anon_rooms_code_idx" ON "anon_rooms"("code");

-- CreateIndex
CREATE INDEX "anon_rooms_expiresAt_idx" ON "anon_rooms"("expiresAt");

-- CreateIndex
CREATE INDEX "anon_participants_roomCode_idx" ON "anon_participants"("roomCode");

-- CreateIndex
CREATE INDEX "anon_participants_sessionId_idx" ON "anon_participants"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "anon_participants_roomCode_sessionId_key" ON "anon_participants"("roomCode", "sessionId");

-- CreateIndex
CREATE INDEX "anon_messages_roomCode_idx" ON "anon_messages"("roomCode");

-- CreateIndex
CREATE INDEX "anon_messages_parentMessageId_idx" ON "anon_messages"("parentMessageId");

-- CreateIndex
CREATE INDEX "anon_messages_expiresAt_idx" ON "anon_messages"("expiresAt");

-- CreateIndex
CREATE INDEX "anon_polls_roomCode_idx" ON "anon_polls"("roomCode");

