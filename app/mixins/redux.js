import Ember from 'ember';
import { v4 } from 'ember-uuid';
const { get } = Ember;

const redux = Ember.Mixin.create({
  redux: Ember.inject.service(),

  state: null,
  stateInterest: null,
  registry: [],

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
  beforeModel() {
    this._super(...arguments);
    console.log(Ember.assign({}, this));
    Ember.run.later(this._connect.bind(this), 0);
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
  _connect() {
    const id = v4();
    const keys = get(this, 'stateInterest');
    this.get('redux').connect(id, this, keys);
    this._reduxRegistration = id;
  },

  _disconnect() {
    this.get('redux').disconnect(this._reduxRegistration);
  },

  _getController() {
    return this.controllerFor(get(this, 'routeName'));
  }

});


redux[Ember.NAME_KEY] = 'redux-mixin';
export default redux;
