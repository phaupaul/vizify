/**
 * FAL API Client Module
 * 
 * This module provides functions for communicating with the FAL image generation API.
 * It handles request formatting, authentication, response parsing, and URL validation.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2
 */

import type { FalImageRequest, FalImageResponse } from '../types';

/**
 * FAL API endpoint for image generation
 */
const FAL_API_ENDPOINT = 'https://fal.run/fal-ai/flux/schnell';

/**
 * Custom error class for API-related errors with user-friendly messages
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Validates that a URL string is properly formatted
 * 
 * @param url - The URL string to validate
 * @returns true if the URL is valid, false otherwise
 * 
 * Requirement 4.5: Validate image URL format before displaying
 */
export function validateImageUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }
  
  try {
    const urlObject = new URL(url);
    // Check that it's an HTTP or HTTPS URL
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Parses API error response and returns user-friendly message
 * 
 * @param statusCode - HTTP status code from the API response
 * @param errorText - Error text from the API response
 * @returns User-friendly error message
 * 
 * Requirement 7.1: Display user-friendly error messages
 */
function parseApiError(statusCode: number, errorText: string): string {
  // Handle rate limiting (Requirement 7.1)
  if (statusCode === 429) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  
  // Handle authentication errors (Requirement 7.1)
  if (statusCode === 401 || statusCode === 403) {
    return 'Invalid or expired API key. Please check your API key in settings.';
  }
  
  // Handle bad request errors
  if (statusCode === 400) {
    return 'Invalid request. Please try a different prompt.';
  }
  
  // Handle server errors
  if (statusCode >= 500) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  // Generic error message with details if available
  return errorText ? `Failed to generate image: ${errorText}` : 'Failed to generate image. Please try again.';
}

/**
 * Calls the FAL API to generate an image from a text prompt
 * 
 * @param prompt - The text prompt to generate an image from
 * @param apiKey - The FAL API key for authentication
 * @returns Promise that resolves with the generated image URL
 * @throws ApiError with user-friendly message if the API request fails
 * 
 * Requirements:
 * - 4.1: Send text prompt to FAL API
 * - 4.2: Include API key in Authorization header
 * - 4.3: Extract image URL from response
 * - 4.4: Capture error message and pass to Sidepanel
 * - 4.5: Validate image URL format
 * - 7.1: Display user-friendly error messages
 * - 7.2: Handle network errors with appropriate message
 */
export async function callFalAPI(prompt: string, apiKey: string): Promise<string> {
  // Configure request body with prompt and image parameters (Requirement 4.1)
  const requestBody: FalImageRequest = {
    prompt: prompt,
    image_size: 'landscape_4_3',
    num_inference_steps: 4,
    num_images: 1
  };
  
  try {
    // Make API request with proper authentication (Requirement 4.2)
    const response = await fetch(FAL_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`, // Include API key in Authorization header (Requirement 4.2)
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Check if the response was successful
    if (!response.ok) {
      // Requirement 4.4: Capture error message
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        // If we can't read the error text, use status text
        errorText = response.statusText;
      }
      
      // Parse error and create user-friendly message (Requirement 7.1)
      const userMessage = parseApiError(response.status, errorText);
      const technicalMessage = `FAL API error (${response.status}): ${errorText || response.statusText}`;
      
      // Log detailed error for debugging
      console.error('FAL API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      // Throw ApiError with both technical and user-friendly messages (Requirement 4.4)
      throw new ApiError(technicalMessage, userMessage, response.status);
    }
    
    // Parse response and extract image URL (Requirement 4.3)
    const data: FalImageResponse = await response.json();
    
    // Validate response structure
    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
      const technicalMessage = 'Invalid API response: no images returned';
      const userMessage = 'Failed to generate image. The service returned an invalid response.';
      console.error(technicalMessage, data);
      throw new ApiError(technicalMessage, userMessage);
    }
    
    const imageUrl = data.images[0].url;
    
    // Validate image URL format before returning (Requirement 4.5)
    if (!validateImageUrl(imageUrl)) {
      const technicalMessage = 'Invalid image URL format received from API';
      const userMessage = 'Failed to generate image. The service returned an invalid image URL.';
      console.error(technicalMessage, imageUrl);
      throw new ApiError(technicalMessage, userMessage);
    }
    
    console.log('Successfully generated image:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors (Requirement 7.2)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const technicalMessage = 'Network error: Unable to connect to FAL API';
      const userMessage = 'Network error. Please check your internet connection and try again.';
      console.error(technicalMessage, error);
      throw new ApiError(technicalMessage, userMessage, undefined, error as Error);
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      const technicalMessage = 'Failed to parse API response';
      const userMessage = 'Failed to generate image. The service returned an invalid response.';
      console.error(technicalMessage, error);
      throw new ApiError(technicalMessage, userMessage, undefined, error as Error);
    }
    
    // Handle any other unexpected errors
    const technicalMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const userMessage = 'An unexpected error occurred. Please try again.';
    console.error('Unexpected error in callFalAPI:', error);
    throw new ApiError(technicalMessage, userMessage, undefined, error instanceof Error ? error : undefined);
  }
}
