export function initialize(application) {
  application.inject('route', 'application', 'service:redux');
}

export default {
  name: 'redux',
  initialize
};
