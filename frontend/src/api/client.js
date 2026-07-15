const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

let accessToken = null;

export function getToken() { return accessToken; }
export function setToken(token) { accessToken = token; }
export function clearToken() { accessToken = null; }

export async function api(path, options = {}) {
  const token = getToken();
  const fetchOptions = {
    ...options,
    credentials: options.credentials || 'include',
    headers: {
      ...(options.body && !(options.body instanceof URLSearchParams) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${path}`, fetchOptions);

  // Auto-refresh token if we hit a 401 unauthorized error (except on login or refresh itself)
  if (response.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/refresh') {
    try {
      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setToken(data.access_token);
        
        // Retry the original request with the new access token
        const newFetchOptions = {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            Authorization: `Bearer ${data.access_token}`,
          },
        };
        const retryResponse = await fetch(`${API_URL}${path}`, newFetchOptions);
        if (!retryResponse.ok) {
          const payload = await retryResponse.json().catch(() => ({}));
          throw new Error(payload.detail || 'The server could not complete this request.');
        }
        return retryResponse.status === 204 ? null : retryResponse.json();
      }
    } catch (refreshErr) {
      console.error('Refresh token expired or failed', refreshErr);
    }
    clearToken();
    window.dispatchEvent(new Event('auth-unauthorized'));
    throw new Error('Session expired. Please log in again.');

  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || 'The server could not complete this request.');
  }
  return response.status === 204 ? null : response.json();
}
