/**
 * Type definitions for the Text-to-Image Extension
 */

// Message Types

export interface TextSelectedMessage {
  type: 'TEXT_SELECTED';
  text: string;
  url: string;
}

export interface GenerateFromSidepanelMessage {
  type: 'GENERATE_FROM_SIDEPANEL';
}

export interface GetCurrentSelectionMessage {
  type: 'GET_CURRENT_SELECTION';
}

export interface GetCurrentSelectionResponse {
  text: string;
  isValid: boolean;
  wasTruncated: boolean;
  error?: string;
}

export interface GenerationStartedMessage {
  type: 'GENERATION_STARTED';
  prompt: string;
}

export interface ImageGeneratedMessage {
  type: 'IMAGE_GENERATED';
  prompt: string;
  imageUrl: string;
}

export interface GenerationErrorMessage {
  type: 'GENERATION_ERROR';
  error: string;
}

export type ExtensionMessage =
  | TextSelectedMessage
  | GenerateFromSidepanelMessage
  | GetCurrentSelectionMessage
  | GenerationStartedMessage
  | ImageGeneratedMessage
  | GenerationErrorMessage;

// Storage Schema

export interface ExtensionStorage {
  apiKey?: string;
  history: HistoryItem[];
}

export interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

// FAL API Types

export interface FalImageRequest {
  prompt: string;
  image_size: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  num_inference_steps: number;
  num_images: number;
}

export interface FalImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}
