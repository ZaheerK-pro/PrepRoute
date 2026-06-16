import axios from 'axios';
import { apiClient } from './client';
import type { ApiResponse, User } from '../types';

interface LoginPayload {
  userId: string;
  password: string;
}

interface LoginData {
  token: string;
  user: User;
}

function extractLoginData(payload: unknown): LoginData | null {
  if (!payload || typeof payload !== 'object') return null;

  const root = payload as Record<string, unknown>;
  const nested =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;

  const token =
    (nested.token as string | undefined) ??
    (nested.accessToken as string | undefined) ??
    (nested.access_token as string | undefined);

  if (!token) return null;

  const user = (nested.user ?? root.user ?? { userId: '' }) as User;
  return { token, user };
}

export async function login(payload: LoginPayload): Promise<LoginData> {
  const trimmedUserId = payload.userId.trim();

  const { data } = await apiClient.post<ApiResponse<LoginData> | LoginData>(
    '/auth/login',
    {
      userId: trimmedUserId,
      password: payload.password,
    },
  );

  const loginData = extractLoginData(data);

  if (loginData) {
    return loginData;
  }

  const message =
    (data as { message?: string })?.message ??
    'Login failed. Unexpected server response.';

  throw new Error(message);
}

export function getLoginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Unable to reach the server. If this is the deployed app, confirm VITE_API_BASE_URL is set in Vercel environment variables and redeploy.';
    }

    if ([502, 503, 504].includes(error.response.status)) {
      return 'The API server is unreachable. The backend URL may be down or incorrect — confirm with your team and set VITE_API_BASE_URL in a .env file if needed.';
    }

    const data = error.response.data as
      | { message?: string; error?: string; success?: boolean }
      | string
      | undefined;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object') {
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (error.response.status === 401) {
        return 'Invalid User ID or password. Please try again.';
      }
    }

    if (error.response.status === 401) {
      return 'Invalid User ID or password. Please try again.';
    }

    if (error.response.status === 404) {
      return 'API endpoint not found. Ensure VITE_API_BASE_URL is set in .env and restart the dev server.';
    }

    if (error.response.status === 405) {
      return 'API request blocked by deployment routing. Redeploy with the latest vercel.json and api proxy.';
    }

    return `Login failed (${error.response.status}). Please try again.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Invalid credentials. Please try again.';
}
