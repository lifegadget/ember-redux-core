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
 * loads state for the "fobart" section of the global state tree
 */
const loadState = (config) => {
  const { environment, modulePrefix } = config;

  return 0;
};

/**
 * saveState
 *
 * saves the localized state for the "fobart" section of the
 * global state tree; this function will only be invoked when a change has taken place
 * specifically within the scope that this initializer manages.
 */
const saveState = (pre, post) => {

  // TODO: do something with the change information; if it's not relevant then
  // leave the export as-is

};

export {
  loadState,
  saveState
};
