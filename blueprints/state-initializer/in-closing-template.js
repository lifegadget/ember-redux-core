export function loadState(config) {
  const state = {};
  modules.map(m => {
    state[m] = this[m].loadState(config);
  });

  return state;
}

export function saveState(pre, post) {
  modules.map(m => {
    if(get(pre, m) !== get(post, m)) {
      get(this, m).saveState(pre, post);
    }
  });
}
