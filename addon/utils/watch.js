import Immutable from 'npm:immutable';

export default function watch(getState, objectPath) {
  objectPath = objectPath === '.' ? [] : objectPath.split([/[./]/]);
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
