import assert from 'assert';

export const createExpressContext = (data, res) => {
  const context = new Context(data);
  if (res) {
    assert(typeof res.once === 'function', 'createExpressContext takes response as second parameter that implements "res.once"');
    res.once('finish', () => context && context.dispose ? context.dispose() : null);
  }
  return context;
};

export class Context {
  constructor ({ models, user }) {
    this.models = models;
    this.user = user;
  }
  dispose () {
    const models = this.models;
    const user = this.user;
    this.models = null;
    this.user = null;
    Object.keys(models).forEach((key) => models[key].dispose ? models[key].dispose() : null);
  }
}
