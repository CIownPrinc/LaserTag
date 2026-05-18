import { ApiRoutes } from '../contracts/backendEvents';

export async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export const backendApi = {
  updateProfile: (body: { username: string }) => postJson(ApiRoutes.PROFILE_UPDATE, body),
  updateSettings: (body: { sensitivity?: number; signalColor?: string }) => postJson(ApiRoutes.SETTINGS_UPDATE, body),
  submitMatchEnd: (body: unknown) => postJson(ApiRoutes.MATCH_END, body),
};
