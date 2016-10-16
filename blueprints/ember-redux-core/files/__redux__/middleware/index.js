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
 * Alternatively, install a pre-existing middleware with `ember install ember-redux-[name]`
 */

export default [];
