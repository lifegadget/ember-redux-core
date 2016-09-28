import redux from 'npm:redux';
import reducers from './reducers/index';
import enhancers from './enhancers/index';
import middleware from './middleware/index';
import initialState from './state-initializers/index';
import config from 'ember-get-config';

const { createStore, applyMiddleware, compose } = redux;
const devTools = window.devToolsExtension ? window.devToolsExtension() : f => f;
const createStoreWithMiddleware = compose(applyMiddleware(...middleware), devTools, enhancers)(createStore);
const initialize = (c) => {
  return Object.keys(initialState).map(i => {
    return { [i]: initialState[i].loadState(c) };
  })
  .reduce( (prev, current) => Object.assign({}, prev, {[current.key]: current.value}) );
};

export default function() {
  return createStoreWithMiddleware(reducers, initialize(config));
}
