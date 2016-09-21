import Ember from 'ember';
import reduxStore from '../redux/storeConfig';
const { get, set, A, computed, debug, typeOf } = Ember;
const a = A;

const clone = (thingy) => {
  switch(typeOf(thingy)) {
    case 'array':
      return thingy.slice(0);
    case 'object':
    case 'instance':
    case 'class':
      return Ember.assign({}, thingy);

    default:
      return thingy;
  }
};

const redux = Ember.Service.extend({
  /**
   * A registry organised by container registration
   */
  registry: a([]),
  /**
   * Returns the registry organised in an inverted fashion
   * which is more effective for addressing change states
   */
  _stateInterests: computed('__registryChange__', function() {
    const interests = {};
    this.registry.map( registry => {
      registry.keys.map(key => {
        if(!get(interests, key)) {
          interests[key] = [];
        }
        interests[key].push(registry.context);
      });
    });

    return interests;
  }),

  init() {
    this._super(...arguments);
    this.store = reduxStore();
  },
  getState() {
    return this.store.getState();
  },
  dispatch(action) {
    const pre = this.store.getState();
    this.store.dispatch(action);
    const post = this.store.getState();
    this._notify(pre, post);
  },
  subscribe(func) {
    return this.store.subscribe(func);
  },

  /**
   * connect
   *
   * Allows containers that need to be kept up-to-date with state
   * to notify the service their "observation points"
   */
  connect(id, context, keys) {
    if (Ember.typeOf(keys) !== 'array' ) {
      keys = [ keys ];
    }

    keys.map(key => {
      this.registry.pushObject({id, context, keys});
      this._setState(id, key);
    });
    this.notifyPropertyChange('__registryChange__');
  },

  /**
   * disconnect
   *
   * Disconnects the interests of the "leaving container"
   * by removing the component from the registry
   */
  disconnect(id) {
    this.registry = this.registry.filter(r => r.id !== id);
    this.notifyPropertyChange('__registryChange__');
  },

  /**
   * _notify
   *
   * An internal API that notifies observers of a change
   * to those properties they've expressed interest in
   */
  _notify(pre, post) {
    const stateInterest = this.get('_stateInterests');
    Object.keys(stateInterest).map((key, index) => {
      if(get(pre, key) !== get(post, key)) {
        stateInterest[key].map(container => {
          this._setState(container._reduxRegistration, key);
        });
      }
    });
  },

  /**
   * _setState
   *
   * Sets the containers state for a specific key which
   * has changed. If the container is a Route then it will
   * instead set the state of it's coorsponding controller.
   */
  _setState(id, key) {
    const container = this.registry.filter(r => r.id === id)[0];
    const prop = key.indexOf(/\w+as\w+/) === -1 ? key.split('.').pop() : key.replace(/.*as\w+/, '');
    const value = key.indexOf(/\w+as\w+/) === -1 ? get(this.getState(), key) : key.replace(/.*as\w+/, '');
    const isRouter = get(container, 'didTransition') ? true : false;
    const routeName = get(container, 'context.routeName');
    const target = routeName ? container.context.controllerFor(routeName) : container.context;

    console.log('is router: ', isRouter, clone(container.context));

    console.log('stateInterest', container, container.context.stateInterest);
    if(!a(clone(get(container.context, 'stateInterest'))).includes(key)) {
      debug(`Warning: setting state section "${key}" which is not registered in "${id}" as a stateInterest`);
    }

    set(target, prop, value);
  }

});

export default redux;
