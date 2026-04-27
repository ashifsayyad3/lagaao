import axios, { AxiosInstance, AxiosResponse } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (res: AxiosResponse) => res.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = (res.data as any).data;
        localStorage.setItem('accessToken', accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default api;

// API endpoints
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getOne: (slug: string) => api.get(`/products/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getBestSellers: () => api.get('/products/best-sellers'),
  search: (q: string) => api.get('/products/search', { params: { q } }),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getRoots: () => api.get('/categories/roots'),
  getOne: (slug: string) => api.get(`/categories/${slug}`),
};

export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (productId: string, quantity: number, variantId?: string) =>
    api.post('/cart/items', { productId, quantity, variantId }),
  updateItem: (id: string, quantity: number) => api.put(`/cart/items/${id}`, { quantity }),
  removeItem: (id: string) => api.delete(`/cart/items/${id}`),
  clear: () => api.delete('/cart'),
};

export const wishlistApi = {
  get: () => api.get('/wishlist'),
  add: (productId: string) => api.post('/wishlist/items', { productId }),
  remove: (productId: string) => api.delete(`/wishlist/items/${productId}`),
  check: (productId: string) => api.get(`/wishlist/check/${productId}`),
};

export const ordersApi = {
  create: (data: any) => api.post('/orders', data),
  getAll: (params?: any) => api.get('/orders', { params }),
  getOne: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string, reason: string) => api.put(`/orders/${id}/cancel`, { reason }),
};

export const paymentsApi = {
  createOrder: (orderId: string) => api.post(`/payments/create-order/${orderId}`),
  verify: (data: any) => api.post('/payments/verify', data),
};

export const couponsApi = {
  validate: (code: string, orderTotal: number) => api.post('/coupons/validate', { code, orderTotal }),
};

export const reviewsApi = {
  getByProduct: (productId: string, params?: any) => api.get(`/reviews/product/${productId}`, { params }),
  create: (productId: string, data: any) => api.post(`/reviews/product/${productId}`, data),
};

export const aiApi = {
  chat: (message: string, sessionId: string) => api.post('/ai/chat', { message, sessionId }),
  recommendations: () => api.get('/ai/recommendations'),
  suggestions: (q: string) => api.get('/ai/search-suggestions', { params: { q } }),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  getAddresses: () => api.get('/users/me/addresses'),
  addAddress: (data: any) => api.post('/users/me/addresses', data),
  updateAddress: (id: string, data: any) => api.put(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/me/addresses/${id}`),
};

export const notificationsApi = {
  get: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
