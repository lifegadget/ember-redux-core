import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  // docs
  this.route('reducers');
  this.route('the-store');
  this.route('middleware');
  this.route('enhancers');
  this.route('static-initializers');
  this.route('connect');
  this.route('install-and-config');
  this.route('actions');

  // demos
  this.route('count');
  this.route('users');
  this.route('identity');

});

export default Router;
