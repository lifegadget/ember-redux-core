import Ember from 'ember';
const { inject: { service }} = Ember;

export default Ember.Helper.extend({
  redux: service(),
  compute([type], options) {
    this.get('redux').dispatch(Ember.assign({type}, options));
  }  
});
