import { expect } from 'chai';
import { stub } from 'sinon';

import {
  combineResolvers, and, or, compose, composable
} from '../../dist/helper';
import { createResolver } from '../../dist/resolver';
import { resolveAll } from 'jspm-config';

describe('(unit) src/helper.js', () => {
  describe('combineResolvers', () => {
    it('returns a combined hash of resolvers', () => {
      const hash1 = {
        Foo: {
          bar: d => d
        },
        Query: {
          getFoo: d => d
        },
        Mutation: {
          updateFoo: d => d
        }
      };
      const hash2 = {
        Bar: {
          foo: d => d
        },
        Query: {
          getBar: d => d
        },
        Mutation: {
          updateBar: d => d
        }
      };

      expect(combineResolvers([
        hash1,
        hash2
      ])).to.eql({
        Foo: {
          bar: hash1.Foo.bar
        },
        Bar: {
          foo: hash2.Bar.foo
        },
        Query: {
          getFoo: hash1.Query.getFoo,
          getBar: hash2.Query.getBar
        },
        Mutation: {
          updateFoo: hash1.Mutation.updateFoo,
          updateBar: hash2.Mutation.updateBar
        }
      });
    })
  });

  describe('Conditional resolvers', () => {
    const conditionalErr = new Error('conditional error');
    const successResolver = createResolver(() => null, () => null);
    const failureResolver = createResolver(() => { throw conditionalErr; }, () => null);

    describe('and', () => {
      it('(true, true) succeeds', () => {
        const resolver = and(successResolver, successResolver)(() => true);
        return resolver().then(res => expect(res).to.be.true);
      });

      it('(false, true) throws', () => {
        const resolver = and(failureResolver, successResolver)(() => true);
        return resolver().catch(err => expect(err).to.equal(conditionalErr));
      });

      it('(false, false) throws', () => {
        const resolver = and(failureResolver, failureResolver)(() => true);
        return resolver().catch(err => expect(err).to.equal(conditionalErr));
      });

      it('stops evaluating resolvers after first failure', () => {
        const r1 = {
          handle: () => { throw conditionalErr },
          error: () => null,
        };

        const r2 = {
          handle: () => null,
          error: () => null,
        };

        stub(r1, 'handle', r1.handle);
        stub(r2, 'handle', r2.handle);

        const resolver = or(
          createResolver(r1.handle, r1.error),
          createResolver(r2.handle, r2.error)
        )(() => true);
        return resolver().catch(err => {
          expect(err).to.equal(conditionalErr)
          expect(r1.handle.calledOnce).to.be.true;
          expect(r2.handle.notCalled).to.be.true;
        });
      });

      it('only calls the result resolver once', () => {
        const r1 = {
          handle: () => true,
          error: () => null,
        };

        stub(r1, 'handle', r1.handle);

        const resolver = and(successResolver, successResolver)(createResolver(r1.handle, r1.error));
        return resolver().then(res => {
          expect(res).to.be.true;
          expect(r1.handle.calledOnce).to.be.true;
        });
      });
    });

    describe('or', () => {
      it('(true, true) succeeds', () => {
        const resolver = or(successResolver, successResolver)(() => true);
        return resolver().then(res => expect(res).to.be.true);
      });

      it('(false, true) succeeds', () => {
        const resolver = or(failureResolver, successResolver)(() => true);
        return resolver().then(res => expect(res).to.be.true);
      });

      it('(false, false) throws', () => {
        const resolver = or(failureResolver, failureResolver)(() => true);
        return resolver().catch(err => expect(err).to.equal(conditionalErr));
      });

      it('stops evaluating resolvers after first success', () => {
        const r1 = {
          handle: () => null,
          error: () => null,
        };

        const r2 = {
          handle: () => null,
          error: () => null,
        };

        stub(r1, 'handle', r1.handle);
        stub(r2, 'handle', r2.handle);

        const resolver = or(
          createResolver(r1.handle, r1.error),
          createResolver(r2.handle, r2.error)
        )(() => true);
        return resolver().then(res => {
          expect(res).to.be.true;
          expect(r1.handle.calledOnce).to.be.true;
          expect(r2.handle.notCalled).to.be.true;
        });
      });

      it('only calls the result resolver once', () => {
        const r1 = {
          handle: () => true,
          error: () => null,
        };

        stub(r1, 'handle', r1.handle);

        const resolver = or(failureResolver, successResolver)(createResolver(r1.handle, r1.error));
        return resolver().then(res => {
          expect(res).to.be.true;
          expect(r1.handle.calledOnce).to.be.true;
        });
      });
    });

  });

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
      
      const base = composable(b.resolve, b.error);
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

      const base = composable(b.resolve, b.error);
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

      const base = composable(b.resolve, b.error);
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
      
      const base = composable(b.resolve, b.error);
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
      
      const base = composable(b.resolve, b.error);
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
