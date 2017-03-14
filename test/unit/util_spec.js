import { expect } from 'chai';
import { stub } from 'sinon';

import {
  isFunction,
  Promisify
} from '../../src/util';

describe('(unit) src/util.js', () => {
  describe('isFunction', () => {
    context('when passed a function', () => {
      it('returns true', () => {
        expect(isFunction(d => d)).to.be.true;
      });
    });
    context('when not passed a function', () => {
      it('returns false', () => {
        expect(isFunction({})).to.be.false;
      });
    })
  });
  describe('Promisify', () => {
    it('passing values through', (next) => {
      const ns = {
        fn: (a, b, c) => a + b + c
      };

      stub(ns, 'fn', ns.fn);

      Promisify(ns.fn)('a', 'b', 'c')
        .then(value => {
          expect(ns.fn.calledOnce).to.be.true;
          expect(value).to.equal('abc');
          next();
        })
        .catch(e => next(e));
    });
    context('when passed method that does not return a promise', () => {
      context('and the method returns', (next) => {
        it('resolves', (next) => {
          const fn = () => true;

          Promisify(fn)()
            .then(value => {
              expect(value).to.be.true;
              next();
            })
            .catch(e => next(e));
        });
      });
      context('and the method throws', () => {
        it('rejects', (next) => {
          const e = new Error();
          const fn = () => {
            throw e;
          };

          Promisify(fn)()
            .then(val => {
              next(new Error('did not reject'))
            })
            .catch(err => {
              expect(err).to.equal(e);
              next();
            })
            .catch(e => next(e));
        });
      });
    });
    context('when passed a method that returns a promise', () => {
      context('and the method returns a resolving promise', () => {
        it('resolves', (next) => {
          const fn = () => new Promise(resolve => resolve(true));
          Promisify(fn)()
            .then(val => {
              expect(val).to.be.true;
              next();
            })
            .catch(e => next(e));
        });
      });
      context('and the method returns a rejecting promise', () => {
        it('rejects', (next) => {
          const e = new Error();
          const fn = () => new Promise((r, reject) => reject(e));
          Promisify(fn)()
            .then(val => next(new Error('did not reject')))
            .catch(err => {
              expect(err).to.equal(e);
              next();
            })
            .catch(e => next(e));
        });
      });
    })
  })
});
