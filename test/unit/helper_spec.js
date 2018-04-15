import { expect } from 'chai';
import { stub } from 'sinon';

import {
  combineResolvers, and, or,
} from '../../dist/helper';
import { createResolver } from '../../dist/resolver';

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
});
