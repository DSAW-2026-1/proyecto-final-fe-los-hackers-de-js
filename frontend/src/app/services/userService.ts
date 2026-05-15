import { apiRequest } from './api';

export interface UserProfileResponse {
  username: string;
  email: string;
  isSeller: boolean;
  career: string | null;
  photo: string | null;
  reputation: string | null;
  sales: number;
}

export interface NotificationItem {
  notificationID: string;
  type: 'message' | 'orderUpdate' | 'review' | 'purchase' | 'system' | 'sale' | 'shipping' | 'promotion';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  topicID: string;
}

export interface NotificationsResponse {
  count: number;
  pages: number;
  page: number;
  results: Record<string, NotificationItem>;
}

export interface UpdateProfileRequest {
  username?: string;
  career?: string;
  photo?: string;
}

export interface UserReviewItem {
  buyerID: string;
  productID: string;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  reviewDate: number;
}

export interface UserReviewsResponse {
  count: number;
  pages: number;
  page: number;
  results: Record<string, UserReviewItem>;
}

export const userService = {
  async getProfile(): Promise<UserProfileResponse> {
    return apiRequest<UserProfileResponse>('/api/users/');
  },
  async getProfileByUid(uid: string): Promise<UserProfileResponse> {
    return apiRequest<UserProfileResponse>(`/api/users/${uid}`);
  },
  async updateProfile(data: UpdateProfileRequest): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/users', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async getNotifications(page: number = 1): Promise<NotificationsResponse> {
    return apiRequest<NotificationsResponse>(`/api/notifications?page=${page}`);
  },
  async getNotificationsSince(since: string): Promise<NotificationsResponse> {
    return apiRequest<NotificationsResponse>(`/api/notifications?since=${since}`);
  },
  async markNotificationState(notificationID: string, read: boolean): Promise<void> {
    return apiRequest<void>(`/api/notifications/${notificationID}`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    });
  },
  async markAllNotificationsRead(): Promise<void> {
    return apiRequest<void>('/api/notifications/readAll', {
      method: 'PATCH',
    });
  },
  async getUnreadCount(): Promise<{ count: number }> {
    return apiRequest<{ count: number }>('/api/notifications/unreadCount');
  },
  async registerAsSeller(): Promise<{ token: string }> {
    return apiRequest<{ token: string }>('/api/seller/register', {
      method: 'PATCH',
    });
  },
  async reportUser(uid: string, data: { category: string, reportTitle: string, reportBody: string }): Promise<void> {
    return apiRequest<void>(`/api/users/${uid}/report`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async getUserReviews(uid: string, page: number = 1): Promise<UserReviewsResponse> {
    return apiRequest<UserReviewsResponse>(`/api/users/${uid}/reviews?page=${page}`);
  },
};
