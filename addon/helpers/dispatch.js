import Ember from 'ember';
const { inject: { service }} = Ember;

export default Ember.Helper.extend({
  redux: service(),

  compute([type], options) {
    const redux = this.get('redux');
    // if dot notation detected then type is reference to an action creator
    if (type.indexOf('.')) {
      redux.dispatch(redux.getActionCreator(type)(options));
    } else {
      redux.dispatch(Ember.assign({type}, options));
    }
    return options;
  }  
});
