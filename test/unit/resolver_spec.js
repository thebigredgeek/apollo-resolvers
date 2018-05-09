import { expect } from 'chai';
import { stub } from 'sinon';
import Bluebird from 'bluebird';

import { createResolver } from '../../dist/resolver';
import { usePromise } from '../../dist/promise';

let originalPromise = Promise;

describe('(unit) dist/resolver.js', () => {
  describe('createResolver', () => {
    describe('resolver chaining', () => {
      it('works', (next) => {
        const fin = new Error('final error');

        const r1 = {
          handle: d => null,
          error: d => d
        };

        const r2 = {
          handle: null,
          error: d => fin
        };

        const r3 = {
          handle: d => null,
          error: null
        };

        stub(r1, 'handle', r1.handle);
        stub(r1, 'error', r1.error);
        stub(r2, 'error', r2.error);
        stub(r3, 'handle', r3.handle);

        const resolver = createResolver(r1.handle, r1.error).createResolver(r2.handle, r2.error).createResolver(r3.handle, r3.error).createResolver(
          (root, args, context) => {
            throw new Error('first error');
          }
        );

        resolver()
          .catch(e => {
            expect(e).to.equal(fin);
            expect(r1.error.calledOnce).to.be.false;
            expect(r1.handle.calledOnce).to.be.true;
            expect(r2.error.calledOnce).to.be.true;
            expect(r3.handle.calledOnce).to.be.true;
            next();
          })
          .catch(e => next(e))
      });
    });
    describe('error handling', () => {
      context('when error callback exists', () => {
        context('when error callback returns error', () => {
          it('throws the returned error', (next) => {
            const e = new Error('original error');
            const e2 = new Error('transformed error');
            const r = {
              handle: d => {
                throw e;
              },
              error: e => e2
            };

            const resolver = createResolver(r.handle, r.error);

            resolver()
              .catch(err => {
                expect(err).to.equal(e2);
                next();
              })
              .catch(e => next(e));
          });
        });
        context('when error callback throws error', () => {
          it('throws the newly thrown error', (next) => {
            const e = new Error('original error');
            const e2 = new Error('transformed error');
            const r = {
              handle: d => {
                throw e;
              },
              error: e => {
                throw e2;
              }
            };

            const resolver = createResolver(r.handle, r.error);

            resolver()
              .catch(err => {
                expect(err).to.equal(e2);
                next();
              })
              .catch(err => next(err));
          });
        });
        context('when error callback returns nothing and throws nothing', () => {
          it('throws the original error', (next) => {
            const e = new Error('original error');
            const r = {
              handle: d => {
                throw e;
              },
              error: e => null
            };

            const resolver = createResolver(r.handle, r.error);

            resolver()
              .catch(err => {
                expect(err).to.equal(e);
                next();
              })
              .catch(err => next(err));
          });
        });
      });
      context('when error callback does not exist', () => {
        it('throws the original error', (next) => {
          const e = new Error('original error');
          const r = {
            handle: d => {
              throw e;
            },
            error: null
          };

          const resolver = createResolver(r.handle, r.error);

          resolver()
            .catch(err => {
              expect(err).to.equal(e);
              next();
            })
            .catch(err => next(err));

        });
      });
    })
  });
  describe('info parameter', () => {
    it('info parameter should be an empty object', () => {
      const r1 = {
        handle: (root, args, context, info) => {
          expect(typeof info).to.equal('object')
          expect(Object.keys(info).length).to.equal(0)
        },
      };
      const resolver = createResolver(r1.handle);

      resolver(null, null, null)
    })
    it('should pass the info parameter', () => {
      const r1 = {
        handle: (root, args, context, info) => {
          expect(typeof info).to.equal('object')
          expect(info.info).to.equal('info')
        },
      };
      const resolver = createResolver(r1.handle);

      resolver(null, null, null, { info: 'info' })
    })
    it('should pass the info parameter on a chained resolver', () => {
      const r1 = {
        handle: (root, args, context, info) => {
          expect(typeof info).to.equal('object')
          expect(info.info).to.equal('info')
        },
      };

      const r2 = {
        handle: (root, args, context, info) => {
          expect(typeof info).to.equal('object')
          expect(info.chained).to.equal('info')
        },
      };

      const baseResolver = createResolver(r1.handle);
      const chainedResolver = createResolver(r2.handle)

      baseResolver(null, null, null, { info: 'info' })
      chainedResolver(null, null, null, { chained: 'info' })
    })
  })
});
