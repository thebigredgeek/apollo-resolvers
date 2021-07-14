import { expect } from 'chai';
import { spy } from 'sinon';
import supertest from 'supertest';
import express from 'express';
import Promise from 'bluebird';

import { createExpressContext } from '../../dist/context';

const createServer = () => {
  const app = express();

  return new Promise((resolve, reject) => {
    const server = app.listen(8187, err => err ? reject(err) : resolve({
      app,
      close: () => server.close()
    }));
  });
};

describe('(integration) src/context', () => {
  describe('createExpressContext', () => {
    let app = null
      , close = null
      , context = null;
    beforeEach(() => createServer().then(({ app: a, close: c}) => {
      app = a;
      close = c;
    }));
    afterEach(() => close());
    it('calls dispose on the returned context when the response finishes', (next) => {
      let context = null;
      app.post('/', (req, res, next) => {
        context = createExpressContext({
          models: {},
          user: {}
        }, res);
        spy(context, 'dispose');
        return res.status(200).send({
          message: 'ok'
        });
      });
      supertest(app)
        .post('/')
        .end((err, res) => {
          try {
            expect(context.dispose.calledOnce).to.be.true;
            next();
          } catch (e) {
            next(e);
          }
        });
    });
  });
});
