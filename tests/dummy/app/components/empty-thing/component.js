import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import connect from 'ember-redux-core/components/connect';

var EmptyThingComponent = Ember.Component.extend({
  layout: hbs`
    <span class="empty-state">empty</span>
  `
});

export default connect()(EmptyThingComponent);
