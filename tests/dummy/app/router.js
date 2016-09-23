import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('count');
  this.route('users');
  this.route('identity');
  this.route('reducers');
  this.route('the-store');
  this.route('middleware');
  this.route('enhancers');
  this.route('static-initializers');
  this.route('connect');
  this.route('install-and-config');
  this.route('actions');
});

export default Router;
