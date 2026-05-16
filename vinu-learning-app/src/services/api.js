import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api'; // Replace with Render URL later

const api = axios.create({
  baseURL: API_BASE_URL,
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
  updateProgress: (episodeId, status) => api.post('/progress/update', { episode_id: episodeId, status }),
  getUserProgress: () => api.get('/progress'),
};

export default api;
