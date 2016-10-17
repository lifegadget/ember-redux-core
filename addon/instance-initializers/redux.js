export function initialize(application) {
  // application.inject('route', 'application', 'service:redux');
  // const { container = application } = application;
  application.lookup('service:redux');
}

export default {
  name: 'start-redux',
  initialize
};
