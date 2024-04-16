const sortComparables = {
  state: (v) => {
    // open -> full -> offline -> locked
    if(v === 'locked') { return 4; }
    if(v === 'offline') { return 3; }
    if(v === 'full') { return 2; }
    if(v === 'open') { return 1; }
    return 0;
  },
};

export default stateSorted = (state, field, direction) => {
  const arr = Object.values(state);

  if(direction === 'none') { return arr; }

  arr.sort((a, b) => {
    if (a[field] === b[field]) {
      return 0;
    }
    const aComparable = sortComparables[field] ? sortComparables[field](a[field]) : a[field];
    const bComparable = sortComparables[field] ? sortComparables[field](b[field]) : b[field];

    if(direction === 'asc') {
      return aComparable < bComparable ? -1 : 1;
    }
    return aComparable < bComparable ? 1 : -1;
  });
  return arr;
}
