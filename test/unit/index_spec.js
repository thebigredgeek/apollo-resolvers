import { expect } from 'chai';

import {
  combineResolvers
} from '../../src/helper';

import {
  usePromise
} from '../../src/promise';

import {
  createExpressContext
} from '../../src/context';

import {
  createResolver
} from '../../src/resolver';

import * as api from '../../src/index';

describe('(unit) src/index.js', () => {
  it('is as documented', () => {
    expect(api).to.eql({
      combineResolvers,
      usePromise,
      createExpressContext,
      createResolver
    });
  })
})
