import Ember from 'ember';
import reduxStore from '../redux/storeConfig';
import initialState from '../redux/state-initializers/index';
import actionCreators from '../redux/actions/index';
import watch from '../utils/watch';
import Immutable from 'npm:immutable';

const { get, set, put, computed, typeOf } = Ember;
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

const safeGet = (obj, prop) => {
  if (obj && typeof obj === 'object') {
    console.log(obj, prop);
    obj = Immutable.Iterable.isIterable(obj) ? obj : Immutable.OrderedMap(obj);
    let path = prop.split(/[./]/);
    try {
      return obj.getIn(path);
    } catch(e) {
      console.warn(`Problem getting "${prop}" property on:`, obj);
      console.error(e);
    }
  } else {
    return null;
  }
};

const toJS = (value) => {
  return Immutable.Iterable.isIterable(value) ? value.toJS() : value;
};

const pathHasChanged = (pre, post, key) => {
  return safeGet(pre, key) !== safeGet(post, key);
};

const getRegistrations = (path) => {
  return path._registrations ? path._registrations : [];
}

const connectRegisteredContainers = (state, registrations) => {
  registrations.map(registrant => {
    // set(registrant.context, 
    // this._setState(interest.container, interest.path);
  });
};

const processLeafNodes = (pre, post, path, cb) => {
  const leafs = Object.keys(path).filter(n => n !== '_registrations');
  leafs.map(leaf => cb(safeGet(pre,leaf), safeGet(post,leaf), path[leaf]));
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
    stateProperty,
    path: key.replace(/\s+as\s+.*/, ''),
    connectedProperty
  };
};

const redux = Ember.Service.extend({
  /**
   * A registry organised by container registration
   */
  registry: {},

  reduxSubscribers: [],
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
        const registrationOffset = `${key.path}._registrations`;
        const registrant = Ember.assign({ 
          context,
          id: context._reduxRegistration
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

  init() {
    this._super(...arguments);
    store = reduxStore();
    // native redux subscription to all change
    const watcher = watch(store.getState, '.');
    store.subscribe(watcher( (post, pre) => {
      this.reduxSubscribers.map(fn => fn(pre, post));
    }));
    // add Ember subscribers to queue to receive relevant changes
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
   * connect
   *
   * Allows containers that need to be kept up-to-date with state
   * to notify the service their "observation points"
   */
  connect(id, context, keys) {
    if (Ember.typeOf(keys) !== 'array' ) {
      keys = keys ? [ keys ] :  [];
    }
    // register
    this.registry[id] = {context, keys: keys.map(k => decomposeKey(k))};
    // initialize containers values & setup for management
    keys.map(key => {
      console.log('connect: ', key);
      this._setState(context, key);
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
  _notifyContainers(pre, post, paths) {
    paths = paths ? paths : this.get('paths');
    Object.keys(paths).map(key => {
      if(pathHasChanged(pre, post, key)) {
        const localizedPost = post.get(key);
        const localizedPre = post.get(key);
        const localizedPath = paths[key];
        connectRegisteredContainers(localizedPost, getRegistrations(localizedPath));
        processLeafNodes(
          localizedPre, 
          localizedPost, 
          localizedPath, 
          this._notifyContainers.bind(this)
        );
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
   * has changed. If the container is a Route then it will
   * instead set the state of it's coorsponding controller.
   */
  _setState(container, key) {
    const { path, connectedProperty, stateProperty } = decomposeKey(key);
    const state = Immutable.OrderedMap(this.getState());
    const value = path === '.' ? state : state.getIn(path.split(/[./]/));
    const target = this._getTargetComponent(container);

    set(
      target, 
      connectedProperty, 
      Immutable.Iterable.isIterable(value) ? value.toJS() : value
    );
  },

  /**
   * _getTargetComponent
   *
   * based on the type of container (e.g., routes need redirection to controller)
   * it will return a target which should recieve state and action creators
   */
  _getTargetComponent(context) {
    return context._isRoute ? context._controllerFor : context;
  }

});

export default redux;
