import { getPromise } from './promise';
import { isFunction, Promisify, isNotNullOrUndefined } from './util';

export interface ResultFunction<ResulType> {
  (root: any, args: any, context: any, info: any): PromiseLike<ResulType | void> | ResulType | void;
}

export interface ErrorFunction<ErrorType> {
  (root: any, args: any, context: any, info: any, err: any): PromiseLike<ErrorType | void> | ErrorType | void;
}

export interface CreateResolverFunction {
  <R, E>(resFn: ResultFunction<R> | null, errFn?: ErrorFunction<E>): Resolver<R>;
}

export interface ComposeResolversFunction {
  ( resolvers: { }): {}; // { [name: string]: Resolver<R> | {} }
}

export type ResolverHeader<R> = (root: any, args: any, context: any, info: any) => PromiseLike<R> | R;

export interface Resolver<ResulType> {
  (root: any, args: any, context: any, info: any): PromiseLike<ResulType> | ResulType;
  createResolver: CreateResolverFunction;
  compose: ComposeResolversFunction;
}

export const createResolver: CreateResolverFunction = <R, E>(resFn: ResultFunction<R>, errFn: ErrorFunction<E>): Resolver<R> => {
  const Promise = getPromise();

  const baseResolver: Resolver<R> = ((root: any = {}, args: any = {}, context: any = {}, info: any = {}) => {
    // Return resolving promise with `null` if the resolver function param is not a function
    if (!isFunction(resFn)) return Promise.resolve(null);
    return Promisify(resFn)(root, args, context, info).catch(e => {
      // On error, check if there is an error handler.  If not, throw the original error
      if (!isFunction(errFn)) throw e;
      // Call the error handler.
      return Promisify(errFn)(root, args, context, e).then(parsedError => {
        // If it resolves, throw the resolving value or the original error.
        throw parsedError || e
      }, parsedError => {
        // If it rejects, throw the rejecting value or the original error
        throw parsedError || e
      });
    });
  }) as Resolver<R>;

  baseResolver.createResolver = <R, E>(cResFn: ResultFunction<R>, cErrFn: ErrorFunction<E>): Resolver<R> => {
    const Promise = getPromise();

    const childResFn: ResultFunction<R> = (root: any, args: any, context: any, info: any): PromiseLike<R | void> => {
      // Start with either the parent resolver function or a no-op (returns null)
      const entry: PromiseLike<R> = isFunction(resFn) ? Promisify(resFn)(root, args, context, info) : Promise.resolve(null);
      return entry.then(r => {
        // If the parent returns a value, continue
        if (isNotNullOrUndefined(r)) return r;
        // Call the child resolver function or a no-op (returns null)
        return isFunction(cResFn) ? Promisify(cResFn)(root, args, context, info) : Promise.resolve(null);
      });
    };

    const childErrFn: ErrorFunction<E> = (root: any, args: any, context: any, info: any, err: E): PromiseLike<E | void> => {
      // Start with either the child error handler or a no-op (returns null)
      const entry: PromiseLike<E> = isFunction(cErrFn) ? Promisify(cErrFn)(root, args, context, info, err) : Promise.resolve(null);

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

  baseResolver.compose = ( resolvers: Record<string, { resolve: ResultFunction<any>; error: ErrorFunction<any> }> | ResultFunction<any>): Record<string, { resolve: ResultFunction<any>; error: ErrorFunction<any> }> {
    const composed = {};
    Object.keys(resolvers).forEach(key => {
      const _resolver = resolvers[key];
      composed[key] = (_resolver.resolve || _resolver.error)
        // supports syntax: compose( { myResolver: { resolve: resFn, error: errFn } } )
        ? baseResolver.createResolver(_resolver.resolve, _resolver.error)
        // supports syntax: compose( { myResolver: resolver } )
        : baseResolver.createResolver(_resolver);
    });
    return composed;
  };

  return baseResolver;
};
