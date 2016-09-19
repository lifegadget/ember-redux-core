import Ember from 'ember';
import reduxStore from '../redux/storeConfig';

export default Ember.Service.extend({
  init() {
    this._super(...arguments);
    this.store = reduxStore();
  },
  getState() {
    return this.store.getState();
  },
  dispatch(action) {
    return this.store.dispatch(action);
  },
  subscribe(func) {
    return this.store.subscribe(func);
  }
});
