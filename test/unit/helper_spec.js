import { expect } from 'chai';

import {
  combineResolvers
} from '../../src/helper';

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
});
