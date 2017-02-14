import Immutable from 'npm:immutable';

export default function watch(getState, objectPath) {
  objectPath = objectPath === '.' ? [] : objectPath.split([/[./]/]);
  let oldValue = Immutable.OrderedMap(getState()).getIn(objectPath);
  return function w (fn) {
    return function () {
      const newValue = Immutable.OrderedMap(getState()).getIn(objectPath);
      if (oldValue !== newValue) {
        // console.log('----');
        // Object.keys(newValue.toJS()).map(key => oldValue.get(key) === newValue.get(key) ? console.log( `${key} is different: `, newValue.get(key).toJS()) : console.log(`${key} is the same`));
        console.log('WATCH fn()');
        fn(newValue, oldValue);
      }
    };
  };
}
