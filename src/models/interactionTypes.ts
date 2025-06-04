
import type { Timestamp } from 'firebase/firestore';

export type ContentType = 'post' | 'story' | 'reel' | 'music' | 'otherArt' | 'userProfile' | 'artwork' | 'communityPost' | 'comment';

export interface CommentData {
  id: string; // Auto-generated
  contentId: string; // Reference to posts, stories, reels, music, otherArt Document ID, or even userProfileId
  contentType: ContentType;
  userId: string; // User who made the comment
  commentText: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likesCount?: number; // For comment likes, Initial: 0
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

export interface FollowData {
  id: string; // Composite ID: followerId_followingId
  followerId: string; // User initiating the follow
  followingId: string; // User being followed
  createdAt: Timestamp;
}

export interface NotificationData {
  id: string; // Auto-generated
  recipientId: string; // User who receives the notification
  actorId?: string | null; // User who triggered the notification (e.g., liker, commenter, follower)
  actorName?: string | null; // Denormalized for quick display
  actorAvatarUrl?: string | null; // Denormalized
  type: 'new_follower' | 'artwork_like' | 'artwork_comment' | 'community_post' | 'mention' | 'system_message' | 'content_moderation_update' | 'post_like' | 'post_comment' | 'reel_like' | 'reel_comment' | 'music_like' | 'music_comment' | 'otherArt_like' | 'otherArt_comment' | 'comment_like'; // Added more types
  entityId?: string | null; // Reference to the content involved (post, comment, etc.)
  entityType?: ContentType | null;
  message: string; // Display text for the notification
  linkTo?: string | null; // In-app navigation path
  read: boolean; // Default: false
  createdAt: Timestamp;
}

export interface ConversationData { 
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
  unreadCounts?: { 
    [userId: string]: number;
  };
  isGroupChat: boolean; // Default: false
  groupName?: string | null; 
  groupAvatarUrl?: string | null; 
  createdBy?: string; 
  admins?: string[]; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageData { 
  id: string; // Auto-generated
  senderId: string;
  senderName?: string; 
  senderAvatar?: string | null; 
  messageText?: string | null; 
  mediaUrl?: string | null; 
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  timestamp: Timestamp;
  readBy?: string[]; 
  reactions?: { 
    [emoji: string]: string[]; 
  };
  isDeleted?: boolean;
  deletedFor?: string[]; 
}
    
