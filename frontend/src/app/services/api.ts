const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';
const PORT = import.meta.env.VITE_API_PORT || null;

export const FULL_URL = (PORT)? `${BASE_URL}:${PORT}` : `${BASE_URL}`;
export const API_URL = (PORT)? `${BASE_URL}:${PORT}/api` : `${BASE_URL}/api`;

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FULL_URL}${endpoint}`;
  
  let token = localStorage.getItem('token');
  
  // Use admin token for admin routes
  if (endpoint.startsWith('/api/admin') && !endpoint.includes('/api/admin/login')) {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      token = adminToken;
    }
  }
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(options.headers || {}).entries()),
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    const errorMsg = errorData.message || errorData.error || response.statusText
    const error = new Error(errorMsg) as ApiError;

    error.status = response.status;
    error.data = errorData;

    // Detect expired JWT or invalid token
    if (response.status === 400 && errorMsg?.includes('Invalid JWT token')) {
      console.error(error)
      const isAdminRoute = endpoint.startsWith('/api/admin') && !endpoint.includes('/api/admin/login');
      window.dispatchEvent(new CustomEvent('auth-token-expired', { detail: { isAdmin: isAdminRoute } }));
    }

    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
