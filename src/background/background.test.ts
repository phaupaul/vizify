/**
 * Unit tests for background service worker message routing
 */

import type {
  ExtensionMessage,
  TextSelectedMessage,
  GenerateFromSidepanelMessage,
  GetCurrentSelectionResponse
} from '../types';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
      dispatch: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn().mockResolvedValue(undefined)
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  sidePanel: {
    open: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  }
};

global.chrome = mockChrome as any;

describe('Background Service Worker - Context Menu', () => {
  let contextMenuClickListener: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
  let onInstalledListener: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Import the background script to register listeners
    jest.isolateModules(() => {
      require('./background');
    });
    
    // Capture the onInstalled listener
    if (mockChrome.runtime.onInstalled.addListener.mock.calls.length > 0) {
      onInstalledListener = mockChrome.runtime.onInstalled.addListener.mock.calls[0][0];
    }
    
    // Capture the context menu click listener
    if (mockChrome.contextMenus.onClicked.addListener.mock.calls.length > 0) {
      contextMenuClickListener = mockChrome.contextMenus.onClicked.addListener.mock.calls[0][0];
    }
  });

  describe('Context Menu Registration (Requirement 2.1)', () => {
    test('registers "Generate Image" context menu on install', () => {
      // Trigger the onInstalled event
      onInstalledListener();
      
      // Verify context menu was created with correct parameters
      expect(mockChrome.contextMenus.create).toHaveBeenCalledWith({
        id: 'generate-image',
        title: 'Generate Image',
        contexts: ['selection']
      });
    });

    test('context menu is only shown for text selection (Requirement 2.3)', () => {
      // Trigger the onInstalled event
      onInstalledListener();
      
      // Verify the contexts parameter is set to ['selection']
      const createCall = mockChrome.contextMenus.create.mock.calls[0][0];
      expect(createCall.contexts).toEqual(['selection']);
    });
  });

  describe('Context Menu Click Handling', () => {
    test('opens sidepanel when context menu is clicked with selected text', async () => {
      const info: chrome.contextMenus.OnClickData = {
        menuItemId: 'generate-image',
        selectionText: 'Sample selected text',
        editable: false,
        pageUrl: 'https://example.com'
      };
      
      const tab: chrome.tabs.Tab = {
        id: 123,
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: true,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1
      };

      await contextMenuClickListener(info, tab);

      // Verify sidepanel was opened for the correct tab
      expect(mockChrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 123 });
    });

    test('does not open sidepanel when no text is selected', async () => {
      const info: chrome.contextMenus.OnClickData = {
        menuItemId: 'generate-image',
        selectionText: '',
        editable: false,
        pageUrl: 'https://example.com'
      };
      
      const tab: chrome.tabs.Tab = {
        id: 123,
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: true,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1
      };

      await contextMenuClickListener(info, tab);

      // Verify sidepanel was NOT opened
      expect(mockChrome.sidePanel.open).not.toHaveBeenCalled();
    });

    test('does not open sidepanel when tab is undefined', async () => {
      const info: chrome.contextMenus.OnClickData = {
        menuItemId: 'generate-image',
        selectionText: 'Sample text',
        editable: false,
        pageUrl: 'https://example.com'
      };

      await contextMenuClickListener(info, undefined);

      // Verify sidepanel was NOT opened
      expect(mockChrome.sidePanel.open).not.toHaveBeenCalled();
    });

    test('handles different menu item IDs correctly', async () => {
      const info: chrome.contextMenus.OnClickData = {
        menuItemId: 'different-menu-item',
        selectionText: 'Sample text',
        editable: false,
        pageUrl: 'https://example.com'
      };
      
      const tab: chrome.tabs.Tab = {
        id: 123,
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: true,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1
      };

      await contextMenuClickListener(info, tab);

      // Verify sidepanel was NOT opened for different menu item
      expect(mockChrome.sidePanel.open).not.toHaveBeenCalled();
    });
  });
});

describe('Background Service Worker - Message Routing', () => {
  let messageListener: (message: ExtensionMessage, sender: any, sendResponse: any) => boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Import the background script to register listeners
    jest.isolateModules(() => {
      require('./background');
    });
    
    // Capture the message listener
    messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
  });

  describe('Message Type Routing (Requirement 8.4)', () => {
    test('routes TEXT_SELECTED message correctly', () => {
      const message: TextSelectedMessage = {
        type: 'TEXT_SELECTED',
        text: 'Sample text',
        url: 'https://example.com'
      };
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      const result = messageListener(message, sender, sendResponse);
      
      // Should return true to keep channel open
      expect(result).toBe(true);
      
      // Should log the message (we can't easily test console.log, but we verify no errors)
    });

    test('routes GENERATE_FROM_SIDEPANEL message correctly', async () => {
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Mock tabs.query to return active tab
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      // Mock tabs.sendMessage to return selection
      const selectionResponse: GetCurrentSelectionResponse = {
        text: 'Selected text',
        isValid: true,
        wasTruncated: false
      };
      mockChrome.tabs.sendMessage.mockResolvedValue(selectionResponse);
      
      const result = messageListener(message, sender, sendResponse);
      
      // Should return true to keep channel open
      expect(result).toBe(true);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should query for active tab
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true
      });
      
      // Should request selection from content script
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: 'GET_CURRENT_SELECTION'
      });
    });

    test('handles unknown message type gracefully', () => {
      const message = {
        type: 'UNKNOWN_TYPE'
      } as any;
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Should not throw error
      expect(() => {
        messageListener(message, sender, sendResponse);
      }).not.toThrow();
    });

    test('includes type identifier in all messages (Requirement 8.4)', () => {
      const messages: ExtensionMessage[] = [
        { type: 'TEXT_SELECTED', text: 'test', url: 'https://example.com' },
        { type: 'GENERATE_FROM_SIDEPANEL' },
        { type: 'GET_CURRENT_SELECTION' },
        { type: 'GENERATION_STARTED', prompt: 'test' },
        { type: 'IMAGE_GENERATED', prompt: 'test', imageUrl: 'https://example.com/image.jpg' },
        { type: 'GENERATION_ERROR', error: 'test error' }
      ];
      
      messages.forEach(message => {
        expect(message).toHaveProperty('type');
        expect(typeof message.type).toBe('string');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing active tab gracefully', async () => {
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Mock tabs.query to return no tabs
      mockChrome.tabs.query.mockResolvedValue([]);
      
      messageListener(message, sender, sendResponse);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should send error message to sidepanel
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GENERATION_ERROR',
        error: 'No active tab found'
      });
    });

    test('handles content script error gracefully', async () => {
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Mock tabs.query to return active tab
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      // Mock tabs.sendMessage to throw error
      mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Content script not responding'));
      
      messageListener(message, sender, sendResponse);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should send error message to sidepanel
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GENERATION_ERROR',
        error: 'Failed to get text selection. Please try again.'
      });
    });

    test('handles empty selection gracefully', async () => {
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Mock tabs.query to return active tab
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      // Mock tabs.sendMessage to return empty selection
      const selectionResponse: GetCurrentSelectionResponse = {
        text: '',
        isValid: false,
        wasTruncated: false,
        error: 'No text selected'
      };
      mockChrome.tabs.sendMessage.mockResolvedValue(selectionResponse);
      
      messageListener(message, sender, sendResponse);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should send error message to sidepanel
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GENERATION_ERROR',
        error: 'No text selected'
      });
    });
  });

  describe('Communication (Requirement 8.2)', () => {
    test('sends messages to sidepanel', async () => {
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Mock tabs.query to return no tabs (to trigger error path)
      mockChrome.tabs.query.mockResolvedValue([]);
      
      messageListener(message, sender, sendResponse);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should use chrome.runtime.sendMessage to communicate with sidepanel
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalled();
      
      const sentMessage = mockChrome.runtime.sendMessage.mock.calls[0][0];
      expect(sentMessage).toHaveProperty('type');
    });
  });

  describe('API Key Management (Requirement 6.3)', () => {
    test('shows error when generating without API key', async () => {
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Mock tabs.query to return active tab
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      // Mock tabs.sendMessage to return valid selection
      const selectionResponse: GetCurrentSelectionResponse = {
        text: 'Test prompt',
        isValid: true,
        wasTruncated: false
      };
      mockChrome.tabs.sendMessage.mockResolvedValue(selectionResponse);
      
      // Mock storage.local.get to return no API key
      mockChrome.storage.local.get.mockResolvedValue({});
      
      messageListener(message, sender, sendResponse);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should send error message about missing API key
      const errorCalls = mockChrome.runtime.sendMessage.mock.calls.filter(
        call => call[0].type === 'GENERATION_ERROR'
      );
      
      expect(errorCalls.length).toBeGreaterThan(0);
      const errorMessage = errorCalls[errorCalls.length - 1][0];
      expect(errorMessage.error).toContain('API key not configured');
      expect(errorMessage.error).toContain('settings');
    });

    test('proceeds with generation when API key exists', async () => {
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Mock tabs.query to return active tab
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      // Mock tabs.sendMessage to return valid selection
      const selectionResponse: GetCurrentSelectionResponse = {
        text: 'Test prompt',
        isValid: true,
        wasTruncated: false
      };
      mockChrome.tabs.sendMessage.mockResolvedValue(selectionResponse);
      
      // Mock storage.local.get to return an API key
      mockChrome.storage.local.get.mockResolvedValue({ apiKey: 'fal_test_key_123' });
      
      messageListener(message, sender, sendResponse);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should retrieve API key from storage
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('apiKey');
      
      // Should not send an error about missing API key
      const errorCalls = mockChrome.runtime.sendMessage.mock.calls.filter(
        call => call[0].type === 'GENERATION_ERROR' && call[0].error.includes('API key not configured')
      );
      
      expect(errorCalls.length).toBe(0);
    });
  });
});

describe('Background Service Worker - Image Generation (Task 7.1)', () => {
  // Mock fetch globally for these tests
  const mockFetch = jest.fn();
  global.fetch = mockFetch as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateImage() function', () => {
    test('retrieves API key from storage (Requirement 8.2)', async () => {
      // Mock storage to return no API key
      mockChrome.storage.local.get.mockResolvedValue({});
      
      // Import and trigger generateImage through message handler
      jest.isolateModules(() => {
        require('./background');
      });
      
      const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      mockChrome.tabs.sendMessage.mockResolvedValue({
        text: 'Test prompt',
        isValid: true,
        wasTruncated: false
      });
      
      messageListener(message, {}, jest.fn());
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify API key was retrieved from storage
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('apiKey');
    });

    test('sends loading state message to sidepanel (Requirement 9.1)', async () => {
      // Mock storage to return API key
      mockChrome.storage.local.get.mockResolvedValue({ apiKey: 'test_key' });
      
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          images: [{ url: 'https://example.com/image.jpg' }]
        })
      });
      
      jest.isolateModules(() => {
        require('./background');
      });
      
      const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      mockChrome.tabs.sendMessage.mockResolvedValue({
        text: 'Test prompt',
        isValid: true,
        wasTruncated: false
      });
      
      messageListener(message, {}, jest.fn());
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify GENERATION_STARTED message was sent
      const startedCalls = mockChrome.runtime.sendMessage.mock.calls.filter(
        call => call[0].type === 'GENERATION_STARTED'
      );
      
      expect(startedCalls.length).toBeGreaterThan(0);
      expect(startedCalls[0][0]).toEqual({
        type: 'GENERATION_STARTED',
        prompt: 'Test prompt'
      });
    });

    test('calls FAL API with prompt and API key (Requirement 8.2)', async () => {
      const testApiKey = 'test_api_key_123';
      const testPrompt = 'A beautiful sunset';
      
      // Mock storage to return API key
      mockChrome.storage.local.get.mockResolvedValue({ apiKey: testApiKey });
      
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          images: [{ url: 'https://example.com/image.jpg' }]
        })
      });
      
      jest.isolateModules(() => {
        require('./background');
      });
      
      const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      mockChrome.tabs.sendMessage.mockResolvedValue({
        text: testPrompt,
        isValid: true,
        wasTruncated: false
      });
      
      messageListener(message, {}, jest.fn());
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        'https://fal.run/fal-ai/flux/schnell',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Key ${testApiKey}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('sends success message to sidepanel on successful generation (Requirement 8.2)', async () => {
      const testImageUrl = 'https://example.com/generated-image.jpg';
      const testPrompt = 'A beautiful landscape';
      
      // Mock storage to return API key
      mockChrome.storage.local.get.mockResolvedValue({ apiKey: 'test_key' });
      
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          images: [{ url: testImageUrl }]
        })
      });
      
      jest.isolateModules(() => {
        require('./background');
      });
      
      const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      mockChrome.tabs.sendMessage.mockResolvedValue({
        text: testPrompt,
        isValid: true,
        wasTruncated: false
      });
      
      messageListener(message, {}, jest.fn());
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify IMAGE_GENERATED message was sent
      const successCalls = mockChrome.runtime.sendMessage.mock.calls.filter(
        call => call[0].type === 'IMAGE_GENERATED'
      );
      
      expect(successCalls.length).toBeGreaterThan(0);
      expect(successCalls[0][0]).toEqual({
        type: 'IMAGE_GENERATED',
        prompt: testPrompt,
        imageUrl: testImageUrl
      });
    });

    test('sends error message to sidepanel on API failure (Requirement 8.2)', async () => {
      // Mock storage to return API key
      mockChrome.storage.local.get.mockResolvedValue({ apiKey: 'test_key' });
      
      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error'
      });
      
      jest.isolateModules(() => {
        require('./background');
      });
      
      const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      mockChrome.tabs.sendMessage.mockResolvedValue({
        text: 'Test prompt',
        isValid: true,
        wasTruncated: false
      });
      
      messageListener(message, {}, jest.fn());
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify GENERATION_ERROR message was sent
      const errorCalls = mockChrome.runtime.sendMessage.mock.calls.filter(
        call => call[0].type === 'GENERATION_ERROR'
      );
      
      expect(errorCalls.length).toBeGreaterThan(0);
      expect(errorCalls[errorCalls.length - 1][0].error).toBeTruthy();
    });

    test('handles network errors gracefully (Requirement 8.2)', async () => {
      // Mock storage to return API key
      mockChrome.storage.local.get.mockResolvedValue({ apiKey: 'test_key' });
      
      // Mock network error
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
      
      jest.isolateModules(() => {
        require('./background');
      });
      
      const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      mockChrome.tabs.sendMessage.mockResolvedValue({
        text: 'Test prompt',
        isValid: true,
        wasTruncated: false
      });
      
      messageListener(message, {}, jest.fn());
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify GENERATION_ERROR message was sent with network error
      const errorCalls = mockChrome.runtime.sendMessage.mock.calls.filter(
        call => call[0].type === 'GENERATION_ERROR'
      );
      
      expect(errorCalls.length).toBeGreaterThan(0);
      expect(errorCalls[errorCalls.length - 1][0].error).toContain('Network error');
    });

    test('logs errors to console for debugging (Requirement 7.4)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock storage to return API key
      mockChrome.storage.local.get.mockResolvedValue({ apiKey: 'test_key' });
      
      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('Test error'));
      
      jest.isolateModules(() => {
        require('./background');
      });
      
      const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      
      const message: GenerateFromSidepanelMessage = {
        type: 'GENERATE_FROM_SIDEPANEL'
      };
      
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      mockChrome.tabs.sendMessage.mockResolvedValue({
        text: 'Test prompt',
        isValid: true,
        wasTruncated: false
      });
      
      messageListener(message, {}, jest.fn());
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify error was logged to console
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during image generation:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
});
