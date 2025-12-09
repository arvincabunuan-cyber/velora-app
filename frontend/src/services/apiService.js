export const faceService = {
  verifyFace: async (idImage, faceImage) => {
    const response = await api.post('/verify-face', { idImage, faceImage });
    return response.data;
  }
};
import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updatePassword: async (passwordData) => {
    const response = await api.put('/auth/update-password', passwordData);
    return response.data;
  }
};

export const productService = {
  getAllProducts: async (filters) => {
    const response = await api.get('/products', { params: filters });
    return { data: response.data };
  },

  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getSellerProducts: async () => {
    const response = await api.get('/products/my-products');
    return { data: response.data };
  }
};

export const userService = {
  getRiders: async () => {
    const response = await api.get('/users/riders');
    return response.data;
  }
};

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getBuyerOrders: async () => {
    const response = await api.get('/orders/buyer');
    return { data: response.data.data || [] };
  },

  getSellerOrders: async () => {
    const response = await api.get('/orders/seller');
    return { data: response.data.data || [] };
  },

  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, statusData) => {
    const response = await api.put(`/orders/${id}/status`, statusData);
    return response.data;
  },

  cancelOrder: async (id, reason) => {
    const response = await api.put(`/orders/${id}/cancel`, { cancelReason: reason });
    return response.data;
  }
};

export const deliveryService = {
  createDelivery: async (deliveryData) => {
    const response = await api.post('/deliveries', deliveryData);
    return response.data;
  },

  getPendingDeliveries: async () => {
    const response = await api.get('/deliveries/pending');
    return response.data;
  },

  getRiderDeliveries: async (status) => {
    const response = await api.get('/deliveries/rider', { params: { status } });
    return response.data;
  },

  assignDelivery: async (id) => {
    const response = await api.put(`/deliveries/${id}/assign`);
    return response.data;
  },

  updateDeliveryStatus: async (id, statusData) => {
    const response = await api.put(`/deliveries/${id}/status`, statusData);
    return response.data;
  },

  updateRiderLocation: async (location) => {
    const response = await api.put('/deliveries/location', location);
    return response.data;
  },

  completeDelivery: async (id, proofData) => {
    const response = await api.put(`/deliveries/${id}/complete`, proofData);
    return response.data;
  },

  trackDelivery: async (id) => {
    const response = await api.get(`/deliveries/${id}/track`);
    return response.data;
  }
};

export const adminService = {
  getAllUsers: async (filters) => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  getRiders: async () => {
    const response = await api.get('/admin/users', { params: { role: 'rider', isActive: true } });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  toggleUserStatus: async (id) => {
    const response = await api.put(`/admin/users/${id}/toggle-status`);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getAllOrders: async (filters) => {
    const response = await api.get('/admin/orders', { params: filters });
    return response.data;
  },

  getAllDeliveries: async () => {
    const response = await api.get('/admin/deliveries');
    return response.data;
  }
};
