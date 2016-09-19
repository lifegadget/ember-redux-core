import Ember from 'ember';
import ajax from 'dummy/utilities/ajax';
import route from 'ember-redux-core/route';

// A redux-thunk action creator to load users.
function loadUsers() {
    return (dispatch) => ajax('/api/users', 'GET').then(
        response => dispatch({type: 'DESERIALIZE_USERS', response: response})
    );
}

const ThunkRoute = Ember.Route.extend({
    actions: {
        // This loading action is invoked by Ember when the model returns a
        // promise. This is used in tests to ensure that this model hooks
        // into Ember's loading substates.
        loading() {
            window.loadingInvoked = true;
        }
    }
});

export default route({
    model: (dispatch) => dispatch(loadUsers())
})(ThunkRoute);
