import * as assert from 'assert';

export interface ContextData {
  models: Record<string, any>;
  user: any;
};


export class Context {
  models: Record<string, any>;
  user: any;
  constructor (data: ContextData) {
    Object.keys(data).forEach(key => {
      this[key] = data[key]
    });
  }
  dispose (): void {
    const models = this.models;
    this.models = null;
    this.user = null;
    // Call dispose on every attached model that contains a dispose method
    Object.keys(models).forEach((key) => models[key].dispose ? models[key].dispose() : null);
  }
}

export const createExpressContext = (data, res): Context => {
  data = data || {};
  data.user = data.user || null;
  data.models = data.models || {};
  const context = new Context(data);
  if (res) {
    assert(typeof res.once === 'function', 'createExpressContext takes response as second parameter that implements "res.once"');
    // Bind the response finish event to the context disposal method
    res.once('finish', () => context && context.dispose ? context.dispose() : null);
  }
  return context;
};
