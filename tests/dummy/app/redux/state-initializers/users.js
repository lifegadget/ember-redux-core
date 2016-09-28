import Ember from 'ember';
/**
 * A state-initializer is used to load the initial state when the app first starts
 * ( aka, when the store is created with `createStore()` ). The aim of initializing
 * state, however, is often only achievable if you are maintaining the an up-to-date
 * representation somewhere.
 *
 * Each initializer is expected to implement the following named exports
 */

/**
 * loadState
 *
 * loads state for the "users" section of the global state tree
 */
const loadState = (config) => {
  try {
    const serializedState = window.localStorage.getItem('users');
    if (serializedState === null) {
      return undefined;
    }
    console.log(serializedState);
    return JSON.parse(serializedState);
  } catch (err) {
    Ember.debug('There was a problem getting data out of localStorage: ', err);
  }
};

/**
 * saveState
 *
 * saves the localized state for the "users" section of the
 * global state tree; this function will only be invoked when a change has taken place
 * specifically within the scope that this initializer manages.
 */
const saveState = (pre, post) => {

  try {
    window.localStorage.setItem('users', JSON.stringify(post.users));
  } catch (err) {
    Ember.debug('There was a problem saving data to localStorage: ', err);
  }

};

export {
  loadState,
  saveState
};
