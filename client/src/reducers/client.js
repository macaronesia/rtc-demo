import {
  UPDATE_CLIENT_LIST,
} from '@/constants/actionTypes.js';

const initialState = {
  clients: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_CLIENT_LIST:
      return {
        ...state,
        clients: action.clients
      };
    default:
      return state;
  }
};
