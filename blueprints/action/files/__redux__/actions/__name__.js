/**
 * ACTIONS CREATOR for <%= dasherizedModuleName %>
 *
 * Action creators are where you store you business logic with an end
 * goal of producting a message that will be dispatched to the
 * Redux store directly or in other cases indirectly by returning
 * a thunk and handing that over to the thunk middleware.
 */

export const action1 = (a) => {
  return {
    type: 'ACTION_1'
  };
};

export const action2 = (a, b) => {
  return {
    type: 'ACTION_2'
  };
};
