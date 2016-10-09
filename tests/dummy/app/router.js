import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  // docs
  this.route('the-store');
  this.route('actions');
  this.route('reducers');
  this.route('static-initializers');
  this.route('middleware');
  this.route('enhancers');
  this.route('connect');
  this.route('install-and-config');

  // demos
  this.route('count');
  this.route('users');
  this.route('identity');

});

export default Router;
