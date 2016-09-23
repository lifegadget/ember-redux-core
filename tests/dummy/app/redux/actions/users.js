import Ember from 'ember';
/**
 * ACTIONS CREATOR for user
 */

export const add = (props) => {
  return Ember.assign({}, props, { type: 'USER_ADD' });
};

export const update = (id, props) => {
  return Ember.assign({}, props, { type: 'USER_UPDATE', id });
};

export const remove = (id) => {
  return Ember.assign({}, { type: 'USER_DELETE', id });
};
