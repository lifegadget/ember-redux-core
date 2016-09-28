import Ember from 'ember';

export function foobar(params/*, hash*/) {
  return params;
}

export default Ember.Helper.helper(foobar);
