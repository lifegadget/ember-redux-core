/**
 * A state-initializer is used to load the initial state when the app first starts
 * ( aka, when the store is created with `createStore()` ). The aim of initializing
 * state, however, is often only achievable if you are maintaining the an up-to-date
 * representation somewhere.
 *
 * For that reason, each initializer is expected to implement two named exports:
 *
 *  1. loadState - this is called when initializing
 *  2. saveState - this is called whenever a change is made to the state being managed
 *                 by this initializer
 *
 */


/**
 * loadState
 *
 * loads state for the "<%= moduleName %>" section of the global state tree
 */
const loadState = (config) => {
  const { environment, modulePrefix } = config;

  return {};
};

/**
 * saveState
 *
 * saves the localized state for the "<%= moduleName %>" section of the global state tree;
 * this export will only be invoked when a change has taken place specifically within the
 * scope that this initializer manages.
 */
const saveState = (pre, post) => {

  // TODO: do something with the change information; if it's not relevant then
  // leave the export as-is

};

export {
  loadState,
  saveState
};
