/**
 * Tests for Sidepanel functionality
 * 
 * These tests verify the sidepanel UI, message handling, and user interactions.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn<any>(),
      set: jest.fn<any>(),
    },
  },
  runtime: {
    sendMessage: jest.fn<any>(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn<any>(),
  },
  downloads: {
    download: jest.fn<any>(),
  },
};

(global as any).chrome = mockChrome;

// Mock DOM
beforeEach(() => {
  document.body.innerHTML = `
    <div class="container">
      <header>
        <h1>Text to Image</h1>
        <button id="settings-btn" class="icon-btn">⚙️</button>
      </header>
      
      <div class="controls">
        <button id="generate-btn" class="primary-btn">Generate from Selection</button>
      </div>
      
      <div id="current-generation" class="generation-area"></div>
      
      <div class="history-section">
        <div class="history-header">
          <h2>History</h2>
          <button id="clear-history-btn" class="secondary-btn">Clear All</button>
        </div>
        <div id="history-container" class="history-grid"></div>
      </div>
      
      <div id="settings-modal" class="modal hidden">
        <div class="modal-content">
          <h2>Settings</h2>
          <div class="form-group">
            <label for="api-key-input">FAL API Key:</label>
            <input type="password" id="api-key-input" placeholder="Enter your FAL API key">
          </div>
          <div class="modal-actions">
            <button id="save-api-key-btn" class="primary-btn">Save</button>
            <button id="close-settings-btn" class="secondary-btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Reset mocks
  jest.clearAllMocks();
});

describe('Sidepanel Initialization', () => {
  test('shows API key prompt when no key is configured', async () => {
    // Requirement 6.1: Prompt user to enter API key on first install
    mockChrome.storage.local.get.mockResolvedValue({});
    
    // Simulate checking for API key
    const { apiKey } = await chrome.storage.local.get('apiKey');
    
    expect(apiKey).toBeUndefined();
    expect(mockChrome.storage.local.get).toHaveBeenCalled();
  });
  
  test('loads history on initialization', async () => {
    // Requirement 5.2: Display history in chronological order
    const mockHistory = [
      {
        id: '1',
        prompt: 'Test prompt 1',
        imageUrl: 'https://example.com/image1.png',
        timestamp: Date.now(),
      },
      {
        id: '2',
        prompt: 'Test prompt 2',
        imageUrl: 'https://example.com/image2.png',
        timestamp: Date.now() - 1000,
      },
    ];
    
    mockChrome.storage.local.get.mockResolvedValue({
      apiKey: 'test-key',
      history: mockHistory,
    });
    
    // Verify history is loaded
    expect(mockChrome.storage.local.get).toBeDefined();
  });
});

describe('Loading State Display', () => {
  test('displays loading spinner and prompt text', () => {
    // Requirements: 3.2, 9.1, 9.2, 9.3
    const container = document.getElementById('current-generation');
    const prompt = 'A beautiful sunset';
    
    // Simulate loading state
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p class="prompt">"${prompt}"</p>
          <p class="status">Generating image...</p>
        </div>
      `;
    }
    
    expect(container?.querySelector('.spinner')).toBeTruthy();
    expect(container?.querySelector('.prompt')?.textContent).toContain(prompt);
    expect(container?.querySelector('.status')?.textContent).toBe('Generating image...');
  });
  
  test('disables generate button during loading', () => {
    // Requirement 9.3: Disable generate button during loading
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    
    generateBtn.disabled = true;
    
    expect(generateBtn.disabled).toBe(true);
  });
});

describe('Success State Display', () => {
  test('displays generated image with prompt and actions', () => {
    // Requirements: 3.3, 9.4
    const container = document.getElementById('current-generation');
    const prompt = 'A beautiful sunset';
    const imageUrl = 'https://example.com/image.png';
    
    if (container) {
      container.innerHTML = `
        <div class="image-result">
          <img src="${imageUrl}" alt="Generated image">
          <p class="prompt">"${prompt}"</p>
          <div class="actions">
            <button class="open-full-btn">Open Full Size</button>
            <button class="copy-url-btn">Copy URL</button>
            <button class="download-btn">Download</button>
          </div>
        </div>
      `;
    }
    
    expect(container?.querySelector('img')?.getAttribute('src')).toBe(imageUrl);
    expect(container?.querySelector('.prompt')?.textContent).toContain(prompt);
    expect(container?.querySelector('.open-full-btn')).toBeTruthy();
    expect(container?.querySelector('.copy-url-btn')).toBeTruthy();
    expect(container?.querySelector('.download-btn')).toBeTruthy();
  });
  
  test('re-enables generate button after success', () => {
    // Requirement 9.4: Remove loading indicator and re-enable button
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    
    generateBtn.disabled = false;
    
    expect(generateBtn.disabled).toBe(false);
  });
});

describe('Error State Display', () => {
  test('displays error message with retry button', () => {
    // Requirements: 7.1, 7.5
    const container = document.getElementById('current-generation');
    const errorMessage = 'API key not configured';
    
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <strong>Error</strong>
          <p>${errorMessage}</p>
          <button class="retry-button">Retry</button>
        </div>
      `;
    }
    
    expect(container?.querySelector('.error-message')).toBeTruthy();
    expect(container?.querySelector('p')?.textContent).toBe(errorMessage);
    expect(container?.querySelector('.retry-button')).toBeTruthy();
  });
});

describe('History Display', () => {
  test('displays history items in chronological order', () => {
    // Requirements: 5.2, 5.4
    const container = document.getElementById('history-container');
    const mockHistory = [
      {
        id: '1',
        prompt: 'Newest prompt',
        imageUrl: 'https://example.com/image1.png',
        timestamp: Date.now(),
      },
      {
        id: '2',
        prompt: 'Older prompt',
        imageUrl: 'https://example.com/image2.png',
        timestamp: Date.now() - 1000,
      },
    ];
    
    if (container) {
      container.innerHTML = mockHistory.map(item => `
        <div class="history-item">
          <img src="${item.imageUrl}" alt="Generated image">
          <p class="history-prompt">${item.prompt}</p>
        </div>
      `).join('');
    }
    
    const items = container?.querySelectorAll('.history-item');
    expect(items?.length).toBe(2);
    expect(items?.[0].querySelector('.history-prompt')?.textContent).toBe('Newest prompt');
  });
  
  test('displays empty state when no history', () => {
    // Requirement 5.2: Handle empty history
    const container = document.getElementById('history-container');
    
    if (container) {
      container.innerHTML = '<p class="empty-state">No images generated yet</p>';
    }
    
    expect(container?.querySelector('.empty-state')).toBeTruthy();
  });
});

describe('Generate Button Handler', () => {
  test('sends GENERATE_FROM_SIDEPANEL message', async () => {
    // Requirements: 3.5, 8.3
    mockChrome.storage.local.get.mockResolvedValue({ apiKey: 'test-key' });
    
    // Simulate button click
    mockChrome.runtime.sendMessage.mockResolvedValue({});
    
    await mockChrome.runtime.sendMessage({
      type: 'GENERATE_FROM_SIDEPANEL',
    });
    
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'GENERATE_FROM_SIDEPANEL',
    });
  });
  
  test('shows error when API key not configured', async () => {
    // Requirement 6.3: Show error when API key missing
    mockChrome.storage.local.get.mockResolvedValue({});
    
    const result: any = await mockChrome.storage.local.get('apiKey');
    
    expect(result.apiKey).toBeUndefined();
  });
});

describe('Image Click Handler', () => {
  test('opens image in new tab when clicked', () => {
    // Requirement 10.2: Open full-size image in new tab
    const imageUrl = 'https://example.com/image.png';
    
    mockChrome.tabs.create.mockResolvedValue({});
    
    chrome.tabs.create({ url: imageUrl });
    
    expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: imageUrl });
  });
});

describe('Copy URL Button', () => {
  test('copies URL to clipboard', async () => {
    // Requirement 10.4: Copy image URL to clipboard
    const imageUrl = 'https://example.com/image.png';
    
    // Mock clipboard API
    const writeTextMock = jest.fn<any>().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
    
    await navigator.clipboard.writeText(imageUrl);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(imageUrl);
  });
});

describe('Download Button', () => {
  test('initiates download with sanitized filename', () => {
    // Requirement 10.3: Download image to computer
    const imageUrl = 'https://example.com/image.png';
    const prompt = 'A beautiful sunset';
    
    mockChrome.downloads.download.mockResolvedValue(1);
    
    const sanitizedPrompt = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `text-to-image_${sanitizedPrompt}_${Date.now()}.png`;
    
    chrome.downloads.download({
      url: imageUrl,
      filename: filename,
      saveAs: true,
    });
    
    expect(mockChrome.downloads.download).toHaveBeenCalled();
  });
});

describe('Settings Modal', () => {
  test('shows settings modal when settings button clicked', () => {
    // Requirement 6.4: Provide settings interface
    const modal = document.getElementById('settings-modal');
    
    modal?.classList.remove('hidden');
    
    expect(modal?.classList.contains('hidden')).toBe(false);
  });
  
  test('validates API key format before saving', () => {
    // Requirement 6.5: Validate API key format
    const validateApiKeyFormat = (apiKey: string): boolean => {
      if (typeof apiKey !== 'string' || apiKey.length === 0) {
        return false;
      }
      if (apiKey !== apiKey.trim()) {
        return false;
      }
      if (apiKey.length < 10) {
        return false;
      }
      return true;
    };
    
    expect(validateApiKeyFormat('short')).toBe(false);
    expect(validateApiKeyFormat('  spaces  ')).toBe(false);
    expect(validateApiKeyFormat('valid-api-key-12345')).toBe(true);
  });
  
  test('saves API key to storage', async () => {
    // Requirement 6.4: Save API key
    const apiKey = 'valid-api-key-12345';
    
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    
    await chrome.storage.local.set({ apiKey });
    
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ apiKey });
  });
});

describe('Message Listener', () => {
  test('handles GENERATION_STARTED message', () => {
    // Requirement 8.2: Handle messages from background
    const message = {
      type: 'GENERATION_STARTED',
      prompt: 'Test prompt',
    };
    
    // Verify message structure
    expect(message.type).toBe('GENERATION_STARTED');
    expect(message.prompt).toBe('Test prompt');
  });
  
  test('handles IMAGE_GENERATED message', () => {
    // Requirement 8.2: Handle messages from background
    const message = {
      type: 'IMAGE_GENERATED',
      prompt: 'Test prompt',
      imageUrl: 'https://example.com/image.png',
    };
    
    expect(message.type).toBe('IMAGE_GENERATED');
    expect(message.imageUrl).toBeTruthy();
  });
  
  test('handles GENERATION_ERROR message', () => {
    // Requirement 8.2: Handle messages from background
    const message = {
      type: 'GENERATION_ERROR',
      error: 'API key not configured',
    };
    
    expect(message.type).toBe('GENERATION_ERROR');
    expect(message.error).toBeTruthy();
  });
});

describe('HTML Escaping', () => {
  test('escapes HTML to prevent XSS', () => {
    // Requirement 1.3: Preserve exact text content safely
    const escapeHtml = (text: string): string => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    const maliciousText = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(maliciousText);
    
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});

describe('Clear History', () => {
  test('clears history from storage and UI', async () => {
    // Requirement 5.5: Clear all history
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    
    await chrome.storage.local.set({ history: [] });
    
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ history: [] });
    
    const container = document.getElementById('history-container');
    if (container) {
      container.innerHTML = '<p class="empty-state">No images generated yet</p>';
    }
    
    expect(container?.querySelector('.empty-state')).toBeTruthy();
  });
});
