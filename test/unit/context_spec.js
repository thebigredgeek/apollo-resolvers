import { expect } from 'chai';
import { spy } from 'sinon';
import EventEmitter from 'events';

import { createExpressContext, Context } from '../../src/context';

describe('(unit) src/context.js', () => {
  describe('createExpressContext', () => {
    it('returns a context', () => {
      const models = {
        bar: 'foo'
      };
      const user = {
        id: '123'
      };
      const other = {
        foo: 'bar'
      };
      const context = createExpressContext({
        models,
        user,
        other
      })
      expect(context instanceof Context).to.be.true;
      expect(context.user).to.equal(user);
      expect(context.models).to.equal(models);
      expect(context.other).to.equal(other);
    });
    describe('returned context', () => {
      let models = null
        , user = null
        , context = null
        , res = null;
      beforeEach(() => {
        res = new EventEmitter();
        models = {
          Foo: {
            dispose: () => {}
          },
          Bar: {
            dispose: () => {}
          }
        };
        user = {};
        context = createExpressContext({
          models,
          user
        }, res);
      });
      it('calls dispose on all models whenever dispose is called', () => {
        spy(models.Foo, 'dispose');
        spy(models.Bar, 'dispose');
        context.dispose();
        expect(models.Foo.dispose.calledOnce).to.be.true;
        expect(models.Bar.dispose.calledOnce).to.be.true;
      });

      describe('response is passed', () => {
        it('disposes whenever res#finish is emitted', () => {
          spy(context, 'dispose');
          res.emit('finish');
          expect(context.dispose.calledOnce).to.be.true;
        });
      });
    });
  })
});
