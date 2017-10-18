import { expect } from 'chai';
import { stub } from 'sinon';

import {
  isFunction,
  Promisify,
  isNotNullOrUndefined
} from '../../dist/util';

describe('(unit) dist/util.js', () => {
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
  });
  describe('isNotNullOrUndefined', () => {
    context('value is null', () => {
      expect(isNotNullOrUndefined(null)).to.be.false;
    });
    context('value is undefined', () => {
      expect(isNotNullOrUndefined(undefined)).to.be.false;
    });
    context('value is not null or undefined', () => {
      expect([
        '',
        'a',
        true,
        false,
        {},
        0,
        1,
        -1,
        d => d,
        []
      ].map(v => isNotNullOrUndefined(v))).to.eql([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ]);
    });
  })
});
