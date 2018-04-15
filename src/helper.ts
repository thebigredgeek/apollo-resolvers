import * as merge from "deepmerge";

// Helper function to combine multiple resolver definition hashes into a single hash for consumption by Apollostack's graphql-server
export const combineResolvers = (resolvers = []) => resolvers
  .reduce((combined, resolver) => merge(combined, resolver));

export const and = (...conditions) => resolver => {
  return conditions.reduceRight((p, c) => {
    return c.createResolver(p);
  }, resolver)
}

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