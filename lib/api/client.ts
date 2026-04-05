import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[TruthLens API]', error?.response?.status, error?.message);
    return Promise.reject(error);
  },
);
