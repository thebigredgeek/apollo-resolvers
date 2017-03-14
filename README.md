# apollo-resolvers
Expressive and composable resolvers for Apollostack's GraphQL server

[![NPM](https://nodei.co/npm/apollo-resolvers.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/apollo-resolvers/)

[![CircleCI](https://circleci.com/gh/thebigredgeek/apollo-resolvers/tree/master.svg?style=shield)](https://circleci.com/gh/thebigredgeek/apollo-resolvers/tree/master)  [![Beerpay](https://beerpay.io/thebigredgeek/apollo-resolvers/badge.svg?style=beer-square)](https://beerpay.io/thebigredgeek/apollo-resolvers)  [![Beerpay](https://beerpay.io/thebigredgeek/apollo-resolvers/make-wish.svg?style=flat-square)](https://beerpay.io/thebigredgeek/apollo-resolvers?focus=wish)

## Installation and usage

Install the package:

```bash
npm install apollo-resolvers
```

Create a base resolver for last-resort error masking:

```javascript
import { createResolver } from 'apollo-resolvers';
import { createError, isInstance } from 'apollo-errors';

const UnknownError = createError({
  message: 'An unknown error has occurred!  Please try again later'
});

export const baseResolver = createResolver(
  null, // don't pass a resolver function, we only care about errors
  
  // Only mask errors that aren't already apollo-errors, such as ORM errors etc
  (root, args, context, error) => isInstance(error) ? error : new UnknownError()
);
```

Create a few ACL child resolvers:
```javascript
import { createError } from 'apollo-errors';

import baseResolver from './baseResolver';

const ForbiddenError = createError({
  message: 'You are not allowed to do this'
});

const AuthenticationRequiredError = createError({
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
    if (!user.isAdmin) throw new ForbiddenError();
  }
)
```

Create a few real-work resolvers for our app:

```javascript
import { isAuthenticatedResolver, isAdminResolver } from './acl';
import { createError } from 'apollo-errors';

const NotYourUserError = createError({
  message: 'You cannot update the profile for other users'
});

const updateMyProfile = isAuthenticatedResolver.createResolver(
  (root, { input }, { user, models: { UserModel } }) => {
    if (!user.isAdmin && input.id !== user.id) throw new NotYourUserError();
    return UserModel.update(input);
  }
);

const banUser = isAdminResolver.createResolver(
  (root, { input }, { models: { UserModel } }) => UserModel.ban(input)
);
```
