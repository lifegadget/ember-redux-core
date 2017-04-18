import Ember from 'ember';
import reduxStore from '../redux/storeConfig';
import initialState from '../redux/state-initializers/index';
import actionCreators from '../redux/actions/index';
import watch from '../utils/watch';
import * as Immutable from 'npm:immutable';

const REGISTRATION_OFFSET = '_registrations';

const { get, set, run, computed, typeOf, debug, RSVP: { Promise } } = Ember;
let store = {};

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

const isRoute = (container) => {
  return container.setupController && !container.isComponent ? true : false;
};

const isImmutable = (props) => {
  if (typeof props === 'string') { return false; }
  if (!Immutable.Iterable.isIterable(props)) { return true; }
  // assumes an array of props was sent in
  props.forEach(prop => {
    if (typeof prop !== 'string' && !Immutable.Iterable.isIterable(prop)) {
      return false;
    }
  });
  return true;
};

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
  reduxSubscribers: [],
  _dispatchListeners: [],

  init() {
    this._super(...arguments);
    store = reduxStore();

    // const reduxDispatch = store.dispatch;
    // const dispatchListening = (action) => {
    //   this._dispatchListeners.forEach(listener => listener.fn(action));
    // };
    // store.dispatch = (action) => {
    //   reduxDispatch(action);
    //   dispatchListening(action);
    // }

    // native redux subscription to all change
    const watcher = watch(store.getState, '.');
    store.subscribe(watcher( (post, pre) => {
      this.reduxSubscribers.map(fn => fn(pre, post));
    }));
    // ensure "connect subscribers" and "state initializers" 
    // receive changes to state
    this.subscribe(this._notifyContainers.bind(this));
    this.subscribe(this._notifyInitializers.bind(this));
    // store actionCreators in service
    this._actionCreators = actionCreators;
  },
  getState() {
    return store.getState();
  },
  dispatch(action) {
    store.dispatch(action);
  },
  subscribe(func) {
    this.reduxSubscribers.push(func);
  },

  /**
   * Returns the registry organised around the various "paths"
   * in the state tree which containers have expressed interest
   */
  paths: computed('__registryChange__', function() {
    const interests = {};
    Object.keys(this.registry).map( id => {
      const registryItem = this.registry[id];
      const { keys, context } = registryItem;
      keys.map(key => {
        const parts = key.path.split(/[./]/);
        // ensure path structure is represented in output hash
        parts.map((k, i) => {
          const partialPath = parts.slice(0, i+1).join('.');
          if(!get(interests, partialPath)) {
            set(interests, partialPath, {});
          }
        });
        // add registry item to path
        const registrationOffset = `${key.path}.${REGISTRATION_OFFSET}`;
        const registrant = Ember.assign({ 
          context,
          id: get(context, 'reduxRegistrationId')
        }, key);
        if (! get(interests, registrationOffset)) {
          set(interests, registrationOffset, [ registrant ]);
        } else {
          get(interests, registrationOffset).push( registrant );
        }
      });
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
    // const waitForState = [];
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
   * waitFor
   * 
   * @param {string} actionToLookFor the action.type string or a subset of the string
   * @param {int}    timeout  an integer value for the timeout timeframe
   * @return {Promise}        resolves the first action which meets action string or rejects in the case of a timeout 
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
      run.later(() => {
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
    const registry = this.registry[id];
    if (registry) {
      const keys = get(registry, `keys`) || [];
      const context = get(registry, 'context');
      // clear values on container
      // keys.forEach(k => set(context, decomposeKey(k).alias || decomposeKey(k).prop, undefined));
      // remove from registry and notify event system
      delete this.registry[id];
    }
    this.notifyPropertyChange('__registryChange__');
  },

  /**
   * _notifyContainers
   *
   * Communicates changes to containers who have
   * expressed interest through their "connect" property
   */
  _notifyContainers(pre, post) {
    const paths = this.get('paths');
    this.connectRegisteredContainers(pre, post, paths);
  },

  connectRegisteredContainers(pre, post, paths) {
    const registrations = paths[REGISTRATION_OFFSET];
    if(registrations && registrations.length > 0) {
      // If there is a change, then we'll notify
      if (post !== pre) {
        registrations.forEach(registrant => {
          const { context, connectedProperty } = registrant;
          if(isRoute(context)) {
            set(context.controller, connectedProperty, Immutable.Iterable.isIterable(post) 
              ? post.toJS()
              : post);
          }
          set(context, connectedProperty, Immutable.Iterable.isIterable(post) 
            ? post.toJS()
            : post);
        });
      }
    }
    // Recurse into deeper nodes of the state tree
    Object.keys(paths).filter(p => p !== REGISTRATION_OFFSET).forEach(path => {
      if (isImmutable([pre, post]) && pre && post) {
        this.connectRegisteredContainers(pre.get(path), post.get(path), paths[path]);
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
      if(pre.get(key) !== post.get(key)) {
        initialState[key].saveState(pre, post);
      }
    });
  },

  /**
   * _setState
   *
   * Sets the containers state for a specific key which
   * has changed.
   */
  _setState(container, key) {
    const { path, connectedProperty, stateProperty } = decomposeKey(key);
    const state = Immutable.OrderedMap(this.getState());
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
