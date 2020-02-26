import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from '@/store.js';
import RootContainer from '@/components/RootContainer.jsx';

ReactDOM.render((
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <HashRouter>
        <RootContainer />
      </HashRouter>
    </PersistGate>
  </Provider>
), document.getElementById('root'));
