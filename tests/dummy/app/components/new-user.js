import Ember from 'ember';
import ReduxComponent from 'ember-redux-core/components/redux-component';
import layout from '../templates/components/new-user';

export default ReduxComponent.extend({
  layout,
  tagName: '',
  newUser: {
    name: null,
    email: null,
    phone: null
  },
  isAdding: false,

});
