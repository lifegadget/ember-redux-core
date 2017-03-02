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
   * Wraps a getActionCreator() with a dispatch call
   */
  dispatchActionCreator(ac) {
    return this.dispatch(this.getActionCreator(ac)); 
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
    if(registrations && registrations.length > 0) {
      // If there is a change, then we'll notify
      if (post !== pre) {
        registrations.forEach(registrant => {
          const { context, connectedProperty } = registrant;
          if(isRoute(context)) {
            set(context.controller, connectedProperty, post.toJS ? post.toJS(): post);
          }
          set(context, connectedProperty, post.toJS ? post.toJS(): post);
        });
      }
    }
    // Recurse into deeper nodes of the state tree
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
