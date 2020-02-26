import {
  SAVE_AUTH_DATA
} from '@/constants/actionTypes.js';

const initialState = {
  isAuthenticated: false,
  client: null,
  accessToken: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SAVE_AUTH_DATA:
      return {
        ...state,
        isAuthenticated: true,
        client: action.client,
        accessToken: action.accessToken
      };
    default:
      return state;
  }
};
