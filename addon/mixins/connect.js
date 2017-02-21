import Ember from 'ember';
import { v4 } from 'ember-uuid';
const { computed } = Ember;

const connect = (connections) => {
  const mixin = Ember.Mixin.create({
    redux: Ember.inject.service(),
    reduxRegistrationId: computed(() => v4()),

    init() {
      this._super(...arguments);
      this._isRoute = this.setupController ? true : false; // TODO: find a better way to test this
      if(!this._isRoute) {
        this._connect(this);
      }
    },

    /**
     * If the container is a route we must wait until the beforeModel
     * hook is called before the `routeName` property will have been resolved.
     */
    setupController(controller) {
      this._super(...arguments);
      this._controllerFor = controller;
      this._connect(controller);
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
    _connect(target) {
      const id = this.get('reduxRegistrationId');
      this.get('redux').connect(id, this, connections, target);
      console.log(`connected: ${id}`);
    },

    _disconnect() {
      const id = this.get('reduxRegistrationId');
      console.log(`disconnecting`);
      this.get('redux').disconnect(id);
      this.set('reduxRegistrationId', null);
    },

    actions: {
      dispatch(type, value, options) {
        const { redux } = this.getProperties('redux');
        redux.dispatch({ type, value, options });
      }
    }

  });

  mixin[Ember.NAME_KEY] = 'connect-mixin';

  return mixin;
};

export default connect;
