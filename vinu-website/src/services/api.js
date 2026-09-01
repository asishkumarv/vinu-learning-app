import axios from 'axios';

const API_BASE_URL = 'https://api.vinuh.in/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const contentApi = {
  getDisclaimer: async () => {
    try {
      const res = await api.get('/content/disclaimer');
      return res.data?.disclaimer;
    } catch (err) {
      console.warn('API fetch failed for disclaimer, using fallback:', err.message);
      return null;
    }
  },

  getPrivacyPolicy: async () => {
    try {
      const res = await api.get('/content/privacy-policy');
      return res.data?.privacy_policy;
    } catch (err) {
      console.warn('API fetch failed for privacy policy, using fallback:', err.message);
      return null;
    }
  },

  getWebsiteConfig: async () => {
    try {
      const res = await api.get('/content/website-config');
      return res.data;
    } catch (err) {
      console.warn('API fetch failed for website config, using fallback:', err.message);
      return null;
    }
  },
};

export default api;
