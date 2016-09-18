import redux from 'npm:redux';
import reducers from '../app/reducers/index';
import enhancers from '../app/enhancers/index';
import middleware from '../app/middleware/index';
import initialState from '../app/state-initializers/index';
import config from './environment';

const { createStore, applyMiddleware, compose } = redux;
const createStoreWithMiddleware = compose(applyMiddleware(...middleware), enhancers)(createStore);

export default function() {
  return createStoreWithMiddleware(optional(reducers), initialState(config));
}
