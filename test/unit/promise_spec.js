import { expect } from 'chai';
import Bluebird from 'bluebird';

import {
  usePromise
} from '../../dist/promise';

describe('(unit) dist/promise.js', () => {
  after(() => usePromise(Promise));
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
    context('with another valid promise lib', () => {
      it('does not throw', () => {
        class FakePromiseLib {
          //missing reject
          static resolve () {

          }
          static reject () {

          }
          static all () {

          }
          then () {

          }
          catch () {

          }
        };
        usePromise(FakePromiseLib);
      });
    });
    context('with an invalid promise lib', () => {
      it('throws', () => {
        class FakePromiseLib {
          //missing resolve
          static reject () {

          }
          static all () {

          }
          then () {

          }
          catch () {

          }
        };
        try {
          usePromise(FakePromiseLib);
          throw new Error('it did not throw');
        } catch (e) {
          expect(e).to.not.be.undefined;
        }
      });
    });
  });
});
