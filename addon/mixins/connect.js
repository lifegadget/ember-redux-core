import Ember from 'ember';
import { v4 } from 'ember-uuid';
const { computed } = Ember;

const connect = (connections) => {
  const mixin = Ember.Mixin.create({
    redux: Ember.inject.service(),
    reduxRegistrationId: computed(() => v4()),
    reduxContainerType: computed(function() {
      if (this instanceof Ember.Controller) {
        return 'controller';
      }
      if (this instanceof Ember.Route) {
        return 'route';
      }
      if (this instanceof Ember.Component) {
        return 'component';
      }
      if (this instanceof Ember.Service) {
        return 'service';
      }
    }),

    init() {
      this._super(...arguments);
      const containerType = this.get('reduxContainerType');
      if(containerType === 'service') {
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

    didInsertElement() {
      if(this.get('reduxContainerType') === 'component') {
        this._connect(this);
      }
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
      this.get('redux').connect(id, this, connections, target)
        .then(() => {
          if(Ember.typeOf(this.onConnect) === 'function') {
            this.onConnect(connections);
          }
        });
      console.log(`${this.get('reduxContainerType')} connected: ${id}`);
    },

    _disconnect() {
      const id = this.get('reduxRegistrationId');
      console.log(`${this.get('reduxContainerType')} disconnecting: ${id}`);
      this.get('redux').disconnect(id);
      this.set('reduxRegistrationId', null);
    },

    actions: {
      /**
       * Allows for the dispatch of 
       */
      dispatch(type, value, options = {}) {
        const { redux } = this.getProperties('redux');
        console.log(type, value, options);
        if (type.indexOf('.') !== -1) {
          const ac = redux.getActionCreator(type);
          ac(value, options);
        } else {
          redux.dispatch({ type, value, options });
        }

        return value;
      }
    }

  });
  mixin[Ember.NAME_KEY] = 'connect-mixin';

  return mixin;
};

export default connect;
