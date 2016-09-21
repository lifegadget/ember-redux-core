import Ember from 'ember';
import redux from '../mixins/redux';

export default Ember.Route.extend(redux, {
  stateInterest: ['count'],

  actions: {
    add() {
      this.get('redux').dispatch({type: 'COUNT_ADD'});
    },
    subtract() {
      this.get('redux').dispatch({type: 'COUNT_SUBTRACT'});
    },
    reset() {
      this.get('redux').dispatch({type: 'COUNT_RESET'});
    },
  }

});
