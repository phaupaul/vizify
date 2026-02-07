/**
 * Storage utilities for API key management
 * 
 * This module provides functions for storing, retrieving, and validating
 * the FAL API key using Chrome's storage.local API.
 * 
 * Requirements: 6.2, 6.5
 */

/**
 * Validates the format of a FAL API key
 * 
 * FAL API keys should be non-empty strings without leading/trailing whitespace.
 * This is a basic format validation - actual authentication is verified by the API.
 * 
 * @param apiKey - The API key to validate
 * @returns true if the format is valid, false otherwise
 * 
 * Requirement 6.5: Validate API key format before saving
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // Check if the key is a non-empty string
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    return false;
  }
  
  // Check if the key has leading or trailing whitespace
  if (apiKey !== apiKey.trim()) {
    return false;
  }
  
  // Check minimum length (FAL API keys are typically longer)
  if (apiKey.length < 10) {
    return false;
  }
  
  return true;
}

/**
 * Saves an API key to Chrome's storage.local
 * 
 * @param apiKey - The API key to save
 * @returns Promise that resolves when the key is saved
 * @throws Error if the API key format is invalid
 * 
 * Requirement 6.2: Store API key using Chrome's storage API
 * Requirement 6.5: Validate format before saving
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  // Validate format before saving (Requirement 6.5)
  if (!validateApiKeyFormat(apiKey)) {
    throw new Error('Invalid API key format. Please provide a valid FAL API key.');
  }
  
  try {
    // Store the API key using chrome.storage.local (Requirement 6.2)
    await chrome.storage.local.set({ apiKey });
    console.log('API key saved successfully');
  } catch (error) {
    console.error('Failed to save API key:', error);
    throw new Error('Failed to save API key. Please check browser storage permissions.');
  }
}

/**
 * Retrieves the API key from Chrome's storage.local
 * 
 * @returns Promise that resolves with the API key, or undefined if not set
 * 
 * Requirement 6.2: Retrieve API key using Chrome's storage API
 */
export async function getApiKey(): Promise<string | undefined> {
  try {
    const result = await chrome.storage.local.get('apiKey');
    return result.apiKey;
  } catch (error) {
    console.error('Failed to retrieve API key:', error);
    throw new Error('Failed to retrieve API key. Please check browser storage permissions.');
  }
}

/**
 * Checks if an API key is configured
 * 
 * @returns Promise that resolves with true if an API key exists, false otherwise
 */
export async function hasApiKey(): Promise<boolean> {
  const apiKey = await getApiKey();
  return apiKey !== undefined && apiKey.length > 0;
}

/**
 * Removes the API key from storage
 * 
 * @returns Promise that resolves when the key is removed
 */
export async function removeApiKey(): Promise<void> {
  try {
    await chrome.storage.local.remove('apiKey');
    console.log('API key removed successfully');
  } catch (error) {
    console.error('Failed to remove API key:', error);
    throw new Error('Failed to remove API key. Please check browser storage permissions.');
  }
}

/**
 * History item interface
 * 
 * Represents a single generated image in the history
 */
export interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

/**
 * Maximum number of history items to store
 * 
 * Requirement 5.3: History size limit of 50 items
 */
const MAX_HISTORY_SIZE = 50;

/**
 * Adds a generated image to the history
 * 
 * Stores the image URL, prompt, timestamp, and a unique ID.
 * If the history exceeds 50 items, removes the oldest entries.
 * 
 * @param prompt - The text prompt used to generate the image
 * @param imageUrl - The URL of the generated image
 * @returns Promise that resolves when the item is added
 * 
 * Requirement 5.1: Store image URL and prompt in history
 * Requirement 5.3: Remove oldest entries when limit exceeded
 */
export async function addToHistory(prompt: string, imageUrl: string): Promise<void> {
  try {
    // Get current history
    const { history = [] } = await chrome.storage.local.get('history');
    
    // Create new history item with unique ID and timestamp
    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      prompt,
      imageUrl,
      timestamp: Date.now()
    };
    
    // Add new item to the beginning (newest first)
    const updatedHistory = [newItem, ...history];
    
    // Limit history size to MAX_HISTORY_SIZE (Requirement 5.3)
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_SIZE);
    
    // Save updated history
    await chrome.storage.local.set({ history: limitedHistory });
    
    console.log('Added item to history:', newItem.id);
  } catch (error) {
    console.error('Failed to add to history:', error);
    throw new Error('Failed to save to history. Please check browser storage permissions.');
  }
}

/**
 * Retrieves the image history
 * 
 * Returns all history items in chronological order (newest first).
 * 
 * @returns Promise that resolves with the history array
 * 
 * Requirement 5.2: Display history in chronological order (newest first)
 */
export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const { history = [] } = await chrome.storage.local.get('history');
    return history;
  } catch (error) {
    console.error('Failed to retrieve history:', error);
    throw new Error('Failed to retrieve history. Please check browser storage permissions.');
  }
}

/**
 * Clears all items from the history
 * 
 * @returns Promise that resolves when the history is cleared
 * 
 * Requirement 5.5: Provide button to clear all history
 */
export async function clearHistory(): Promise<void> {
  try {
    await chrome.storage.local.set({ history: [] });
    console.log('History cleared successfully');
  } catch (error) {
    console.error('Failed to clear history:', error);
    throw new Error('Failed to clear history. Please check browser storage permissions.');
  }
}
