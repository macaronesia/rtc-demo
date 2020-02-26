import { ofType } from 'redux-observable';
import { from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  fetchClientListRejected,
  updateClientList
} from '@/actions/client.js';
import {
  FETCH_CLIENT_LIST
} from '@/constants/actionTypes.js';
import request from '@/middlewares/request.js';
import { createSocket } from '@/middlewares/socket.js';

export const fetchClientListEpic = (action$, state$) =>
  action$.pipe(
    ofType(FETCH_CLIENT_LIST),
    switchMap((action) => from(
        request({
          method: 'get',
          url: '/clients/'
        })
          .then(response => {
            return response;
          })
      )
        .pipe(
          map(response => {
            return updateClientList(response.data['clients']);
          }),
          catchError(error => of(fetchClientListRejected()))
        )
    )
  );
