import Ember from 'ember';
const { inject: { service }} = Ember;

export default Ember.Helper.extend({
  redux: service(),
  compute([actionType], options) {
    this
      .get('redux')
      .getActionCreator(actionType)(options);
  }  
});
