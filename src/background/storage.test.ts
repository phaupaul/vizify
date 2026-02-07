/**
 * Unit tests for storage utilities
 * 
 * Tests the API key storage, retrieval, and validation functions.
 */

import {
  validateApiKeyFormat,
  saveApiKey,
  getApiKey,
  hasApiKey,
  removeApiKey,
  addToHistory,
  getHistory,
  clearHistory,
  HistoryItem
} from './storage';

// Mock chrome.storage.local
const mockStorage: { [key: string]: any } = {};

global.chrome = {
  storage: {
    local: {
      set: jest.fn((items: { [key: string]: any }) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      get: jest.fn((keys: string | string[]) => {
        const result: { [key: string]: any } = {};
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => {
          if (key in mockStorage) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }),
      remove: jest.fn((keys: string | string[]) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => {
          delete mockStorage[key];
        });
        return Promise.resolve();
      })
    }
  }
} as any;

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    jest.clearAllMocks();
  });

  describe('validateApiKeyFormat', () => {
    // Requirement 6.5: Validate API key format

    test('returns true for valid API key format', () => {
      const validKey = 'fal_1234567890abcdef';
      expect(validateApiKeyFormat(validKey)).toBe(true);
    });

    test('returns false for empty string', () => {
      expect(validateApiKeyFormat('')).toBe(false);
    });

    test('returns false for string with only whitespace', () => {
      expect(validateApiKeyFormat('   ')).toBe(false);
    });

    test('returns false for string with leading whitespace', () => {
      expect(validateApiKeyFormat('  valid_key_123')).toBe(false);
    });

    test('returns false for string with trailing whitespace', () => {
      expect(validateApiKeyFormat('valid_key_123  ')).toBe(false);
    });

    test('returns false for string shorter than minimum length', () => {
      expect(validateApiKeyFormat('short')).toBe(false);
    });

    test('returns false for non-string values', () => {
      expect(validateApiKeyFormat(null as any)).toBe(false);
      expect(validateApiKeyFormat(undefined as any)).toBe(false);
      expect(validateApiKeyFormat(123 as any)).toBe(false);
      expect(validateApiKeyFormat({} as any)).toBe(false);
    });

    test('returns true for long alphanumeric keys', () => {
      const longKey = 'fal_' + 'a'.repeat(50);
      expect(validateApiKeyFormat(longKey)).toBe(true);
    });

    test('returns true for keys with special characters', () => {
      const keyWithSpecialChars = 'fal_key-with_special.chars123';
      expect(validateApiKeyFormat(keyWithSpecialChars)).toBe(true);
    });
  });

  describe('saveApiKey', () => {
    // Requirement 6.2: Store API key using Chrome's storage API
    // Requirement 6.5: Validate format before saving

    test('saves valid API key to storage', async () => {
      const validKey = 'fal_1234567890abcdef';
      
      await saveApiKey(validKey);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ apiKey: validKey });
      expect(mockStorage.apiKey).toBe(validKey);
    });

    test('throws error for invalid API key format', async () => {
      const invalidKey = 'short';
      
      await expect(saveApiKey(invalidKey)).rejects.toThrow('Invalid API key format');
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    test('throws error for empty string', async () => {
      await expect(saveApiKey('')).rejects.toThrow('Invalid API key format');
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    test('throws error for string with whitespace', async () => {
      await expect(saveApiKey('  valid_key_123  ')).rejects.toThrow('Invalid API key format');
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    test('handles storage errors gracefully', async () => {
      const validKey = 'fal_1234567890abcdef';
      const storageError = new Error('Storage quota exceeded');
      
      (chrome.storage.local.set as jest.Mock).mockRejectedValueOnce(storageError);
      
      await expect(saveApiKey(validKey)).rejects.toThrow('Failed to save API key');
    });

    test('overwrites existing API key', async () => {
      const firstKey = 'fal_first_key_123';
      const secondKey = 'fal_second_key_456';
      
      await saveApiKey(firstKey);
      expect(mockStorage.apiKey).toBe(firstKey);
      
      await saveApiKey(secondKey);
      expect(mockStorage.apiKey).toBe(secondKey);
    });
  });

  describe('getApiKey', () => {
    // Requirement 6.2: Retrieve API key using Chrome's storage API

    test('retrieves existing API key from storage', async () => {
      const testKey = 'fal_test_key_123';
      mockStorage.apiKey = testKey;
      
      const result = await getApiKey();
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith('apiKey');
      expect(result).toBe(testKey);
    });

    test('returns undefined when no API key is stored', async () => {
      const result = await getApiKey();
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith('apiKey');
      expect(result).toBeUndefined();
    });

    test('handles storage errors gracefully', async () => {
      const storageError = new Error('Storage access denied');
      
      (chrome.storage.local.get as jest.Mock).mockRejectedValueOnce(storageError);
      
      await expect(getApiKey()).rejects.toThrow('Failed to retrieve API key');
    });
  });

  describe('hasApiKey', () => {
    test('returns true when API key exists', async () => {
      mockStorage.apiKey = 'fal_test_key_123';
      
      const result = await hasApiKey();
      
      expect(result).toBe(true);
    });

    test('returns false when API key does not exist', async () => {
      const result = await hasApiKey();
      
      expect(result).toBe(false);
    });

    test('returns false when API key is empty string', async () => {
      mockStorage.apiKey = '';
      
      const result = await hasApiKey();
      
      expect(result).toBe(false);
    });
  });

  describe('removeApiKey', () => {
    test('removes API key from storage', async () => {
      mockStorage.apiKey = 'fal_test_key_123';
      
      await removeApiKey();
      
      expect(chrome.storage.local.remove).toHaveBeenCalledWith('apiKey');
      expect(mockStorage.apiKey).toBeUndefined();
    });

    test('handles removal when no key exists', async () => {
      await removeApiKey();
      
      expect(chrome.storage.local.remove).toHaveBeenCalledWith('apiKey');
    });

    test('handles storage errors gracefully', async () => {
      const storageError = new Error('Storage access denied');
      
      (chrome.storage.local.remove as jest.Mock).mockRejectedValueOnce(storageError);
      
      await expect(removeApiKey()).rejects.toThrow('Failed to remove API key');
    });
  });

  describe('Integration scenarios', () => {
    test('save and retrieve API key workflow', async () => {
      const testKey = 'fal_integration_test_key';
      
      // Initially no key
      expect(await hasApiKey()).toBe(false);
      
      // Save key
      await saveApiKey(testKey);
      
      // Key should exist
      expect(await hasApiKey()).toBe(true);
      
      // Retrieve key
      const retrieved = await getApiKey();
      expect(retrieved).toBe(testKey);
    });

    test('save, update, and retrieve API key workflow', async () => {
      const firstKey = 'fal_first_key_123';
      const secondKey = 'fal_second_key_456';
      
      // Save first key
      await saveApiKey(firstKey);
      expect(await getApiKey()).toBe(firstKey);
      
      // Update to second key
      await saveApiKey(secondKey);
      expect(await getApiKey()).toBe(secondKey);
    });

    test('save and remove API key workflow', async () => {
      const testKey = 'fal_test_key_123';
      
      // Save key
      await saveApiKey(testKey);
      expect(await hasApiKey()).toBe(true);
      
      // Remove key
      await removeApiKey();
      expect(await hasApiKey()).toBe(false);
      expect(await getApiKey()).toBeUndefined();
    });
  });

  describe('addToHistory', () => {
    // Requirement 5.1: Store image URL and prompt in history
    // Requirement 5.3: Remove oldest entries when limit exceeded

    test('adds new item to history', async () => {
      const prompt = 'A beautiful sunset';
      const imageUrl = 'https://example.com/image1.jpg';
      
      await addToHistory(prompt, imageUrl);
      
      const history = await getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].prompt).toBe(prompt);
      expect(history[0].imageUrl).toBe(imageUrl);
      expect(history[0].id).toBeDefined();
      expect(history[0].timestamp).toBeDefined();
    });

    test('adds multiple items to history in correct order', async () => {
      await addToHistory('First prompt', 'https://example.com/image1.jpg');
      await addToHistory('Second prompt', 'https://example.com/image2.jpg');
      await addToHistory('Third prompt', 'https://example.com/image3.jpg');
      
      const history = await getHistory();
      expect(history).toHaveLength(3);
      // Newest first
      expect(history[0].prompt).toBe('Third prompt');
      expect(history[1].prompt).toBe('Second prompt');
      expect(history[2].prompt).toBe('First prompt');
    });

    test('generates unique IDs for each item', async () => {
      await addToHistory('Prompt 1', 'https://example.com/image1.jpg');
      await addToHistory('Prompt 2', 'https://example.com/image2.jpg');
      
      const history = await getHistory();
      expect(history[0].id).not.toBe(history[1].id);
    });

    test('stores timestamp for each item', async () => {
      const beforeTime = Date.now();
      await addToHistory('Test prompt', 'https://example.com/image.jpg');
      const afterTime = Date.now();
      
      const history = await getHistory();
      expect(history[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(history[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('limits history to 50 items', async () => {
      // Add 55 items
      for (let i = 0; i < 55; i++) {
        await addToHistory(`Prompt ${i}`, `https://example.com/image${i}.jpg`);
      }
      
      const history = await getHistory();
      expect(history).toHaveLength(50);
      
      // Verify newest items are kept (54 to 5)
      expect(history[0].prompt).toBe('Prompt 54');
      expect(history[49].prompt).toBe('Prompt 5');
    });

    test('removes oldest items when exceeding limit', async () => {
      // Add 50 items
      for (let i = 0; i < 50; i++) {
        await addToHistory(`Prompt ${i}`, `https://example.com/image${i}.jpg`);
      }
      
      // Add one more
      await addToHistory('Newest prompt', 'https://example.com/newest.jpg');
      
      const history = await getHistory();
      expect(history).toHaveLength(50);
      expect(history[0].prompt).toBe('Newest prompt');
      expect(history[49].prompt).toBe('Prompt 1');
      
      // Verify oldest item (Prompt 0) was removed
      const hasOldest = history.some(item => item.prompt === 'Prompt 0');
      expect(hasOldest).toBe(false);
    });

    test('handles storage errors gracefully', async () => {
      const storageError = new Error('Storage quota exceeded');
      
      (chrome.storage.local.set as jest.Mock).mockRejectedValueOnce(storageError);
      
      await expect(addToHistory('Test', 'https://example.com/test.jpg'))
        .rejects.toThrow('Failed to save to history');
    });

    test('handles special characters in prompt', async () => {
      const specialPrompt = 'A prompt with "quotes", <tags>, & symbols!';
      const imageUrl = 'https://example.com/image.jpg';
      
      await addToHistory(specialPrompt, imageUrl);
      
      const history = await getHistory();
      expect(history[0].prompt).toBe(specialPrompt);
    });

    test('handles very long prompts', async () => {
      const longPrompt = 'A'.repeat(1000);
      const imageUrl = 'https://example.com/image.jpg';
      
      await addToHistory(longPrompt, imageUrl);
      
      const history = await getHistory();
      expect(history[0].prompt).toBe(longPrompt);
    });
  });

  describe('getHistory', () => {
    // Requirement 5.2: Display history in chronological order (newest first)

    test('returns empty array when no history exists', async () => {
      const history = await getHistory();
      
      expect(history).toEqual([]);
    });

    test('returns all history items', async () => {
      await addToHistory('Prompt 1', 'https://example.com/image1.jpg');
      await addToHistory('Prompt 2', 'https://example.com/image2.jpg');
      await addToHistory('Prompt 3', 'https://example.com/image3.jpg');
      
      const history = await getHistory();
      
      expect(history).toHaveLength(3);
    });

    test('returns history in chronological order (newest first)', async () => {
      // Add items with small delays to ensure different timestamps
      await addToHistory('First', 'https://example.com/image1.jpg');
      await new Promise(resolve => setTimeout(resolve, 10));
      await addToHistory('Second', 'https://example.com/image2.jpg');
      await new Promise(resolve => setTimeout(resolve, 10));
      await addToHistory('Third', 'https://example.com/image3.jpg');
      
      const history = await getHistory();
      
      expect(history[0].prompt).toBe('Third');
      expect(history[1].prompt).toBe('Second');
      expect(history[2].prompt).toBe('First');
      
      // Verify timestamps are in descending order
      expect(history[0].timestamp).toBeGreaterThan(history[1].timestamp);
      expect(history[1].timestamp).toBeGreaterThan(history[2].timestamp);
    });

    test('handles storage errors gracefully', async () => {
      const storageError = new Error('Storage access denied');
      
      (chrome.storage.local.get as jest.Mock).mockRejectedValueOnce(storageError);
      
      await expect(getHistory()).rejects.toThrow('Failed to retrieve history');
    });
  });

  describe('clearHistory', () => {
    // Requirement 5.5: Provide button to clear all history

    test('clears all history items', async () => {
      // Add some items
      await addToHistory('Prompt 1', 'https://example.com/image1.jpg');
      await addToHistory('Prompt 2', 'https://example.com/image2.jpg');
      await addToHistory('Prompt 3', 'https://example.com/image3.jpg');
      
      // Verify items exist
      let history = await getHistory();
      expect(history).toHaveLength(3);
      
      // Clear history
      await clearHistory();
      
      // Verify history is empty
      history = await getHistory();
      expect(history).toEqual([]);
    });

    test('handles clearing empty history', async () => {
      await clearHistory();
      
      const history = await getHistory();
      expect(history).toEqual([]);
    });

    test('handles storage errors gracefully', async () => {
      const storageError = new Error('Storage access denied');
      
      (chrome.storage.local.set as jest.Mock).mockRejectedValueOnce(storageError);
      
      await expect(clearHistory()).rejects.toThrow('Failed to clear history');
    });
  });

  describe('History integration scenarios', () => {
    test('add, retrieve, and clear history workflow', async () => {
      // Initially empty
      expect(await getHistory()).toEqual([]);
      
      // Add items
      await addToHistory('Prompt 1', 'https://example.com/image1.jpg');
      await addToHistory('Prompt 2', 'https://example.com/image2.jpg');
      
      // Verify items exist
      let history = await getHistory();
      expect(history).toHaveLength(2);
      
      // Clear history
      await clearHistory();
      
      // Verify empty again
      expect(await getHistory()).toEqual([]);
    });

    test('history persists across multiple operations', async () => {
      // Add first batch
      await addToHistory('Prompt 1', 'https://example.com/image1.jpg');
      await addToHistory('Prompt 2', 'https://example.com/image2.jpg');
      
      // Retrieve
      let history = await getHistory();
      expect(history).toHaveLength(2);
      
      // Add more
      await addToHistory('Prompt 3', 'https://example.com/image3.jpg');
      
      // Retrieve again
      history = await getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].prompt).toBe('Prompt 3');
    });

    test('history limit enforcement across multiple sessions', async () => {
      // Add 48 items
      for (let i = 0; i < 48; i++) {
        await addToHistory(`Prompt ${i}`, `https://example.com/image${i}.jpg`);
      }
      
      // Verify count
      let history = await getHistory();
      expect(history).toHaveLength(48);
      
      // Add 5 more (should trigger limit)
      for (let i = 48; i < 53; i++) {
        await addToHistory(`Prompt ${i}`, `https://example.com/image${i}.jpg`);
      }
      
      // Verify limit enforced
      history = await getHistory();
      expect(history).toHaveLength(50);
      expect(history[0].prompt).toBe('Prompt 52');
      expect(history[49].prompt).toBe('Prompt 3');
    });
  });
});
