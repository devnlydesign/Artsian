
import type { Timestamp } from 'firebase/firestore';

export type ContentType = 'post' | 'story' | 'reel' | 'music' | 'otherArt' | 'userProfile' | 'artwork'; // artwork for existing ArtworkData

export interface CommentData {
  id: string; // Auto-generated
  contentId: string; // Reference to posts, stories, reels, music, otherArt Document ID, or even userProfileId
  contentType: ContentType;
  userId: string; // User who made the comment
  commentText: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likesCount?: number; // For comment likes
  parentId?: string | null; // For threaded comments/replies
  mentionedUserIds?: string[];
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface LikeData {
  id: string; // Auto-generated (or composite ID: userId_contentId_contentType)
  contentId: string;
  contentType: ContentType;
  userId: string; // User who liked the content
  createdAt: Timestamp;
}

export interface BookmarkData {
  id: string; // Auto-generated (or composite ID: userId_contentId_contentType)
  userId: string;
  contentId: string;
  contentType: ContentType;
  collectionName?: string; // Optional, for user-defined bookmark collections/folders
  createdAt: Timestamp;
}

// For followers, this replaces src/actions/connectionActions.ts ConnectionData
export interface FollowData {
  id: string; // Composite ID: followerId_followingId
  followerId: string; // User initiating the follow
  followingId: string; // User being followed
  createdAt: Timestamp;
}

export interface NotificationData {
  id: string; // Auto-generated
  recipientId: string; // User who receives the notification
  senderId?: string | null; // User who triggered the notification (e.g., liker, commenter, follower)
  senderName?: string | null; // Denormalized for quick display
  senderAvatarUrl?: string | null; // Denormalized
  type: 'like' | 'comment' | 'follow' | 'mention' | 'new_post_from_followed_user' | 'system_message' | 'content_moderation_update';
  contentId?: string | null; // Optional, reference to the content involved (post, comment, etc.)
  contentType?: ContentType | null;
  message: string; // Display text for the notification
  linkTo?: string | null; // In-app navigation path
  read: boolean; // Default: false
  createdAt: Timestamp;
}

// For messages, this replaces src/actions/messageActions.ts ChatChannelData & ChatMessageData
export interface ConversationData { // Replaces ChatChannelData
  id: string; // Auto-generated or composite of participant UIDs
  participants: string[]; // Array of User UIDs involved in the chat
  participantInfo?: {
    [userId: string]: {
      name?: string;
      avatarUrl?: string | null;
    }
  };
  lastMessageText?: string | null;
  lastMessageTimestamp?: Timestamp | null;
  lastMessageSenderId?: string | null;
  unreadCounts?: { // For unread messages per user in this conversation
    [userId: string]: number;
  };
  isGroupChat: boolean; // Default: false
  groupName?: string | null; // If isGroupChat is true
  groupAvatarUrl?: string | null; // If isGroupChat is true
  createdBy?: string; // UserID of group creator
  admins?: string[]; // UserIDs of group admins
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageData { // Replaces ChatMessageData, subcollection under ConversationData
  id: string; // Auto-generated
  senderId: string;
  senderName?: string; // Denormalized
  senderAvatar?: string | null; // Denormalized
  messageText?: string | null; // Text content
  mediaUrl?: string | null; // For images, videos, audio in messages
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  timestamp: Timestamp;
  readBy?: string[]; // User UIDs who have read the message
  reactions?: { // For message reactions
    [emoji: string]: string[]; // emoji: [userId1, userId2]
  };
  isDeleted?: boolean;
  deletedFor?: string[]; // UserIDs for whom this message is deleted
}

    