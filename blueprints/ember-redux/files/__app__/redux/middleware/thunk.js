/**
 * THUNK MIDDLEWARE
 */
import thunk from 'npm:redux-thunk';

const middleware = (store) => (next) => (action) => {
  return thunk.default ? thunk.default : thunk;
}

export default middleware;
