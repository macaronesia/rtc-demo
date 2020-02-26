import {
  FETCH_AUTH_DATA_REJECTED,
  GET_AUTH_DATA,
  SAVE_AUTH_DATA
} from '@/constants/actionTypes.js';

export const getAuthData = () => ({
  type: GET_AUTH_DATA
});

export const saveAuthData = (client, accessToken) => ({
  type: SAVE_AUTH_DATA,
  client: client,
  accessToken: accessToken
});

export const fetchAuthDataRejected = () => ({
  type: FETCH_AUTH_DATA_REJECTED
});
