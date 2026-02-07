/**
 * Unit tests for content script
 * Testing text selection capture, validation, and truncation
 */

import { GetCurrentSelectionResponse } from '../types';

// Mock Chrome API
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
};

global.chrome = mockChrome as any;

// Mock window.getSelection
const mockGetSelection = jest.fn();
global.window.getSelection = mockGetSelection;

// Import the content script after mocking
// Since content.ts runs immediately, we need to test its functions
// We'll test the message handler behavior

describe('Content Script - Text Selection', () => {
  let messageListener: (message: any, sender: any, sendResponse: any) => boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Capture the message listener
    mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });
    
    // Re-import to register listener
    jest.isolateModules(() => {
      require('./content');
    });
  });

  describe('GET_CURRENT_SELECTION message handling', () => {
    test('should capture valid text selection', () => {
      // Requirement 1.1: Capture selected text
      const selectedText = 'Hello, World!';
      mockGetSelection.mockReturnValue({
        toString: () => selectedText,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: selectedText,
        isValid: true,
        wasTruncated: false,
        error: undefined,
      });
    });

    test('should reject empty selection', () => {
      // Requirement 1.2: Empty selection should be rejected
      mockGetSelection.mockReturnValue({
        toString: () => '',
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: '',
        isValid: false,
        wasTruncated: false,
        error: 'Empty or whitespace-only selection',
      });
    });

    test('should reject whitespace-only selection', () => {
      // Requirement 1.2: Whitespace-only selection should be rejected
      mockGetSelection.mockReturnValue({
        toString: () => '   \t\n   ',
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: '',
        isValid: false,
        wasTruncated: false,
        error: 'Empty or whitespace-only selection',
      });
    });

    test('should preserve special characters', () => {
      // Requirement 1.3: Preserve exact text content including special characters
      const specialText = 'Hello! @#$%^&*() <script>alert("test")</script>';
      mockGetSelection.mockReturnValue({
        toString: () => specialText,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: specialText,
        isValid: true,
        wasTruncated: false,
        error: undefined,
      });
    });

    test('should preserve unicode and emoji characters', () => {
      // Requirement 1.3: Preserve exact text content including special characters
      const unicodeText = 'Hello 世界 🌍 café';
      mockGetSelection.mockReturnValue({
        toString: () => unicodeText,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: unicodeText,
        isValid: true,
        wasTruncated: false,
        error: undefined,
      });
    });

    test('should preserve internal whitespace and newlines', () => {
      // Requirement 1.3: Preserve exact text content including formatting
      const formattedText = 'Line 1\nLine 2\n  Indented line';
      mockGetSelection.mockReturnValue({
        toString: () => formattedText,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: formattedText,
        isValid: true,
        wasTruncated: false,
        error: undefined,
      });
    });

    test('should truncate text exceeding 1000 characters', () => {
      // Requirement 1.4: Text exceeding 1000 characters should be truncated
      const longText = 'a'.repeat(1500);
      mockGetSelection.mockReturnValue({
        toString: () => longText,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      const response = sendResponse.mock.calls[0][0] as GetCurrentSelectionResponse;
      expect(response.text).toHaveLength(1000);
      expect(response.isValid).toBe(true);
      expect(response.wasTruncated).toBe(true);
      expect(response.error).toBeUndefined();
    });

    test('should truncate at exactly 1000 characters', () => {
      // Requirement 1.4: Verify exact truncation point
      const longText = 'a'.repeat(1000) + 'b'.repeat(100);
      mockGetSelection.mockReturnValue({
        toString: () => longText,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      const response = sendResponse.mock.calls[0][0] as GetCurrentSelectionResponse;
      expect(response.text).toBe('a'.repeat(1000));
      expect(response.text).toHaveLength(1000);
      expect(response.wasTruncated).toBe(true);
    });

    test('should not truncate text at exactly 1000 characters', () => {
      // Requirement 1.4: Text at exactly 1000 characters should not be truncated
      const exactText = 'a'.repeat(1000);
      mockGetSelection.mockReturnValue({
        toString: () => exactText,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: exactText,
        isValid: true,
        wasTruncated: false,
        error: undefined,
      });
    });

    test('should not truncate text under 1000 characters', () => {
      // Requirement 1.4: Text under 1000 characters should not be truncated
      const shortText = 'a'.repeat(500);
      mockGetSelection.mockReturnValue({
        toString: () => shortText,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: shortText,
        isValid: true,
        wasTruncated: false,
        error: undefined,
      });
    });

    test('should trim leading and trailing whitespace', () => {
      // Edge case: Trim whitespace but preserve internal formatting
      const textWithWhitespace = '  \n  Hello World  \n  ';
      mockGetSelection.mockReturnValue({
        toString: () => textWithWhitespace,
      });

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: 'Hello World',
        isValid: true,
        wasTruncated: false,
        error: undefined,
      });
    });

    test('should handle null selection', () => {
      // Edge case: No selection available
      mockGetSelection.mockReturnValue(null);

      const sendResponse = jest.fn();
      messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        text: '',
        isValid: false,
        wasTruncated: false,
        error: 'Empty or whitespace-only selection',
      });
    });

    test('should return true to keep message channel open', () => {
      // Requirement 8.3: Message handling should support async responses
      mockGetSelection.mockReturnValue({
        toString: () => 'test',
      });

      const result = messageListener(
        { type: 'GET_CURRENT_SELECTION' },
        {},
        jest.fn()
      );

      expect(result).toBe(true);
    });
  });
});
