import { createResolver } from "./resolver";
import * as merge from "deepmerge";
import { isFunction } from "./util";

// Helper function to combine multiple resolver definition hashes into a single hash for consumption by Apollostack's graphql-server
export const combineResolvers = (resolvers = []) => resolvers
  .reduce((combined, resolver) => merge(combined, resolver));

// Accepts multiple authentication resolvers and returns a function which will be called
// if all of the authentication resolvers succeed, or throw an error if one of them fails
export const and = (...conditions) => resolver => {
  return conditions.reduceRight((p, c) => {
    return c.createResolver(p);
  }, resolver)
}

// Accepts multiple authentication resolvers and returns a function which will be called
// if any of the authentication resolvers succeed, or throw an error if all of them fail
export const or = (...conditions) => resolver => (...query) => {
  return new Promise((resolve, reject) => {
    let limit = conditions.length - 1;
    const attempt = (i) =>
      conditions[i].createResolver(resolver)(...query)
        .then(res => resolve(res))
        .catch(err => {
          if(i === limit) reject(err);
          else attempt(i + 1);
        });
    attempt(0);
  });
}

export class Composable {
  resolver: any; // stricter types won't pass the compiler because createResolver is unexpected on Funciton.

  /**
   * 
   * @param resolver 
   * TODO: a Resolver type is probably needed, but outside the scope of this PR because it requires refactoring resolver.ts
   */
  constructor(resFn, errFn) {
    this.resolver = createResolver(resFn, errFn);
  }

  /**
   * 
   * @param resolvers 
   */
  public compose( resolvers: {} ) {
    const composed = {};

    Object.keys(resolvers).forEach(key => {
      const resolver = resolvers[key];

      composed[key] = (resolver.resolve || resolver.error) 
        ? this.resolver.createResolver(resolver.resolve, resolver.error)
        : this.resolver.createResolver(resolver);
    });

    return composed;
  }

}
