import Ember from 'ember';
import { v4 } from 'ember-uuid';
const { get } = Ember;

let connectedProperties = {};


const redux = Ember.Mixin.create({
  redux: Ember.inject.service(),
  state: null, // all connected state will reside off of this offset to avoid name collisions
  connect: null, // container should redefine to state their interests within state tree

  init() {
    this._super(...arguments);
    this._isRoute = get(this, 'store') ? true : false;
    if(!this._isRoute) {
      this._connect();
    }
  },

  /**
   * If the container is a route we must wait until the beforeModel
   * hook is called before the `routeName` property will have been resolved.
   */
  setupController(controller) {
    this._super(...arguments);
    this._controllerFor = controller;
    this._connect();
  },

  willDestroyElement() {
    this._super(...arguments);
    this._disconnect();
  },
  willTransition() {
    this._super(...arguments);
    this._disconnect();
  },

  /**
   * Responsible for connecting the container to the redux service
   * so they may be updated with state (initial and updated)
   */
  _connect(routesController) {
    if(this._reduxRegistration) {
      return;
    }
    const id = v4();
    const keys = get(this, 'connect');
    this.get('redux').connect(id, this, keys, routesController);
    this._reduxRegistration = id;
  },

  _disconnect() {
    this.get('redux').disconnect(this._reduxRegistration);
    this._reduxRegistration = null;
  },

});


redux[Ember.NAME_KEY] = 'redux-mixin';
export default redux;
