/**
 * Background Service Worker for Text-to-Image Extension
 * 
 * This service worker manages the extension lifecycle, handles context menu
 * interactions, coordinates message passing, and communicates with the FAL API.
 */

import type {
  ExtensionMessage,
  TextSelectedMessage,
  GenerateFromSidepanelMessage,
  GetCurrentSelectionMessage,
  GenerationStartedMessage,
  ImageGeneratedMessage,
  GenerationErrorMessage
} from '../types';
import { getApiKey, addToHistory } from './storage.js';
import { callFalAPI, ApiError } from './falApi.js';

/**
 * Initialize context menu on extension install
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generate-image',
    title: 'Generate Image',
    contexts: ['selection']
  });
  
  console.log('Text-to-Image Extension installed');
});

/**
 * Handle context menu clicks
 * Opens sidepanel when "Generate Image" is clicked (Requirement 2.5)
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'generate-image' && info.selectionText && tab?.id) {
    console.log('Context menu clicked with text:', info.selectionText);
    
    try {
      // Open sidepanel (Requirement 2.5)
      // Note: chrome.sidePanel.open() is idempotent - calling it when the sidepanel
      // is already open won't cause issues, so we don't need to check if it's open
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('Sidepanel opened for tab:', tab.id);
      
      // TODO: Trigger image generation
    } catch (error) {
      console.error('Failed to open sidepanel:', error);
    }
  }
});

/**
 * Handle messages from content scripts and sidepanel
 * Implements message routing based on message type (Requirement 8.4)
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('Background received message:', message.type);
  
  // Route messages based on type identifier (Requirement 8.4)
  switch (message.type) {
    case 'TEXT_SELECTED':
      handleTextSelected(message as TextSelectedMessage, sender);
      break;
      
    case 'GENERATE_FROM_SIDEPANEL':
      handleGenerateFromSidepanel(message as GenerateFromSidepanelMessage, sender);
      break;
      
    case 'GET_CURRENT_SELECTION':
      // This message is sent from background to content script, not handled here
      break;
      
    case 'GENERATION_STARTED':
    case 'IMAGE_GENERATED':
    case 'GENERATION_ERROR':
      // These messages are sent from background to sidepanel, not handled here
      break;
      
    default:
      console.warn('Unknown message type received:', (message as any).type);
  }
  
  return true; // Keep message channel open for async response
});

/**
 * Handle TEXT_SELECTED message from content script
 * Stores the selected text for potential image generation
 */
function handleTextSelected(message: TextSelectedMessage, sender: chrome.runtime.MessageSender): void {
  console.log('Text selected:', message.text, 'from URL:', message.url);
  // TODO: Store selection or trigger generation based on context
}

/**
 * Handle GENERATE_FROM_SIDEPANEL message
 * Requests current selection from active tab and initiates image generation
 */
async function handleGenerateFromSidepanel(
  message: GenerateFromSidepanelMessage,
  sender: chrome.runtime.MessageSender
): Promise<void> {
  console.log('Generate from sidepanel requested');
  
  try {
    // Get the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs[0]?.id) {
      notifySidepanel({
        type: 'GENERATION_ERROR',
        error: 'No active tab found'
      });
      return;
    }
    
    // Request current selection from content script
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      type: 'GET_CURRENT_SELECTION'
    });
    
    if (response && response.text) {
      // Trigger image generation with response.text
      await generateImage(response.text);
    } else {
      notifySidepanel({
        type: 'GENERATION_ERROR',
        error: response?.error || 'No text selected. Please highlight some text on the page.'
      });
    }
  } catch (error) {
    console.error('Error getting current selection:', error);
    notifySidepanel({
      type: 'GENERATION_ERROR',
      error: 'Failed to get text selection. Please try again.'
    });
  }
}

/**
 * Send a message to the sidepanel
 * Implements communication from background to sidepanel (Requirement 8.2)
 */
function notifySidepanel(message: GenerationStartedMessage | ImageGeneratedMessage | GenerationErrorMessage): void {
  // Send message to all extension contexts (sidepanel will receive it)
  chrome.runtime.sendMessage(message).catch((error) => {
    // Sidepanel might not be open, which is okay
    console.log('Could not send message to sidepanel:', error.message);
  });
}

/**
 * Generate an image from a text prompt
 * Checks for API key before attempting generation (Requirement 6.3)
 * Handles API errors with user-friendly messages (Requirements 4.4, 7.1, 7.2)
 * 
 * @param prompt - The text prompt to generate an image from
 */
async function generateImage(prompt: string): Promise<void> {
  try {
    // Check for API key before generation (Requirement 6.3)
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      notifySidepanel({
        type: 'GENERATION_ERROR',
        error: 'API key not configured. Please add your FAL API key in settings.'
      });
      return;
    }
    
    // Notify sidepanel that generation has started (Requirement 9.1)
    notifySidepanel({
      type: 'GENERATION_STARTED',
      prompt: prompt
    });
    
    // Call FAL API to generate image (Requirements 4.1, 4.2, 4.3, 4.5)
    const imageUrl = await callFalAPI(prompt, apiKey);
    
    // Store in history (Requirement 5.1)
    await addToHistory(prompt, imageUrl);
    
    // Notify sidepanel of successful generation
    notifySidepanel({
      type: 'IMAGE_GENERATED',
      prompt: prompt,
      imageUrl: imageUrl
    });
    
    console.log('Image generation completed successfully');
    
  } catch (error) {
    // Log detailed error for debugging (Requirement 7.4)
    console.error('Error during image generation:', error);
    
    // Extract user-friendly error message (Requirements 4.4, 7.1, 7.2)
    let errorMessage: string;
    
    if (error instanceof ApiError) {
      // Use the user-friendly message from ApiError
      errorMessage = error.userMessage;
    } else if (error instanceof Error) {
      // Fallback to error message for non-API errors
      errorMessage = error.message;
    } else {
      // Generic fallback
      errorMessage = 'Failed to generate image. Please try again.';
    }
    
    notifySidepanel({
      type: 'GENERATION_ERROR',
      error: errorMessage
    });
  }
}
