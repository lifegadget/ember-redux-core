import Ember from 'ember';
import { v4 } from 'ember-uuid';
import actionCreators from '../mixins/actions/index';
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

  _connect() {
    this._connectStateChangesToContainer();
    this._connectActionCreatorsToContainer();
  },

  /**
   * Responsible for connecting the container to the redux service
   * so they may be updated with state (initial and updated)
   */
  _connectStateChangesToContainer() {
    if(this._reduxRegistration) {
      return;
    }
    const id = v4();
    const keys = get(this, 'stateInterest');
    this.get('redux').connect(id, this, keys);
    this._reduxRegistration = id;
  },

  _connectActionCreatorsToContainer() {
    this.set('actions', Ember.assign(get(this, 'actions'), { actionCreators }) );
  },

  _disconnect() {
    this.get('redux').disconnect(this._reduxRegistration);
    this._reduxRegistration = null;
  },

  _getController() {
    return this.controllerFor(get(this, 'routeName'));
  }

});


redux[Ember.NAME_KEY] = 'redux-mixin';
export default redux;
