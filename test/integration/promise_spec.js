import { expect } from 'chai';
import Bluebird from 'bluebird';

import {
  usePromise
} from '../../dist/promise';

const Promise = global.Promise;

describe('(integration) src/promise.js', () => {
  describe('usePromise', () => {
    context('with Bluebird', () => {
      it('does not throw', () => {
        usePromise(Bluebird);
      });
    });
    context('with ES6 Promise', () => {
      it('does not throw', () => {
        usePromise(Promise);
      });
    });
  });
});
