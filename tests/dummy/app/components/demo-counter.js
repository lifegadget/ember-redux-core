import Ember from 'ember';
import layout from '../templates/components/demo-counter';

export default Ember.Component.extend({
  redux: Ember.inject.service(),
  layout: '',
  init() {
    this._super(...arguments);
    this.set('state', this.get('redux').getState());
  },


});
