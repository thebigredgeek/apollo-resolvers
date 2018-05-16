import { expect } from 'chai';

import {
  combineResolvers, and, or
} from '../../dist/helper';

import {
  usePromise
} from '../../dist/promise';

import {
  createExpressContext
} from '../../dist/context';

import {
  createResolver
} from '../../dist/resolver';

import * as api from '../../dist/index';

describe('(unit) dist/index.js', () => {
  it('is as documented', () => {
    expect(api).to.eql({
      combineResolvers,
      usePromise,
      createExpressContext,
      createResolver,
      and,
      or
    });
  })
})
