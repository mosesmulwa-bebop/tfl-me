import { TFL_API_BASE } from '@/constants/tfl';
import axios, { AxiosError, AxiosInstance } from 'axios';

// Get API credentials from environment variables
const APP_ID = process.env.EXPO_PUBLIC_TFL_APP_ID;
const API_KEY = process.env.EXPO_PUBLIC_TFL_API_KEY;

console.log('TfL API Credentials loaded:', {
  hasAppId: !!APP_ID,
  hasApiKey: !!API_KEY,
  appIdLength: APP_ID?.length || 0,
  apiKeyLength: API_KEY?.length || 0,
});

// Create and configure the TfL API client
export const createTflClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: TFL_API_BASE,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add API credentials to every request
  client.interceptors.request.use(
    (config) => {
      // Add API credentials as query parameters
      config.params = {
        ...config.params,
        app_id: APP_ID,
        app_key: API_KEY,
      };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors globally
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.status, error.response.data);
        
        switch (error.response.status) {
          case 401:
            throw new Error('Invalid API credentials');
          case 429:
            throw new Error('Too many requests. Please try again later.');
          case 500:
            throw new Error('TfL API server error. Please try again later.');
          default:
            throw new Error(`API Error: ${error.response.status}`);
        }
      } else if (error.request) {
        // Request made but no response received
        console.error('Network Error:', error.message);
        throw new Error('Network error. Please check your internet connection.');
      } else {
        // Something else happened
        console.error('Error:', error.message);
        throw new Error('An unexpected error occurred.');
      }
    }
  );

  return client;
};

// Singleton instance
export const tflClient = createTflClient();
