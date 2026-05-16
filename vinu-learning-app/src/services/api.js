import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://vinu-learning-app.onrender.com/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const contentApi = {
  getClasses: () => api.get('/content/classes'),
  getSubjects: (classId) => api.get(`/content/subjects/${classId}`),
  getChapters: (subjectId) => api.get(`/content/chapters/${subjectId}`),
  getEpisodes: (chapterId) => api.get(`/content/episodes/${chapterId}`),
  getRecentReleases: () => api.get('/content/releases/recent'),
  getVideoUrl: (episodeId) => `${API_BASE_URL}/content/video/${episodeId}`,
};

export const progressApi = {
  updateProgress: (data) => api.post('/progress/update', data),
  getUserProgress: () => api.get('/progress/user'),
  getStats: () => api.get('/progress/stats'),
};

export default api;
