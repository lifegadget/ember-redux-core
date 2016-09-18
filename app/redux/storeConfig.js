import redux from 'npm:redux';
import reducers from './reducers/index';
import enhancers from './enhancers/index';
import middleware from './middleware/index';
import initialState from './state-initializers/index';
const config = {};

const { createStore, applyMiddleware, compose } = redux;
const createStoreWithMiddleware = compose(applyMiddleware(...middleware), enhancers)(createStore);

export default function() {
  return createStoreWithMiddleware(reducers, initialState(config));
}
