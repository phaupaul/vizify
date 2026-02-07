/**
 * Content Script for Text-to-Image Extension
 * 
 * This script is injected into all web pages to capture text selection
 * and communicate with the background service worker.
 */

// Store current selection in memory
let currentSelection: string = '';

// Maximum allowed text length (Requirement 1.4)
const MAX_TEXT_LENGTH = 1000;

/**
 * Validates if text is empty or whitespace-only
 * Requirement 1.2: Empty or whitespace-only text should be rejected
 */
function isEmptyOrWhitespace(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Truncates text to maximum length if needed
 * Requirement 1.4: Text exceeding 1000 characters should be truncated
 */
function truncateText(text: string): { text: string; wasTruncated: boolean } {
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      text: text.substring(0, MAX_TEXT_LENGTH),
      wasTruncated: true
    };
  }
  return {
    text: text,
    wasTruncated: false
  };
}

/**
 * Processes selected text with validation and truncation
 * Requirements 1.1, 1.2, 1.3, 1.4
 */
function processSelectedText(rawText: string): { 
  text: string; 
  isValid: boolean; 
  wasTruncated: boolean;
  error?: string;
} {
  // Requirement 1.3: Preserve exact text content including special characters
  // We trim whitespace from start/end but preserve internal formatting
  const trimmedText = rawText.trim();
  
  // Requirement 1.2: Check for empty or whitespace-only text
  if (isEmptyOrWhitespace(rawText)) {
    return {
      text: '',
      isValid: false,
      wasTruncated: false,
      error: 'Empty or whitespace-only selection'
    };
  }
  
  // Requirement 1.4: Truncate if exceeds maximum length
  const { text, wasTruncated } = truncateText(trimmedText);
  
  return {
    text,
    isValid: true,
    wasTruncated
  };
}

/**
 * Handle text selection changes on the page
 * Requirement 1.1: Capture selected text
 */
function handleSelectionChange(): void {
  const rawText = window.getSelection()?.toString() || '';
  
  // Process the selection with validation and truncation
  const processed = processSelectedText(rawText);
  
  if (processed.isValid) {
    // Store valid selection in memory
    currentSelection = processed.text;
  } else {
    // Clear selection if invalid
    currentSelection = '';
  }
}

/**
 * Listen for messages from background requesting current selection
 * Requirement 8.3: Respond to selection requests from background service
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_SELECTION') {
    const rawText = window.getSelection()?.toString() || '';
    const processed = processSelectedText(rawText);
    
    sendResponse({ 
      text: processed.text,
      isValid: processed.isValid,
      wasTruncated: processed.wasTruncated,
      error: processed.error
    });
  }
  return true; // Keep message channel open for async response
});

// Listen for selection changes
// Requirement 1.1: Detect text selection on any webpage
document.addEventListener('selectionchange', handleSelectionChange);
