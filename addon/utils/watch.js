import Ember from 'ember';
import Immutable from 'npm:immutable';
const { get } = Ember;

export default function watch(getState, objectPath, compare) {
  objectPath = objectPath === '.' ? [] : objectPath.split([/./]);
  let oldValue = Immutable.Map(getState()).getIn(objectPath);
  return function w (fn) {
    return function () {
      const newValue = Immutable.Map(getState()).getIn(objectPath);
      if (oldValue !== newValue) {
        fn(newValue, oldValue);
      }
    };
  };
}
