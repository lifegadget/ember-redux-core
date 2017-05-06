import Immutable from 'npm:immutable';

/**
 * <%= dasherizedModuleName %> Reducer
 *
 * This reducer takes in the localised state which
 * is owned by this reducer; it's job is create a
 * new (non-mutated) state object for this branch of
 * the overall state tree.
 *
 * The "action" is expected to be an Object who's only
 * required property is "type"
 *
 * Note: as best practice you should always assign
 * a default value for state and handle all unknown
 * actions by returning the state back unchanged.
 */
const defaultState = Immutable.Map();
const reducer = (state, action) => {

  switch(action.type) {

    case 'ABC':
      return defaultState;

    default:
      return state || defaultState;
  } // end switch

};

export default reducer;

