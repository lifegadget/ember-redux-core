// @ts-check
import Ember from 'ember';
import reduxStore from '../redux/storeConfig';
import initialState from '../redux/state-initializers/index';
import actionCreators from '../redux/actions/index';
import watch from '../utils/watch';
import Immutable from 'npm:immutable';
import StateCache from 'ember-redux-core/utils/redux-state-cache';

const cache = new StateCache();
const { get, set, run, computed, typeOf, debug, RSVP: { Promise } } = Ember;
/**
 * For each part of the state tree which containers are 
 * interested in, we will maintain a list of hashcodes 
 * which represents the value of that part of the state tree.
 * 
 * The map will be keyed off the path/slice in the state tree that 
 * containers are interested.
 */
export let stateHashCodes = Immutable.Map();

let store;
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

const toJS = (thingy) => {
  return Immutable.Iterable.isIterable(thingy) ? thingy.toJS() : thingy;
}

/**
 * Take a descriptive "key" from the connect property of a container
 * and separates into:
 *   - the database "path" 
 *   - the container's "property name"
 *   - optionally an "alias" that will override the "property name" above
 */
const decomposeKey = function(key) {
  const parts = key.split(/[./]/);
  const hasAlias = clone(parts).pop().indexOf(' as ') !== -1;
  const stateProperty = hasAlias ? clone(parts).pop().replace(/\s+as\s+.*/, '') : clone(parts).pop();
  const connectedProperty = hasAlias ? clone(parts).pop().replace(/.*\s+as\s+/, '') : stateProperty;
  return {
    path: key.replace(/\s+as\s+.*/, ''),
    stateProperty,
    connectedProperty
  };
};


// SERVICE DEFINITION
// ------------------------------------------------
const redux = Ember.Service.extend({
  /**
   * A registry organised by container registration
   */
  registry: {},
  reduxSubscribers: {},
  _dispatchListeners: [],

  init() {
    this._super(...arguments);
    store = reduxStore();

    // subscribe to native redux subscribe()
    store.subscribe(watch(store.getState)((post, pre) => this._subscriptionChangeHandler(post, pre)));
    // all other subscriptions should use this service's subscribe method
    Object.keys(initialState).map(key => {
      if (initialState[key].saveState) {
        this.subscribe(this._notifyInitializersOfChange(key), key);
      }
    });

    this._actionCreators = actionCreators;
  },
  /**
   * Handles all the subscriptions stored in reduxSubscribers
   */
  _subscriptionChangeHandler(post, pre) {
    const cacheUpdates = [];
    // review all subscribers for state changes
    Object.keys(this.reduxSubscribers).forEach(subscriber => {
      const { handler, path } = this.reduxSubscribers[subscriber];
      const preState = pre ? pre.getIn(path.split('.')) : Immutable.Map();
      const postState = post ? post.getIn(path.split('.')) : Immutable.Map();

      if (Immutable.Iterable.isIterable(preState)) {
        const preCode = cache.get(path) || 0;
        const postCode = postState.hashCode();
        if (preCode !== postCode) {
          handler(postState, preState);
          cacheUpdates.push({path, value: postCode});
        }
      }
      if (!Immutable.Iterable.isIterable(preState) && preState !== postState) {
        handler(postState, preState);
      }
    });

    // review all connect events/paths
    const paths = this.get('paths');
    Object.keys(paths).map(path => {
      const stateTree = post.getIn(path.split('.'));
      if (Immutable.Iterable.isIterable(stateTree)) {
        const preCode = cache.get(path);
        const postCode = stateTree ? stateTree.hashCode() : 0;
        if (preCode !== postCode) {
          console.log(`state tree change [${path}]: `, stateTree);
          this._notifySubscribersOfChange(path, stateTree);
          cacheUpdates.push({path, value: postCode});
        }
      }
    });

    // update cache
    cache.bulkAdd(cacheUpdates);
  },

  _containerChangeHandler(state) {
    const paths = this.get('paths');
    Object.keys(paths).map(key => {
      const stateTree = state.getIn(key.split('.'));
      const oldHashValue = stateHashCodes[key];
      const newHashValue = stateTree ? stateTree.hashCode() : null;
      if(newHashValue !== oldHashValue) {
        
        stateHashCodes[key] = newHashValue;
        
      }
    });
  },

  getState() {
    return store.getState();
  },
  dispatch(action) {
    store.dispatch(action);
  },
  subscribe(handler, path = '.') {
    const id = Math.random().toString(36).substr(2, 16);
    const state = store.getState();
    this.reduxSubscribers[id] = {handler, path};
    handler(state.getIn(path.split('.'))); // initialize
    console.log(`Redux: subscribed as "${id}" to watch path "${path}"`);
    return id;
  },
  unsubscribe(id) {
    if (!id) {
      debug('Redux: attempt to unsubscribe without sending in an ID');
      return;
    }
    console.log(`Redux: unsubscribing ${id}`);
    delete this.reduxSubscribers[id];
  },

  /**
   * Returns a hash of keys which registered containers are 
   * interested in. Hash is keyed by state subset/slices and
   * is an array of subscribers who care about that section of
   * state
   */
  paths: computed('__registryChange__', function() {
    console.log('CALC REGISTRY PATHS');
    const interests = {};
    const addInterest = (path, context) => {
      if(!interests[path]) { interests[path] = []; }
      interests[path].push(context);  
    }
    Object.keys(this.registry).map( id => {
      const { keys } = this.registry[id];
      const paths = keys.map(k => k.path);
      paths.forEach(path => addInterest(path, id));
    });

    return interests;
  }),


  /**
   * Wraps a getActionCreator() with a dispatch call
   */
  dispatchActionCreator(ac, ...params) {
    return this.dispatch(this.getActionCreator(ac)(...params)); 
  },

  /**
   * Allows components/consumers to ask for a action creator without the need to 
   * import the specific action creator implementation. Notation should be:
   * 
   *  redux.getActionCreator('database.clearUsers')
   * 
   * where `database` would be the name of the `import` and specific action creator
   * function is `clearUsers`. 
   */
  getActionCreator(ac) {
    const [ actionModule, actionFunction ] = ac.split('.');
    if (!actionFunction) {
      debug(`ember-redux-core: you called getActionCreator(string) with the wrong syntax. You passed in: ${ac}`);
      return f => f;
    }

    if (!actionCreators[actionModule]) {
      debug(`ember-redux-core: the action module "${actionModule}" was not found!`);
      return f => f;
    }

    if (!actionCreators[actionModule][actionFunction]) {
      debug(`ember-redux-core: the function "${actionFunction}" does not exist in module ${actionModule}`);
      return f => f;
    }

    return actionCreators[actionModule][actionFunction];
  },

 /**
   * connect
   *
   * Allows containers that need to be kept up-to-date with state
   * to notify the service their "observation points"; also allows
   * a route to send in a target which is variant from the context
   * 
   * Returns a promise which resolves when state has been set 
   */
  connect(id, context, keys, target) {
    return new Promise((resolve) => {
      if (Ember.typeOf(keys) !== 'array' ) {
        keys = keys ? [ keys ] :  [];
      }
      // register
      this.registry[id] = {context, keys: keys.map(k => decomposeKey(k))};
      // initialize containers values & setup for management
      keys.map(key => {
        this._setState(target, key);
      });
      // notify event system
      this.notifyPropertyChange('__registryChange__');
      resolve();
    });
  },

  /**
   * Waits for a particular part/path of the state tree to become truthy
   * at which it point it resolves it's promise with the value of the state tree
   */
  waitForState(path, timeout = 1000) {
    const initialValue = this.getState().getIn(path.split('.'));
    let done = false;
    let id;
    const isEmpty = (thingy) => {
      return Immutable.Iterable.isIterable(thingy)
        ? thingy.isEmpty()
        : !thingy;
    };
    const handler = (resolve) => (post) => {
      if(!isEmpty(post)) {
        done = true;
        this.unsubscribe(id);
        resolve(post);
      } 
    }
    return new Promise((resolve, reject) => {
      if (initialValue && !isEmpty(initialValue)) { return resolve(initialValue); }
      run.later(this, () => {
        if(!done) { 
          reject(`Timed out waiting for ${path}`); 
        }
      }, timeout);

      id = this.subscribe(handler(resolve), path);
    });

  },

  /**
   * waitFor
   * 
   * @param {string}    actionToLookFor  the action.type string or a subset of the string
   * @param {number}    timeout          an integer value for the timeout timeframe
   * @return {Promise}                    resolves the first action which meets action string or rejects in the case of a timeout 
   */
  waitFor(actionToLookFor, timeout = 1000) { 
    const id = Math.random().toString(36).substr(2, 16);
    const unsubscribe = (id) => {
      this._dispatchListeners = this._dispatchListeners.filter(l => l.id !== id);
    };
    const fn = (target, resolve) => (action) => {
      if (action.type && action.type.indexOf(target) !== -1) {
        unsubscribe(id);
        resolve(action);
      }
    };

    return new Promise((resolve, reject) => {

      this._dispatchListeners.push({id, fn: fn(actionToLookFor, resolve)});
      run.later(this, () => {
        unsubscribe(id);
        reject({
          code: 'waitFor/timeout',
          message: `timed out waiting for "${actionToLookFor}" after ${timeout}ms`
        });
      }, timeout);

    });
  },

  /**
   * disconnect
   *
   * Disconnects the interests of the "leaving container"
   * by removing the component from the registry
   */
  disconnect(id) {
    const registry = Ember.assign({}, this.registry);
    delete registry[id];
    this.registry = registry;
    this.notifyPropertyChange('__registryChange__');
  },

  /**
   * _notifySubscribersOfChange
   *
   * Communicates changes to containers who have
   * expressed interest through their "connect" property
   */
  _notifySubscribersOfChange(path, stateTree) {
    const paths = this.get('paths');
    const subscribers = paths[path];
    console.log(`notifying subscribers of change to [${path}]`, subscribers);
    subscribers.forEach(subscriberId => {
      const subscriber = this.registry[subscriberId];
      const connectedProperty = subscriber.keys.filter(k => k.path === path)[0].connectedProperty;
      const containerType = get(subscriber, 'context.reduxContainerType');
      const targets = [subscriber.context];
      if(containerType === 'route') {
        targets.push(subscriber.context.controller);
      }
      targets.forEach(t => t.set(connectedProperty, toJS(stateTree)));
    })
  },

  /**
   * _notifyInitializers
   *
   * Communicates a relevant change in state to the
   * State Initializers so they can save their respective state
   */
  _notifyInitializersOfChange: (key) => (newState, oldState) => {
    console.log(`state-initializer[${key}]:`, newState);
    initialState[key].saveState(newState);
  },

  /**
   * _setState
   *
   * Sets the containers state for a specific key which
   * has changed.
   */
  _setState(container, key) {
    const { path, connectedProperty } = decomposeKey(key);
    const state = Immutable.Map(this.getState());
    const value = path === '.' ? state : state.getIn(path.split(/[./]/));

    set(
      container, 
      connectedProperty, 
      Immutable.Iterable.isIterable(value) ? value.toJS() : value
    );
  },

});

redux[Ember.NAME_KEY] = 'redux';
export default redux;
