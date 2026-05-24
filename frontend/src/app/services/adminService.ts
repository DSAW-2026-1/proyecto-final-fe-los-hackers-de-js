import { apiRequest } from './api';

export interface AdminDashboardStats {
  totalUsers: number;
  activeSellers: number;
  totalProducts: number;
  totalSales: number;
}

export interface AdminReport {
  reportID: string;
  reporterID: string;
  type: 'productReport' | 'userReport';
  reportedID: string;
  category: string;
  reportTitle: string;
  reportBody: string;
}

export interface AdminReportsResponse {
  count: number;
  pages: number;
  page: number;
  results: Record<string, AdminReport>;
}

export interface AdminProduct {
  productID: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  stock: number;
  sellerID: string;
  deleted: boolean;
}

export interface AdminProductsResponse {
  count: number;
  pages: number;
  page: number;
  results: Record<string, AdminProduct>;
}

export interface AdminUser {
  UID: string;
  username: string;
  email: string;
  career: string | null;
  isSuspended: boolean;
  isSeller: boolean;
  photo: string | null;
  sales: number;
  reviews: number;
  reputation: number | null;
}

export interface AdminUsersResponse {
  count: number;
  pages: number;
  page: number;
  results: Record<string, AdminUser>;
}

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return apiRequest<AdminDashboardStats>('/api/admin/dashboard');
  },

  async getProducts(page: number = 1, query: string = ''): Promise<AdminProductsResponse> {
    const queryParams = new URLSearchParams({ page: page.toString() });
    if (query) queryParams.append('query', query);
    return apiRequest<AdminProductsResponse>(`/api/admin/products?${queryParams.toString()}`);
  },

  async getUsers(page: number = 1, query: string = ''): Promise<AdminUsersResponse> {
    const queryParams = new URLSearchParams({ page: page.toString() });
    if (query) queryParams.append('query', query);
    return apiRequest<AdminUsersResponse>(`/api/admin/users?${queryParams.toString()}`);
  },

  async deleteProduct(productID: string): Promise<void> {
    return apiRequest<void>(`/api/admin/products/${productID}/`, {
      method: 'DELETE',
    });
  },

  async suspendUser(uid: string, reason: string): Promise<void> {
    return apiRequest<void>(`/api/admin/users/${uid}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async getReport(reportID: string): Promise<AdminReport> {
    return apiRequest<AdminReport>(`/api/admin/reports/${reportID}`);
  },

  async getReports(page: number = 1): Promise<AdminReportsResponse> {
    return apiRequest<AdminReportsResponse>(`/api/admin/reports?page=${page}`);
  },

  async resolveReport(reportID: string, solution: 'deleteOffending' | 'rejectReport', reason: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/admin/reports/${reportID}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ solution, reason }),
    });
  },
};
