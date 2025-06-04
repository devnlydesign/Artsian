
import type { Timestamp } from 'firebase/firestore';

export interface PostData {
  id: string; // Auto-generated
  userId: string; // Reference to users collection
  contentType: 'text' | 'image' | 'video' | 'audio' | 'livestream_upcoming' | 'livestream_live' | 'livestream_ended';
  contentUrl?: string; // URL to Firebase Storage for media (optional for text posts)
  caption?: string;
  hashtags?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likesCount: number; // Initial: 0
  commentsCount: number; // Initial: 0
  sharesCount: number; // Initial: 0
  isPublic: boolean; // Default: true
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  // Additional fields for livestream if needed
  livestreamDetails?: {
    scheduledStartTime?: Timestamp;
    actualStartTime?: Timestamp;
    endTime?: Timestamp;
    playbackUrl?: string; // For ended livestreams
    liveViewerCount?: number;
  };
}

export interface StoryData {
  id: string; // Auto-generated
  userId: string;
  mediaUrl: string; // URL to Firebase Storage
  mediaType: 'image' | 'video';
  createdAt: Timestamp;
  expiresAt: Timestamp; // e.g., 24 hours after creation
  viewsCount: number; // Initial: 0
  // For interactive elements like polls, quizzes (future)
  // interactiveElements?: any[]; 
  seenBy?: string[]; // Array of userIds who have seen the story
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}

// Using existing ReelData from reelActions.ts and updating it
// No, this prompt defines a new Reels structure.
// import type { ReelData as ExistingReelData } from '@/actions/reelActions';
export interface SocialReelData {
  id: string; // Auto-generated
  userId: string;
  videoUrl: string; // URL to Firebase Storage
  videoUrlOriginal?: string;
  videoThumbnailUrl?: string;
  audioTrackId?: string; // Reference to music collection or external audio
  caption?: string;
  hashtags?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount?: number;
  isPublished?: boolean; // Different from PostData.isPublic
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface MusicData {
  id: string; // Auto-generated
  userId: string;
  audioUrl: string; // URL to Firebase Storage
  title: string;
  artist: string; // User's username or custom artist name
  genre?: string;
  thumbnailUrl?: string; // Optional, for album art (URL to Firebase Storage)
  durationSeconds?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  playsCount: number;
  likesCount: number;
  isPublished?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface OtherArtData {
  id: string; // Auto-generated
  userId: string;
  mediaUrl: string; // URL to Firebase Storage
  mediaType: 'drawing' | 'painting' | 'sculpture' | 'animation' | '3d_model' | 'photo' | 'mixed_media' | 'other';
  title: string;
  description?: string;
  hashtags?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isPublic: boolean; // Default: true
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}
    