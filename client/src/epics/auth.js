import { ofType } from 'redux-observable';
import { from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  fetchAuthDataRejected,
  saveAuthData
} from '@/actions/auth.js';
import {
  GET_AUTH_DATA
} from '@/constants/actionTypes.js';
import request from '@/middlewares/request.js';
import { createSocket } from '@/middlewares/socket.js';

export const getAuthDataEpic = (action$, state$) =>
  action$.pipe(
    ofType(GET_AUTH_DATA),
    switchMap(action => {
      return from(
        request({
          method: 'post',
          url: '/clients/'
        })
          .then(response => {
            return response;
          })
      )
        .pipe(
          map(response => {
            createSocket(response.data['access_token']);
            return saveAuthData(response.data['client'], response.data['access_token']);
          }),
          catchError(error => of(fetchAuthDataRejected()))
        );
    })
  );
