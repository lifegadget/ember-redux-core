import Immutable from 'immutable';
/**
 * <%= dasherizedModuleName %> Reducer
 *
 * This reducer takes in the localised state which
 * is owned by this reducer; it MUST be a pure function
 * with no side-effects.
 *
 * The "action" is expected to be an Object/OrderedMap who's only
 * required property is "type".
 *
 * Note: you should always assign a default
 * value for state and handle all unknown
 * actions by returning the state back unchanged
 *
 * Note: Javascript Objects most closely map to
 * "OrderedMap" as an Immutable data structure. Javascript
 * Arrays map to "List".
 */
const defaultState = Immutable.OrderedMap();
const reducer = (state, action) => {

  switch(action.type) {

    case 'DISPATCHED_ACTION_NAME':
      const fakeUpdate = Immutable.Map({
        one: 1,
        two: 2,
        three: 3
      });

      return state.merge(fakeUpdate);

    default:
      return state || defaultState;
  } // end switch

};

export default reducer;
