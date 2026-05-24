import { apiRequest } from './api';

export interface CreateProductRequest {
  name: string;
  category: string;
  condition: string;
  price: number;
  description: string;
  images: { [key: number]: string };
  stock: number;
}

export interface ProductResponse {
  productID: string;
}

export interface Product {
  productID?: string;
  name: string;
  category: string;
  condition: string;
  price: number;
  description: string;
  images: { [key: number]: string };
  sellerID: string;
  stock: number;
  rating: number | null;
  sales?: number;
}

export interface SearchParams {
  page?: number;
  query?: string;
  categories?: string;
  fromPrice?: number;
  toPrice?: number;
  conditions?: string;
  minRating?: number;
  searchDescription?: boolean;
  sellerID?: string;
  includeOutOfStock?: boolean;
}

export interface SearchResultItem {
  productID: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  stock: number;
}

export interface SearchResponse {
  count: number;
  pages: number;
  page: number;
  results: { [key: number]: SearchResultItem };
}
export interface ShippingResponseItem {
  saleID: string;
  productID: string;
  sellerID?: string;
  buyerID?: string;
  shippingAddress: string;
  amount: number;
  status: string;
}
export interface ShippingResponse {
  count: number;
  active?: number;
  pages: number;
  page: number;
  results: { [key: number]: ShippingResponseItem };
}

export interface ReviewItem {
  buyerID: string;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  reviewDate: number;
}

export interface ReviewsResponse {
  count: number;
  pages: number;
  page: number;
  results: { [key: number]: ReviewItem };
}

export const productService = {
  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    return apiRequest<ProductResponse>('/api/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProduct(productID: string): Promise<Product> {
    return apiRequest<Product>(`/api/products/${productID}`);
  },

  async updateProduct(productID: string, data: Partial<CreateProductRequest>): Promise<void> {
    return apiRequest<void>(`/api/products/${productID}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(productID: string): Promise<void> {
    return apiRequest<void>(`/api/products/${productID}`, {
      method: 'DELETE',
    });
  },

  async searchProducts(params: SearchParams): Promise<SearchResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return apiRequest<SearchResponse>(`/api/products/search?${queryParams.toString()}`);
  },

  async checkout(data: { products: { [key: number]: { productID: string, amount: number } }, shippingAddress: string }): Promise<void> {
    return apiRequest<void>('/api/sales/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getShippingStatus(page: number = 1): Promise<ShippingResponse> {
    return apiRequest<ShippingResponse>(`/api/shipping/status?page=${page}`);
  },

  async getSellerShippingStatus(page: number = 1): Promise<ShippingResponse> {
    return apiRequest<ShippingResponse>(`/api/seller/shipping/status?page=${page}`);
  },

  async getShippingDetail(saleID: string): Promise<ShippingResponseItem> {
    return apiRequest<ShippingResponseItem>(`/api/shipping/${saleID}`);
  },

  async updateShippingStatus(saleID: string, status: string): Promise<void> {
    return apiRequest<void>(`/api/seller/shipping/${saleID}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async createReview(productID: string, data: { rating: number, title: string, body: string }): Promise<void> {
    return apiRequest<void>(`/api/products/${productID}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getReviews(productID: string, page: number = 1): Promise<ReviewsResponse> {
    return apiRequest<ReviewsResponse>(`/api/products/${productID}/reviews?page=${page}`);
  },

  async createReport(productID: string, data: { category: string, reportTitle: string, reportBody: string }): Promise<void> {
    return apiRequest<void>(`/api/products/${productID}/report`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
