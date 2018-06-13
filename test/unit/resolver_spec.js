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
    it('should pass the info parameter to child resolvers', () => {
      const childHandle = (root, args, context, info) => {
        expect(typeof info).to.equal('object')
        expect(info.info).to.equal('info')
      };

      const baseResolver = createResolver();
      const childResolver = baseResolver.createResolver(childHandle)

      childResolver(null, null, null, { info: 'info' })
    })
  })

  describe('Compose resolvers', () => {
    const compositionErr = new Error('composition error');
    const successResolver = createResolver(() => null, () => null);
    const failureResolver = createResolver(() => { throw compositionErr; }, () => null);

    it('composed resolvers are chained, and base resolver is called for each', () => {

      const b = {
        resolve: () => {},
        error: d => compositionErr
      };

      stub(b, 'resolve', b.resolve);
      
      const base = createResolver(b.resolve, b.error);
      const comp = base.compose({ 
        r1: () => true,
        r2: () => true,
        r3: () => true,
       });

      return Promise.all([

        comp.r1().then(r => {
          expect(b.resolve.calledThrice).to.be.true;
          expect(r).to.be.true;
        }),

        comp.r2().then(r => {
          expect(b.resolve.calledThrice).to.be.true;
          expect(r).to.be.true;
        }),

        comp.r3().then(r => {
          expect(r).to.be.true;
          expect(b.resolve.calledThrice).to.be.true;
        })

      ]);
    });

    it('when base throws, child is not called ', () => {
      
      const b = {
        resolve: null,
        error: d => compositionErr
      };

      const r1 = { 
        resolve: () => true,
        error: () => compositionErr
      };
      
      stub(b, 'error', b.error);
      stub(r1, 'error', r1.error);

      const base = createResolver(b.resolve, b.error);
      const comp = base.compose( { r1: r1 } );

      comp.r1()
        .catch( e => {
          expect(b.error.calledOnce).to.be.true;
          expect(r1.resolve.notCalled).to.be.true;
          expect(r1.error.notCalled).to.be.true;
          expect(e).to.equal(compositionErr);
        });
    });

    it('when child throws, parent error is called ', () => {
      const b = {
        resolve: null,
        error: d => null
      };

      const r1 = { 
        resolve: () => true,
        error: () => compositionErr
      };
      
      stub(b, 'error', b.error);
      stub(r1, 'error', r1.error);

      const base = createResolver(b.resolve, b.error);
      const comp = base.compose( { r1: r1 } );

      comp.r1()
        .catch( e => {
          expect(b.error.calledOnce).to.be.true;
          expect(r1.error.calledOnce).to.be.true;
          expect(e).to.equal(compositionErr);
        });
    });

    it('composed resolvers with { resolve: resFn, error: resFn } syntax, resolve and bubble errors correctly', () => {

      const b = {
        resolve: () => {},
        error: d => compositionErr
      };

      const r1 = { 
        resolve: () => { throw Error('some other error') },
        error: () => compositionErr };

      const r2 = { resolve: () => 'r2Result', error: () => compositionErr };
      
      stub(b, 'resolve', b.resolve);
      stub(r1, 'error', r1.error);
      stub(r1, 'resolve', r1.resolve);
      stub(r2, 'resolve', r2.resolve);
      stub(r2, 'error', r2.error);
      
      const base = createResolver(b.resolve, b.error);
      const comp = base.compose({ 
        r1: r1,
        r2: r2,
       });

      return Promise.all([
        comp.r1().catch(e => {
          expect(e).to.equal(compositionErr);
        }),
        comp.r2().then(r => {
          expect(r).to.equal('r2Result');
        }),

      ]).then(()=> {
        expect(r1.resolve.calledOnce).to.be.true;
        expect(r1.error.calledOnce).to.be.true;
        expect(r2.resolve.calledOnce).to.be.true;
        expect(r2.error.notCalled).to.be.true;
      });
    });

    it('composed result has correct structure', () => {

      const b = {
        resolve: () => {},
        error: d => compositionErr
      };

      stub(b, 'resolve', b.resolve);
      
      const base = createResolver(b.resolve, b.error);
      const comp = base.compose({
        r1: { resolve: () => { throw Error('some other error') }, error: () => compositionErr },
        r2: { resolve: () => 'r2Result', error: () => compositionErr },
        r3: {} // should we throw an exception since it is not a resolver or createResolver params?
      });

      const composed = { r0: () => {}, ...comp };

      expect(composed.r0).to.be.a(typeof Function);
      expect(composed.r1).to.be.a(typeof Function);
      expect(composed.r2).to.be.a(typeof Function);
      expect(composed.r3).to.be.a(typeof Function);

    });

  });
});
