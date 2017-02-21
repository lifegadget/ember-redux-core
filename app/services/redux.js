import Ember from 'ember';
import reduxStore from '../redux/storeConfig';
import initialState from '../redux/state-initializers/index';
import actionCreators from '../redux/actions/index';
import watch from '../utils/watch';
import Immutable from 'npm:immutable';

const REGISTRATION_OFFSET = '_registrations';

const { get, set, computed, typeOf } = Ember;
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
  return container.setupController ? true : false;
};

const isImmutable = (props) => {
  if (typeof props === 'string') { return false; }
  props.forEach(prop => {
    if (typeof prop !== 'string' && !Immutable.Iterable.isIterable(prop)) {
      return false;
    }
  });
  return true;
}

const safeGet = (obj, prop) => {
  if (isImmutable(obj) && typeof obj === 'object') {
    try {
      return obj.get(prop);
    } catch(e) {
      console.warn(`Problem getting "${prop}" property on:`, obj);
      console.error(e);
    }
  } else {
    return typeof obj === 'object' ? obj[prop] : null;
  }
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

  init() {
    this._super(...arguments);
    store = reduxStore();
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
   * connect
   *
   * Allows containers that need to be kept up-to-date with state
   * to notify the service their "observation points"; also allows
   * a route to send in a target which is variant from the context
   */
  connect(id, context, keys, target) {
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
  },

  /**
   * disconnect
   *
   * Disconnects the interests of the "leaving container"
   * by removing the component from the registry
   */
  disconnect(id) {
    const keys = this.registry[id].keys;
    const context = this.registry[id].context;
    // clear values on container
    keys.forEach(k => set(context, decomposeKey(k).alias || decomposeKey(k).prop, undefined));
    // remove from registry and notify event system
    delete this.registry[id];
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
    if(registrations) {
      registrations.forEach(registrant => {
        // console.log('Processing registrant: ', get(registrant, 'id'), get(registrant, 'connectedProperty'), paths);
        const before = isImmutable(pre) ? safeGet(pre, registrant.stateProperty) : pre;
        const after = isImmutable(post) ? safeGet(post, registrant.stateProperty) : post;
        if(before !== after) {
          console.log(`Change detected at ${registrant.path}; setting "${registrant.connectedProperty}" to `, after );
          const target = isRoute(registrant.context) ? registrant.context.controller : registrant.context;
          set(target, registrant.connectedProperty, after);
        }
      });
    } 
    Object.keys(paths).filter(p => p !== REGISTRATION_OFFSET).forEach(path => {
      if (isImmutable([pre, post]) ) {
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
