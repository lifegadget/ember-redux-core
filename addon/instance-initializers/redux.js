export function initialize(application) {
  const redux = application.lookup('service:redux');
  redux.start();
}

export default {
  name: 'start-redux',
  initialize
};
