import redux from 'npm:redux';
import appReducers from './reducers/index';
import enhancers from './enhancers/index';
import middleware from './middleware/index';
import initialState from './state-initializers/index';
import config from 'ember-get-config';

const { createStore, applyMiddleware, compose, combineReducers } = redux;
const devTools = window.devToolsExtension ? window.devToolsExtension() : f => f;
const createStoreWithMiddleware = compose(applyMiddleware(...middleware), devTools, enhancers)(createStore);

export default function() {
  const allReducers = combineReducers(appReducers, redux.getAddonReducers());
  return createStoreWithMiddleware(allReducers, initialState.loadState(config));
}
