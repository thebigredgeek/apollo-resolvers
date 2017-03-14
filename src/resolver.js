import { getPromise } from './promise';
import { isFunction, Promisify } from './util';


export const createResolver = (resFn, errFn) => {
  const Promise = getPromise();
  const baseResolver = (root, args = {}, context = {}) => {
    if (!isFunction(resFn)) return Promise.resolve(null);
    return Promisify(resFn)(root, args, context).catch(e => {
      if (!isFunction(errFn)) throw e;
      return Promisify(errFn)(root, args, context, e).then(parsedError => {
        throw parsedError || e
      }, parsedError => {
        throw parsedError || e
      });
    });
  };

  baseResolver.createResolver = (cResFn, cErrFn) => {
    const Promise = getPromise();

    const childResFn = (root, args, context) => {
      const entry = isFunction(resFn) ? Promisify(resFn)(root, args, context) : Promise.resolve(null);
      return entry.then(r => {
        if (r) return r;
        return isFunction(cResFn) ? Promisify(cResFn)(root, args, context) : Promise.resolve(null);
      });
    };

    const childErrFn = (root, args, context, err) => {
      const entry = isFunction(cErrFn) ? Promisify(cErrFn)(root, args, context, err) : Promise.resolve(null);

      return entry.then(r => {
        if (r) throw r;
        return isFunction(errFn) ? Promisify(errFn)(root, args, context, err).then(e => {
          throw e || err;
        }) : Promise.resolve(null)
      });
    };

    return createResolver(childResFn, childErrFn);
  }

  return baseResolver;
};
