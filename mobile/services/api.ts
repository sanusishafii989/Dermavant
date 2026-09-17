import { Platform } from 'react-native';

// In development: Android emulator uses 10.0.2.2, iOS simulator uses localhost
const DEV_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

export async function mobileApiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json();
    if (!response.ok || json.ok === false) {
      return {
        ok: false,
        error: json.error || json.message || `Request failed with status ${response.status}`,
      };
    }

    return { ok: true, data: json };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network request failed. Ensure API server is reachable.',
    };
  }
}
