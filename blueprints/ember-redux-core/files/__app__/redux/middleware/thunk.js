/**
 * THUNK MIDDLEWARE
 */
import thunk from 'npm:redux-thunk';
const middleware = thunk.default ? thunk.default : thunk;
export default middleware;
