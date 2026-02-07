/**
 * Sidepanel Script for Text-to-Image Extension
 * 
 * This script manages the sidepanel UI, displays generated images,
 * handles user interactions, and communicates with the background service.
 */

import type {
  ExtensionMessage,
  GenerationStartedMessage,
  ImageGeneratedMessage,
  GenerationErrorMessage,
  HistoryItem
} from '../types';

// Store last failed prompt for retry functionality
let lastFailedPrompt: string | null = null;

/**
 * Initialize the sidepanel when loaded
 * Task 11.1: Create sidepanel initialization
 * Requirements: 6.1, 5.2
 */
async function initializeSidepanel(): Promise<void> {
  console.log('Sidepanel initialized');
  
  try {
    // Check for API key and show prompt if missing (Requirement 6.1)
    const { apiKey } = await chrome.storage.local.get('apiKey');
    if (!apiKey) {
      showApiKeyPrompt();
    }
    
    // Load and display image history (Requirement 5.2)
    await loadHistory();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('Sidepanel initialization complete');
  } catch (error) {
    console.error('Error initializing sidepanel:', error);
    showError('Failed to initialize sidepanel. Please refresh the page.');
  }
}

/**
 * Show API key prompt when no key is configured
 * Requirement 6.1: Prompt user to enter API key on first install
 */
function showApiKeyPrompt(): void {
  const generationArea = document.getElementById('current-generation');
  if (!generationArea) return;
  
  generationArea.innerHTML = `
    <div class="api-key-prompt">
      <p><strong>Welcome to Text to Image!</strong></p>
      <p>To get started, please configure your FAL API key in settings.</p>
      <button id="open-settings-prompt-btn" class="primary-btn">Open Settings</button>
    </div>
  `;
  
  const openSettingsBtn = document.getElementById('open-settings-prompt-btn');
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', showSettingsModal);
  }
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners(): void {
  const generateBtn = document.getElementById('generate-btn');
  const generateFromInputBtn = document.getElementById('generate-from-input-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const saveApiKeyBtn = document.getElementById('save-api-key-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateClick);
  }
  
  if (generateFromInputBtn) {
    generateFromInputBtn.addEventListener('click', handleGenerateFromInput);
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showSettingsModal);
  }
  
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', hideSettingsModal);
  }
  
  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
  }
  
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', handleClearHistory);
  }
}

/**
 * Handle generate from input button click
 */
async function handleGenerateFromInput(): Promise<void> {
  console.log('Generate from input clicked');
  
  const input = document.getElementById('prompt-input') as HTMLTextAreaElement;
  if (!input) return;
  
  const prompt = input.value.trim();
  
  if (!prompt) {
    showError('Please enter some text to generate an image.');
    return;
  }
  
  try {
    // Check if API key is configured
    const { apiKey } = await chrome.storage.local.get('apiKey');
    
    if (!apiKey) {
      showError('API key not configured. Please add your FAL API key in settings.');
      return;
    }
    
    // Send the prompt directly to background for generation
    chrome.runtime.sendMessage({
      type: 'GENERATE_FROM_PROMPT',
      prompt: prompt
    });
    
    // Clear the input
    input.value = '';
    
  } catch (error) {
    console.error('Error triggering generation:', error);
    showError('Failed to trigger generation. Please try again.');
  }
}

/**
 * Handle generate button click
 * Task 14.1: Implement generate button handler
 * Requirements: 3.5, 8.3
 */
async function handleGenerateClick(): Promise<void> {
  console.log('Generate button clicked');
  
  try {
    // Check if API key is configured
    const { apiKey } = await chrome.storage.local.get('apiKey');
    if (!apiKey) {
      showError('API key not configured. Please add your FAL API key in settings.');
      return;
    }
    
    // Send message to background to generate from current selection (Requirement 8.3)
    chrome.runtime.sendMessage({
      type: 'GENERATE_FROM_SIDEPANEL'
    });
    
  } catch (error) {
    console.error('Error triggering generation:', error);
    showError('Failed to trigger generation. Please try again.');
  }
}

/**
 * Show settings modal
 * Task 15.1: Create settings modal functionality
 * Requirements: 6.4, 6.5
 */
function showSettingsModal(): void {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  
  // Load current API key (masked) into input
  chrome.storage.local.get('apiKey').then(({ apiKey }) => {
    const input = document.getElementById('api-key-input') as HTMLInputElement;
    if (input && apiKey) {
      // Show masked version of API key
      input.value = apiKey;
      input.placeholder = 'Enter your FAL API key';
    }
  });
  
  modal.classList.remove('hidden');
}

/**
 * Hide settings modal
 */
function hideSettingsModal(): void {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Validate API key format
 * Requirement 6.5: Validate API key format before saving
 */
function validateApiKeyFormat(apiKey: string): boolean {
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
 * Handle save API key
 * Task 15.1: Create settings modal functionality
 * Requirements: 6.4, 6.5
 */
async function handleSaveApiKey(): Promise<void> {
  console.log('Save API key clicked');
  
  const input = document.getElementById('api-key-input') as HTMLInputElement;
  if (!input) return;
  
  const apiKey = input.value.trim();
  
  // Validate API key format (Requirement 6.5)
  if (!validateApiKeyFormat(apiKey)) {
    showErrorInModal('Invalid API key format. Please provide a valid FAL API key (minimum 10 characters).');
    return;
  }
  
  try {
    // Save API key to storage (Requirement 6.4)
    await chrome.storage.local.set({ apiKey });
    
    // Show success feedback
    showSuccessInModal('API key saved successfully!');
    
    // Close modal after a short delay
    setTimeout(() => {
      hideSettingsModal();
      
      // Refresh the UI if this was the first API key
      const generationArea = document.getElementById('current-generation');
      if (generationArea && generationArea.querySelector('.api-key-prompt')) {
        generationArea.innerHTML = `
          <div class="generation-area-empty">
            <div class="icon">🎨</div>
            <p>Select text on any webpage and click "Generate from Selection"</p>
            <p>or use the right-click context menu</p>
          </div>
        `;
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error saving API key:', error);
    showErrorInModal('Failed to save API key. Please try again.');
  }
}

/**
 * Show error message in settings modal
 */
function showErrorInModal(message: string): void {
  const modalContent = document.querySelector('.modal-content');
  if (!modalContent) return;
  
  // Remove any existing messages
  const existingMsg = modalContent.querySelector('.error-message, .success-message');
  if (existingMsg) {
    existingMsg.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  const formGroup = modalContent.querySelector('.form-group');
  if (formGroup) {
    formGroup.insertAdjacentElement('afterend', errorDiv);
  }
}

/**
 * Show success message in settings modal
 */
function showSuccessInModal(message: string): void {
  const modalContent = document.querySelector('.modal-content');
  if (!modalContent) return;
  
  // Remove any existing messages
  const existingMsg = modalContent.querySelector('.error-message, .success-message');
  if (existingMsg) {
    existingMsg.remove();
  }
  
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  
  const formGroup = modalContent.querySelector('.form-group');
  if (formGroup) {
    formGroup.insertAdjacentElement('afterend', successDiv);
  }
}

/**
 * Handle clear history
 */
async function handleClearHistory(): Promise<void> {
  console.log('Clear history clicked');
  
  if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) {
    return;
  }
  
  try {
    // Clear history from storage
    await chrome.storage.local.set({ history: [] });
    
    // Clear history UI
    const historyContainer = document.getElementById('history-container');
    if (historyContainer) {
      historyContainer.innerHTML = '<p class="empty-state">No images generated yet</p>';
    }
    
    console.log('History cleared successfully');
  } catch (error) {
    console.error('Error clearing history:', error);
    showError('Failed to clear history. Please try again.');
  }
}

/**
 * Show loading state
 * Task 12.1: Create loading state display function
 * Requirements: 3.2, 9.1, 9.2, 9.3
 */
function showLoadingState(prompt: string): void {
  const container = document.getElementById('current-generation');
  if (!container) return;
  
  container.classList.add('has-content');
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p class="prompt">"${escapeHtml(prompt)}"</p>
      <p class="status">Generating image...</p>
    </div>
  `;
  
  // Disable generate button during loading (Requirement 9.3)
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  if (generateBtn) {
    generateBtn.disabled = true;
  }
}

/**
 * Display generated image
 * Task 12.3: Create success state display function
 * Requirements: 3.3, 9.4
 */
function displayGeneratedImage(prompt: string, imageUrl: string): void {
  const container = document.getElementById('current-generation');
  if (!container) return;
  
  container.classList.add('has-content');
  container.innerHTML = `
    <div class="image-result">
      <img src="${escapeHtml(imageUrl)}" alt="Generated image" data-url="${escapeHtml(imageUrl)}">
      <p class="prompt">"${escapeHtml(prompt)}"</p>
      <div class="actions">
        <button class="open-full-btn" data-url="${escapeHtml(imageUrl)}">Open Full Size</button>
        <button class="copy-url-btn" data-url="${escapeHtml(imageUrl)}">Copy URL</button>
        <button class="download-btn" data-url="${escapeHtml(imageUrl)}" data-prompt="${escapeHtml(prompt)}">Download</button>
      </div>
    </div>
  `;
  
  // Re-enable generate button (Requirement 9.4)
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  if (generateBtn) {
    generateBtn.disabled = false;
  }
  
  // Set up image click handler (Task 14.3)
  const img = container.querySelector('img');
  if (img) {
    img.addEventListener('click', () => openInNewTab(imageUrl));
    img.style.cursor = 'pointer';
  }
  
  // Set up action button handlers
  const openBtn = container.querySelector('.open-full-btn');
  if (openBtn) {
    openBtn.addEventListener('click', () => openInNewTab(imageUrl));
  }
  
  const copyBtn = container.querySelector('.copy-url-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyUrlToClipboard(imageUrl));
  }
  
  const downloadBtn = container.querySelector('.download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => downloadImage(imageUrl, prompt));
  }
}

/**
 * Show error state
 * Task 12.5: Create error state display function
 * Requirements: 7.1, 7.5
 */
function showError(errorMessage: string): void {
  const container = document.getElementById('current-generation');
  if (!container) return;
  
  container.classList.add('has-content');
  container.innerHTML = `
    <div class="error-message">
      <strong>Error</strong>
      <p>${escapeHtml(errorMessage)}</p>
      ${lastFailedPrompt ? '<button class="retry-button">Retry</button>' : ''}
    </div>
  `;
  
  // Re-enable generate button
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  if (generateBtn) {
    generateBtn.disabled = false;
  }
  
  // Set up retry button if available (Requirement 7.5)
  const retryBtn = container.querySelector('.retry-button');
  if (retryBtn && lastFailedPrompt) {
    retryBtn.addEventListener('click', () => {
      // Retry with the last failed prompt
      chrome.runtime.sendMessage({
        type: 'GENERATE_FROM_SIDEPANEL'
      });
    });
  }
}

/**
 * Load and display history
 * Task 13.1: Create history rendering function
 * Requirements: 5.2, 5.4
 */
async function loadHistory(): Promise<void> {
  try {
    const { history = [] } = await chrome.storage.local.get('history');
    const container = document.getElementById('history-container');
    
    if (!container) return;
    
    if (history.length === 0) {
      container.innerHTML = '<p class="empty-state">No images generated yet</p>';
      return;
    }
    
    // History is already sorted chronologically (newest first) from storage (Requirement 5.2)
    container.innerHTML = history.map((item: HistoryItem) => `
      <div class="history-item" data-url="${escapeHtml(item.imageUrl)}">
        <img src="${escapeHtml(item.imageUrl)}" alt="Generated image" loading="lazy">
        <p class="history-prompt">${escapeHtml(item.prompt)}</p>
      </div>
    `).join('');
    
    // Add click handlers to history items (Requirement 10.2)
    const historyItems = container.querySelectorAll('.history-item');
    historyItems.forEach(item => {
      const url = item.getAttribute('data-url');
      if (url) {
        item.addEventListener('click', () => openInNewTab(url));
      }
    });
    
  } catch (error) {
    console.error('Error loading history:', error);
    const container = document.getElementById('history-container');
    if (container) {
      container.innerHTML = '<p class="empty-state">Failed to load history</p>';
    }
  }
}

/**
 * Add new item to history UI
 * Requirement 5.1, 5.2: Add to history and maintain chronological order
 */
function addToHistoryUI(prompt: string, imageUrl: string): void {
  const container = document.getElementById('history-container');
  if (!container) return;
  
  // Remove empty state if present
  const emptyState = container.querySelector('.empty-state');
  if (emptyState) {
    container.innerHTML = '';
  }
  
  // Create new history item
  const historyItem = document.createElement('div');
  historyItem.className = 'history-item';
  historyItem.setAttribute('data-url', imageUrl);
  historyItem.innerHTML = `
    <img src="${escapeHtml(imageUrl)}" alt="Generated image" loading="lazy">
    <p class="history-prompt">${escapeHtml(prompt)}</p>
  `;
  
  // Add click handler
  historyItem.addEventListener('click', () => openInNewTab(imageUrl));
  
  // Insert at the beginning (newest first - Requirement 5.2)
  container.insertBefore(historyItem, container.firstChild);
}

/**
 * Open image in new tab
 * Task 14.3: Implement image click handler
 * Requirement 10.2: Open full-size image in new tab when clicked
 */
function openInNewTab(imageUrl: string): void {
  chrome.tabs.create({ url: imageUrl });
}

/**
 * Copy URL to clipboard
 * Task 14.5: Implement copy URL button
 * Requirement 10.4: Copy image URL to clipboard
 */
async function copyUrlToClipboard(imageUrl: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(imageUrl);
    
    // Show success feedback
    const copyBtn = document.querySelector('.copy-url-btn');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    }
    
    console.log('URL copied to clipboard');
  } catch (error) {
    console.error('Error copying URL:', error);
    showError('Failed to copy URL to clipboard.');
  }
}

/**
 * Download image
 * Task 14.7: Implement download button
 * Requirement 10.3: Download image to computer
 */
function downloadImage(imageUrl: string, prompt: string): void {
  try {
    // Sanitize prompt for filename
    const sanitizedPrompt = prompt
      .substring(0, 50) // Limit length
      .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with underscore
      .toLowerCase();
    
    const filename = `text-to-image_${sanitizedPrompt}_${Date.now()}.png`;
    
    // Use Chrome's download API
    chrome.downloads.download({
      url: imageUrl,
      filename: filename,
      saveAs: true
    });
    
    console.log('Download initiated:', filename);
  } catch (error) {
    console.error('Error downloading image:', error);
    showError('Failed to download image.');
  }
}

/**
 * Escape HTML to prevent XSS
 * Requirement 1.3: Preserve exact text content safely
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Listen for messages from background
 * Task 11.3: Implement message listener for background updates
 * Requirement 8.2: Handle messages from background service
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('Sidepanel received message:', message.type);
  
  // Route messages to appropriate handlers
  switch (message.type) {
    case 'GENERATION_STARTED':
      const startedMsg = message as GenerationStartedMessage;
      lastFailedPrompt = startedMsg.prompt; // Store for potential retry
      showLoadingState(startedMsg.prompt);
      break;
      
    case 'IMAGE_GENERATED':
      const generatedMsg = message as ImageGeneratedMessage;
      lastFailedPrompt = null; // Clear failed prompt on success
      displayGeneratedImage(generatedMsg.prompt, generatedMsg.imageUrl);
      addToHistoryUI(generatedMsg.prompt, generatedMsg.imageUrl);
      break;
      
    case 'GENERATION_ERROR':
      const errorMsg = message as GenerationErrorMessage;
      showError(errorMsg.error);
      break;
      
    default:
      console.log('Unhandled message type:', (message as any).type);
  }
  
  return true;
});

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSidepanel);
} else {
  initializeSidepanel();
}
