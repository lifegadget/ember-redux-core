import Ember from 'ember';

export default Ember.Route.extend({
  redux: Ember.inject.service(),

  actions: {
    navigate(routeTo) {
      this.transitionTo(routeTo);
    }
  }
});
