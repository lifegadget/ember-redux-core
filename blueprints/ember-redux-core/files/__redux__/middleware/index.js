/**
 * MIDDLEWARE INDEX
 *
 * Middleware is an important concept in Redux and follows conventions that won't be
 * completely foreign to you if you used popular NodeJS servers like Express or Koa.
 *
 * In Redux a middleware must provide the signature:
 *
 *    (store) => (next) => (action) => { ... }
 *
 * This file, is meant as a manager of middleware's that you'll use in this application
 * and typically you will not have to touch this file directly. Instead, if you want to
 * add a middleware to your application just use ember-cli:
 *
 *    ember generate middleware [name]
 *    ember destroy middleware [name]
 *
 * This will create a file '[name].js' who's job it is to export a function which when called
 * will produce a middleware function.
 *
 * It's good to note that in many cases you'll not need to be overly creative as there are
 * many pre-existing middleware's you can take off the shelf and use. In fact, by default
 * we've added two that are VERY common in Redux apps by default both because we think you'll
 * want to use them but also because they serve as a small example (of pulling off the self
 * more than rolling your own).
 */

import thunk from './thunk';

export default [
  thunk
];
