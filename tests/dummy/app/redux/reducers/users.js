import Ember from 'ember';
import { v4 } from 'ember-uuid';
/**
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

const updateArray = function(initialArray, newRecord) {
  return initialArray
    .clone(0)
    .map(r => r.id === newRecord.id
      ? Ember.assign({}, r, newRecord)
      : r
  );
};

const defaultState = [];
const reducer = (state, action) => {
  const now = Date.now();

  switch(action.type) {

    case 'USER_ADD':
      const user = Ember.assign(
        action.user,
        { id: v4(), lastUpdated: now, createdAt: now }
      );
      return [ ...state, user ];

    case 'USER_UPDATE':
      const update = Ember.assign(
        action.user,
        { lastUpdated: now }
      );
      return [ updateArray(state, update) ];

    default:
      return state || defaultState;
  } // end switch

};

export default reducer;
