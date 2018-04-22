# apollo-resolvers
Expressive and composable resolvers for Apollostack's GraphQL server

[![NPM](https://nodei.co/npm/apollo-resolvers.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/apollo-resolvers/)

[![CircleCI](https://circleci.com/gh/thebigredgeek/apollo-resolvers/tree/master.svg?style=shield)](https://circleci.com/gh/thebigredgeek/apollo-resolvers/tree/master)  [![Beerpay](https://beerpay.io/thebigredgeek/apollo-resolvers/badge.svg?style=beer-square)](https://beerpay.io/thebigredgeek/apollo-resolvers)  [![Beerpay](https://beerpay.io/thebigredgeek/apollo-resolvers/make-wish.svg?style=flat-square)](https://beerpay.io/thebigredgeek/apollo-resolvers?focus=wish)

## Overview

When standing up a GraphQL backend, one of the first design decisions you will undoubtedly need to make is how you will handle authentication, authorization, and errors.  GraphQL resolvers present an entirely new paradigm that existing patterns for RESTful APIs fail to adequately address.  Many developers end up writing duplicitous authorization checks in a vast majority of their resolver functions, as well as error handling logic to shield the client from encountering exposed internal errors.  The goal of `apollo-resolvers` is to simplify the developer experience in working with GraphQL by abstracting away many of these decisions into a nice, expressive design pattern.

`apollo-resolvers` provides a pattern for creating resolvers that work, essentially, like reactive middleware.  By creating a chain of resolvers to satisfy individual parts of the overall problem, you are able to compose elegant streams that take a GraphQL request and bind it to a model method or some other form of business logic with authorization checks and error handling baked right in.

With `apollo-resolvers`, data flows between composed resolvers in a natural order.  Requests flow down from parent resolvers to child resolvers until they reach a point that a value is returned or the last child resolver is reached.  Thrown errors bubble up from child resolvers to parent resolvers until an additional transformed error is either thrown or returned from an error callback or the last parent resolver is reached.

In addition to the design pattern that `apollo-resolvers` provides for creating expressive and composible resolvers, there are also several provided helper methods and classes for handling context creation and cleanup, combining resolver definitions for presentation to `graphql-tools` via `makeExecutableSchema`, and more.

## Example from Apollo Day

[![Authentication and Error Handling in GraphQL](https://img.youtube.com/vi/xaorvBjCE7A/0.jpg)](https://www.youtube.com/watch?v=xaorvBjCE7A)

## Quick start

Install the package:

```bash
npm install apollo-resolvers
```

Create a base resolver for last-resort error masking:

```javascript
import { createResolver } from 'apollo-resolvers';
import { createError, isInstance } from 'apollo-errors';

const UnknownError = createError('UnknownError', {
  message: 'An unknown error has occurred!  Please try again later'
});

export const baseResolver = createResolver(
   //incoming requests will pass through this resolver like a no-op
  null,

  /*
    Only mask outgoing errors that aren't already apollo-errors,
    such as ORM errors etc
  */
  (root, args, context, error) => isInstance(error) ? error : new UnknownError()
);
```

Create a few child resolvers for access control:
```javascript
import { createError } from 'apollo-errors';

import { baseResolver } from './baseResolver';

const ForbiddenError = createError('ForbiddenError', {
  message: 'You are not allowed to do this'
});

const AuthenticationRequiredError = createError('AuthenticationRequiredError', {
  message: 'You must be logged in to do this'
});

export const isAuthenticatedResolver = baseResolver.createResolver(
  // Extract the user from context (undefined if non-existent)
  (root, args, { user }) => {
    if (!user) throw new AuthenticationRequiredError();
  }
);

export const isAdminResolver = isAuthenticatedResolver.createResolver(
  // Extract the user and make sure they are an admin
  (root, args, { user }) => {
    /*
      If thrown, this error will bubble up to baseResolver's
      error callback (if present).  If unhandled, the error is returned to
      the client within the `errors` array in the response.
    */
    if (!user.isAdmin) throw new ForbiddenError();

    /*
      Since we aren't returning anything from the
      request resolver, the request will continue on
      to the next child resolver or the response will
      return undefined if no child exists.
    */
  }
)
```

Create a profile update resolver for our user type:
```javascript
import { isAuthenticatedResolver } from './acl';
import { createError } from 'apollo-errors';

const NotYourUserError = createError('NotYourUserError', {
  message: 'You cannot update the profile for other users'
});

const updateMyProfile = isAuthenticatedResolver.createResolver(
  (root, { input }, { user, models: { UserModel } }) => {
    /*
      If thrown, this error will bubble up to isAuthenticatedResolver's error callback
      (if present) and then to baseResolver's error callback.  If unhandled, the error
      is returned to the client within the `errors` array in the response.
    */
    if (!user.isAdmin && input.id !== user.id) throw new NotYourUserError();
    return UserModel.update(input);
  }
);

export default {
  Mutation: {
    updateMyProfile
  }
};
```

Create an admin resolver:
```javascript
import { createError, isInstance } from 'apollo-errors';
import { isAuthenticatedResolver, isAdminResolver } from './acl';

const ExposedError = createError('ExposedError', {
  message: 'An unknown error has occurred'
});

const banUser = isAdminResolver.createResolver(
  (root, { input }, { models: { UserModel } }) => UserModel.ban(input),
  (root, args, context, error) => {
    /*
      For admin users, let's tell the user what actually broke
      in the case of an unhandled exception
    */

    if (!isInstance(error)) throw new ExposedError({
      // overload the message
      message: error.message
    });
  }
);

export default {
  Mutation: {
    banUser
  }
};
```

Combine your resolvers into a single definition ready for use by `graphql-tools`:
```javascript
import { combineResolvers } from 'apollo-resolvers';

import User from './user';
import Admin from './admin';

/*
  This combines our multiple resolver definition
  objects into a single definition object
*/
const resolvers = combineResolvers([
  User,
  Admin
]);

export default resolvers;
```

Conditional resovlers:
```javascript
import { and, or } from 'apollo-resolvers';

import isFooResolver from './foo';
import isBarResolver from './bar';

const banResolver = (root, { input }, { models: { UserModel } })=> UserModel.ban(input);

// Will execute banResolver if either isFooResolver or isBarResolver successfully resolve
// If none of the resolvers succeed, the error from the last conditional resolver will
// be returned
const orBanResolver = or(isFooResolver, isBarResolver)(banResolver);

// Will execute banResolver if both isFooResolver and isBarResolver successfully resolve
// If one of the condition resolvers throws an error, it will stop the execution and
// return the error
const andBanResolver = and(isFooResolver, isBarResolver)(banResolver);

// In both cases, conditions are evaluated from left to right
```

## Resolver context

Resolvers are provided a mutable context object that is shared between all resolvers for a given request.  A common pattern with GraphQL is inject request-specific model instances into the resolver context for each request.  Models frequently reference one another, and unbinding circular references can be a pain.  `apollo-resolvers` provides a request context factory that allows you to bind context disposal to server responses, calling a `dispose` method on each model instance attached to the context to do any sort of required reference cleanup necessary to avoid memory leaks:

``` javascript
import express from 'express';
import bodyParser from 'body-parser';
import { GraphQLError } from 'graphql';
import { graphqlExpress } from 'apollo-server-express';
import { createExpressContext } from 'apollo-resolvers';
import { formatError as apolloFormatError, createError } from 'apollo-errors';

import { UserModel } from './models/user';
import schema from './schema';

const UnknownError = createError('UnknownError', {
  message: 'An unknown error has occurred.  Please try again later'
});

const formatError = error => {
  let e = apolloFormatError(error);

  if (e instanceof GraphQLError) {
    e = apolloFormatError(new UnknownError({
      data: {
        originalMessage: e.message,
        originalError: e.name
      }
    }));
  }

  return e;
};

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  req.user = null; // fetch the user making the request if desired
  next();
});

app.post('/graphql', graphqlExpress((req, res) => {
  const user = req.user;

  const models = {
    User: new UserModel(user)
  };

  const context = createExpressContext({
    models,
    user
  }, res);

  return {
    schema,
    formatError, // error formatting via apollo-errors
    context // our resolver context
  };
}));

export default app;
```
