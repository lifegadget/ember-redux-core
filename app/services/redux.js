import Ember from 'ember';
import reduxStore from '../redux/storeConfig';
import initialState from '../redux/state-initializers/index';
import watch from '../utils/watch';

const { get, set, computed, typeOf } = Ember;

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
  registry: [],
  reduxSubscribers: [],
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
    // native redux subscription to all change
    const watcher = watch(this.store.getState, '.');
    this.store.subscribe(watcher( (pre, post, changePath) => {
      this.reduxSubscribers.map(fn => fn(pre, post));
    }));
    // add Ember subscribers to queue to receive relevant changes
    this.subscribe(this._notifyContainers.bind(this));
    this.subscribe(this._notifyInitializers.bind(this));
  },
  getState() {
    return this.store.getState();
  },
  dispatch(action) {
    this.store.dispatch(action);
  },
  subscribe(func) {
    this.reduxSubscribers.push(func);
  },

  /**
   * connect
   *
   * Allows containers that need to be kept up-to-date with state
   * to notify the service their "observation points"
   */
  connect(id, context, keys) {
    if (Ember.typeOf(keys) !== 'array' ) {
      keys = keys ? [ keys ] :  [];
    }

    this.registry.push({id, context, keys});
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
   * _notifyContainers
   *
   * Communicates changes to state to containers who have
   * expressed interest through their stateInterest property
   */
  _notifyContainers(pre, post) {
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
   * _notifyInitializers
   *
   * Communicates changes to state-initializers who are managing
   * the part of state which changed
   */
  _notifyInitializers(pre, post) {
    Object.keys(initialState).map(key => {
      if(get(pre, key) !== get(post, key)) {
        initialState[key].saveState(pre, post);
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
