import {
  FETCH_CLIENT_LIST,
  FETCH_CLIENT_LIST_REJECTED,
  UPDATE_CLIENT_LIST
} from '@/constants/actionTypes.js';

export const fetchClientList = () => ({
  type: FETCH_CLIENT_LIST
});

export const updateClientList = clients => ({
  type: UPDATE_CLIENT_LIST,
  clients: clients
});

export const fetchClientListRejected = () => ({
  type: FETCH_CLIENT_LIST_REJECTED
});
