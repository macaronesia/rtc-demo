import axios from 'axios';

import { API_URL_BASE } from '@/constants/environmentConstants.js';
import { store } from '@/store.js';

const request = axios.create({
  baseURL: API_URL_BASE
});

request.interceptors.request.use(
  config => {
    if (store.getState().auth.isAuthenticated) {
      config.headers.common['Authorization'] = 'Bearer ' + store.getState().auth.accessToken;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  });

export default request;
