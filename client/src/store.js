import { applyMiddleware, combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { getAuthDataEpic } from '@/epics/auth.js';
import { fetchClientListEpic } from '@/epics/client.js';
import authReducer from '@/reducers/auth.js';
import clientReducer from '@/reducers/client.js';


const rootEpic = combineEpics(
  getAuthDataEpic,
  fetchClientListEpic
);

const epicMiddleware = createEpicMiddleware();

const appReducer = combineReducers({
  auth: authReducer,
  client: clientReducer
});

const rootReducer = (state, action) => {
  return appReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: [
    'auth'
  ]
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const composeEnhancers = composeWithDevTools({});

export const store = createStore(persistedReducer, composeEnhancers(applyMiddleware(epicMiddleware)));
epicMiddleware.run(rootEpic);
export const persistor = persistStore(store);
