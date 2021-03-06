import Ember from 'ember';
import ReduxComponent from '../components/redux-component';
import layout from '../templates/components/user-table';

export default ReduxComponent.extend({
  layout,
  tagName: '',
  connect: ['users'],
  updatedUser: {
    name: null,
    email: null,
    phone: null
  },
  updating: null,

  actions: {
    update(id) {
      this.set('updating', id);
    }
  }

});
