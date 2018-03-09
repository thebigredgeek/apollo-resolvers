import { getPromise } from './promise';
import { isFunction, Promisify, isNotNullOrUndefined } from './util';


export const createResolver = (resFn, errFn) => {
  const Promise = getPromise();
  const baseResolver = (root, args = {}, context = {}, info = {}) => {
    // Return resolving promise with `null` if the resolver function param is not a function
    if (!isFunction(resFn)) return Promise.resolve(null);
    return Promisify(resFn)(root, args, context, info).catch(e => {
      // On error, check if there is an error handler.  If not, throw the original error
      if (!isFunction(errFn)) throw e;
      // Call the error handler.
      return Promisify(errFn)(root, args, context, info, e).then(parsedError => {
        // If it resolves, throw the resolving value or the original error.
        throw parsedError || e
      }, parsedError => {
        // If it rejects, throw the rejecting value or the original error
        throw parsedError || e
      });
    });
  };
  baseResolver['createResolver'] = (cResFn, cErrFn) => {
    const Promise = getPromise();

    const childResFn = (root, args, context, info) => {
      // Start with either the parent resolver function or a no-op (returns null)
      const entry = isFunction(resFn) ? Promisify(resFn)(root, args, context, info) : Promise.resolve(null);
      return entry.then(r => {
        // If the parent returns a value, continue
        if (isNotNullOrUndefined(r)) return r;
        // Call the child resolver function or a no-op (returns null)
        return isFunction(cResFn) ? Promisify(cResFn)(root, args, context, info) : Promise.resolve(null);
      });
    };

    const childErrFn = (root, args, context, info, err) => {
      // Start with either the child error handler or a no-op (returns null)
      const entry = isFunction(cErrFn) ? Promisify(cErrFn)(root, args, context, info, err) : Promise.resolve(null);

      return entry.then(r => {
        // If the child returns a value, throw it
        if (isNotNullOrUndefined(r)) throw r;
        // Call the parent error handler or a no-op (returns null)
        return isFunction(errFn) ? Promisify(errFn)(root, args, context, info, err).then(e => {
          // If it resolves, throw the resolving value or the original error
          throw e || err;
        }, e => {
          // If it rejects, throw the rejecting value or the original error
          throw e || err;
        }) : Promise.resolve(null);
      });
    };

    // Create the child resolver and return it
    return createResolver(childResFn, childErrFn);
  }

  return baseResolver;
};
