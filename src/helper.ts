import * as merge from "deepmerge";

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
export const or = (...conditions) => resolver => (root, args, context, info) => {
  return new Promise((resolve, reject) => {
    let limit = conditions.length - 1;
    const attempt = (i) =>
      createResolver(conditions[i])(root, args, context, info)
        .then(() => {
          createResolver(resolver)(root, args, context, info)
            .then(res => resolve(res))
            .catch(err => reject(err));
        })
        .catch(err => {
          if(i === limit) reject(err);
          else attempt(i + 1);
        });
    attempt(0);
  });
}

