import io from 'socket.io-client';

import {
  SOCKET_IO_BASE,
  SOCKET_IO_PATH,
  SOCKET_IO_TRANSPORTS
} from '@/constants/environmentConstants.js';
import {
  fetchClientList
} from '@/actions/client.js';
import { store } from '@/store.js';

export let socket;

export const createSocket = accessToken => {
  socket = io(SOCKET_IO_BASE, {
    path: SOCKET_IO_PATH,
    transports: SOCKET_IO_TRANSPORTS,
    query: {
      'jwt': accessToken
    }
  });

  socket.on('clients', () => {
    store.dispatch(fetchClientList());
  });
};
