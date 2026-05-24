import { apiRequest } from './api';

export interface LoginResponse {
  token: string;
}

export interface LoginPayload {
  userOrEmail: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async adminLogin(payload: AdminLoginPayload): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async register(payload: RegisterPayload): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  logout() {
    localStorage.removeItem('token');
  },

  adminLogout() {
    localStorage.removeItem('admin_token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getAdminToken(): string | null {
    return localStorage.getItem('admin_token');
  },

  setToken(token: string) {
    localStorage.setItem('token', token);
  },

  setAdminToken(token: string) {
    localStorage.setItem('admin_token', token);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isAdminAuthenticated(): boolean {
    return !!this.getAdminToken();
  },

  isSeller(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return !!payload.isSeller;
    } catch {
      return false;
    }
  },

  getUid(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.UID || null;
      //Not 100% sure why IDEA complains about UID in caps not being real, but it most definitely is and has to be used in caps so that the value is actually found since the token has it in caps
    } catch {
      return null;
    }
  }
};
