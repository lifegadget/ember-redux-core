import Ember from 'ember';
import ReduxMixin from 'ember-redux-core/mixins/redux';
import { module, test } from 'qunit';

module('Unit | Mixin | redux');

// Replace this with your real tests.
test('it works', function(assert) {
  let ReduxObject = Ember.Object.extend(ReduxMixin);
  let subject = ReduxObject.create();
  assert.ok(subject);
});
