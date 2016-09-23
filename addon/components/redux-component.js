import Ember from 'ember';
import layout from '../templates/components/redux-component';
import ReduxMixin from '../mixins/redux';

const reduxComponent = Ember.Component.extend(ReduxMixin, {
  layout
});


reduxComponent[Ember.NAME_KEY] = 'redux-component';
export default reduxComponent;
