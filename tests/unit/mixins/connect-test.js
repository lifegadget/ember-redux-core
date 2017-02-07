import Ember from 'ember';
import ConnectMixin from 'ember-redux-core/mixins/connect';
import { module, test } from 'qunit';

module('Unit | Mixin | connect');

// Replace this with your real tests.
test('it works', function(assert) {
  let ConnectObject = Ember.Object.extend(ConnectMixin);
  let subject = ConnectObject.create();
  assert.ok(subject);
});
