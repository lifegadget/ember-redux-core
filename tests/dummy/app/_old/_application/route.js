import Ember from 'ember';
import route from 'ember-redux-core/route';

var beforeModel = (dispatch) => {
    dispatch({type: 'ADD_ROLES', roles: roles});
};

var ApplicationRoute = Ember.Route.extend();

export default route({beforeModel})(ApplicationRoute);
