/**
 * Unit tests for FAL API Client Module
 * 
 * Tests Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2
 */

import { callFalAPI, validateImageUrl, ApiError } from './falApi';
import type { FalImageResponse } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('FAL API Client', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear console.log mock
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateImageUrl', () => {
    // Requirement 4.5: Validate image URL format
    
    it('should return true for valid HTTP URLs', () => {
      expect(validateImageUrl('http://example.com/image.jpg')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(validateImageUrl('https://example.com/image.jpg')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(validateImageUrl('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(validateImageUrl(null as any)).toBe(false);
      expect(validateImageUrl(undefined as any)).toBe(false);
      expect(validateImageUrl(123 as any)).toBe(false);
    });

    it('should return false for invalid URL formats', () => {
      expect(validateImageUrl('not a url')).toBe(false);
      expect(validateImageUrl('ftp://example.com/image.jpg')).toBe(false);
      expect(validateImageUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return true for URLs with query parameters', () => {
      expect(validateImageUrl('https://example.com/image.jpg?size=large')).toBe(true);
    });

    it('should return true for URLs with fragments', () => {
      expect(validateImageUrl('https://example.com/image.jpg#section')).toBe(true);
    });
  });

  describe('callFalAPI', () => {
    const mockApiKey = 'test-api-key-12345';
    const mockPrompt = 'A beautiful sunset over mountains';
    const mockImageUrl = 'https://fal.media/files/test-image.jpg';

    const mockSuccessResponse: FalImageResponse = {
      images: [
        {
          url: mockImageUrl,
          width: 1024,
          height: 768,
          content_type: 'image/jpeg'
        }
      ],
      timings: {
        inference: 1.5
      },
      seed: 12345,
      has_nsfw_concepts: [false],
      prompt: mockPrompt
    };

    it('should send request with proper formatting (Requirement 4.1)', async () => {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      await callFalAPI(mockPrompt, mockApiKey);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://fal.run/fal-ai/flux/schnell',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(mockPrompt)
        })
      );

      // Verify request body structure
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody).toEqual({
        prompt: mockPrompt,
        image_size: 'landscape_4_3',
        num_inference_steps: 4,
        num_images: 1
      });
    });

    it('should include API key in Authorization header (Requirement 4.2)', async () => {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      await callFalAPI(mockPrompt, mockApiKey);

      // Verify Authorization header is present and correctly formatted
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Key ${mockApiKey}`
          })
        })
      );
    });

    it('should extract image URL from response (Requirement 4.3)', async () => {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      const result = await callFalAPI(mockPrompt, mockApiKey);

      // Verify the correct image URL was extracted
      expect(result).toBe(mockImageUrl);
    });

    it('should validate image URL format (Requirement 4.5)', async () => {
      // Mock response with invalid URL
      const invalidResponse = {
        ...mockSuccessResponse,
        images: [
          {
            ...mockSuccessResponse.images[0],
            url: 'not-a-valid-url'
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse
      });

      // Should throw ApiError for invalid URL
      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).userMessage).toContain('invalid image URL');
      }
    });

    it('should handle API error responses with user-friendly messages (Requirement 4.4, 7.1)', async () => {
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key'
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('FAL API error (401)');
        expect((error as ApiError).userMessage).toContain('Invalid or expired API key');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });

    it('should handle network errors with user-friendly message (Requirement 7.2)', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('fetch failed')
      );

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('Network error');
        expect((error as ApiError).userMessage).toContain('check your internet connection');
      }
    });

    it('should handle missing images in response', async () => {
      // Mock response with no images
      const noImagesResponse = {
        ...mockSuccessResponse,
        images: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => noImagesResponse
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('no images returned');
        expect((error as ApiError).userMessage).toContain('invalid response');
      }
    });

    it('should handle malformed response structure', async () => {
      // Mock response with missing images array
      const malformedResponse = {
        timings: { inference: 1.5 },
        seed: 12345
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => malformedResponse
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('no images returned');
      }
    });

    it('should log successful image generation', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      await callFalAPI(mockPrompt, mockApiKey);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Successfully generated image:',
        mockImageUrl
      );
    });

    it('should handle different image sizes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      await callFalAPI(mockPrompt, mockApiKey);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      // Verify default image size is landscape_4_3
      expect(requestBody.image_size).toBe('landscape_4_3');
    });

    it('should handle prompts with special characters', async () => {
      const specialPrompt = 'A "quoted" prompt with <special> & characters!';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSuccessResponse,
          prompt: specialPrompt
        })
      });

      const result = await callFalAPI(specialPrompt, mockApiKey);

      // Verify the prompt was sent correctly
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.prompt).toBe(specialPrompt);
      expect(result).toBe(mockImageUrl);
    });

    it('should handle empty API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Missing API key'
      });

      try {
        await callFalAPI(mockPrompt, '');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
        expect((error as ApiError).userMessage).toContain('Invalid or expired API key');
      }
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(1000);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSuccessResponse,
          prompt: longPrompt
        })
      });

      const result = await callFalAPI(longPrompt, mockApiKey);

      expect(result).toBe(mockImageUrl);
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.prompt).toBe(longPrompt);
    });

    it('should handle URLs with query parameters in response', async () => {
      const urlWithParams = 'https://fal.media/files/test.jpg?token=abc123&size=large';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSuccessResponse,
          images: [
            {
              ...mockSuccessResponse.images[0],
              url: urlWithParams
            }
          ]
        })
      });

      const result = await callFalAPI(mockPrompt, mockApiKey);

      expect(result).toBe(urlWithParams);
    });

    it('should handle 500 server errors with user-friendly message (Requirement 7.1)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error occurred'
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('FAL API error (500)');
        expect((error as ApiError).userMessage).toContain('temporarily unavailable');
        expect((error as ApiError).statusCode).toBe(500);
      }
    });

    it('should handle rate limiting errors with user-friendly message (Requirement 7.1)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded'
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('FAL API error (429)');
        expect((error as ApiError).userMessage).toContain('Rate limit exceeded');
        expect((error as ApiError).userMessage).toContain('wait a moment');
        expect((error as ApiError).statusCode).toBe(429);
      }
    });

    it('should handle 400 bad request errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid prompt format'
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).userMessage).toContain('Invalid request');
        expect((error as ApiError).statusCode).toBe(400);
      }
    });

    it('should handle 403 forbidden errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Access denied'
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).userMessage).toContain('Invalid or expired API key');
        expect((error as ApiError).statusCode).toBe(403);
      }
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        }
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('Failed to parse API response');
        expect((error as ApiError).userMessage).toContain('invalid response');
      }
    });

    it('should handle error when response.text() fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => {
          throw new Error('Cannot read response');
        }
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(500);
        // Should fall back to statusText when text() fails
        expect((error as ApiError).message).toContain('Internal Server Error');
      }
    });

    it('should log detailed error information to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error'
      });

      try {
        await callFalAPI(mockPrompt, mockApiKey);
      } catch (error) {
        // Error is expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'FAL API error:',
        expect.objectContaining({
          status: 500,
          statusText: 'Internal Server Error',
          errorText: 'Server error'
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should preserve original error in ApiError', async () => {
      const originalError = new TypeError('fetch failed');
      (global.fetch as jest.Mock).mockRejectedValueOnce(originalError);

      try {
        await callFalAPI(mockPrompt, mockApiKey);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).originalError).toBe(originalError);
      }
    });
  });
});
