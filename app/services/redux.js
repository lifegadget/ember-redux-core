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

const decomposeKey = function(key) {
  const parts = key.split('.');
  const prop = clone(parts).pop();
  const hasAlias = clone(parts).pop().indexOf(' as ') !== -1;
  return {
    prop: hasAlias ? prop.replace(/\s+as\s+.*/, '') : prop,
    alias: hasAlias ? prop.replace(/.*\s+as\s+/, '') : prop,
    path: key.replace(/\s+as\s+.*/, '')
  };
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
        const { prop, alias, path } = decomposeKey(key);
        if(!get(interests, prop)) {
          interests[prop] = [];
        }
        interests[path].push({
          container: registry.context,
          alias: alias,
          prop: prop,
          path: path,
          raw: key
        });
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

    this.registry.pushObject({id, context, keys});
    // initialize state on container
    keys.map(key => {
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
    const stateInterests = this.get('_stateInterests');
    Object.keys(stateInterests).map(id => {
      if(get(pre, id) !== get(post, id)) {
        stateInterests[id].map(interest => {
          this._setState(interest.container._reduxRegistration, interest.raw);
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
  _setState(containerId, key) {
    const { path, alias } = decomposeKey(key);
    const state = this.getState();
    const value = get(state, path);
    const container = this.registry.filter(r => r.id === containerId)[0];
    const routeName = get(container, 'context.routeName');
    const target = container.context._isRoute ? container.context.controllerFor(routeName) : container.context;

    set(target, alias, value);
  }

});

export default redux;
