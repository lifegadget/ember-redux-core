import redux from 'npm:redux';
import reducers from './reducers/index';
import enhancers from './enhancers/index';
import middleware from './middleware/index';
import initialState from './state-initializers/index';
import config from 'ember-get-config';

const { createStore, applyMiddleware, compose, combineReducers } = redux;
const combinedReducers = typeof reducers === 'function' ? reducers : combineReducers(reducers);
const devTools = window.devToolsExtension ? window.devToolsExtension() : f => f;
const createStoreWithMiddleware = compose(applyMiddleware(...middleware), devTools, enhancers)(createStore);

export default function() {
  return createStoreWithMiddleware(combinedReducers, initialState.loadState(config));
}
