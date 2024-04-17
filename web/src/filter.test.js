import test from 'ava';
import filteredState from './filter';

test('none', t => {
  const state = [
    { id: '1', state: 'open' },
    { id: '2', state: 'full' },
    { id: '3', state: 'offline' },
    { id: '4', state: 'locked' },
  ];
  t.deepEqual(
    state,
    filteredState(state, {})
  );
});

test('state', t => {
  const state = [
    { id: '1', state: 'open' },
    { id: '2', state: 'full' },
    { id: '3', state: 'offline' },
    { id: '4', state: 'locked' },
  ];
  t.deepEqual(
    [
      { id: '2', state: 'full' },
    ],
    filteredState(state, {state: 'full'})
  );
});

// Party size is a number, everything else we compare is a string.
// The filters are all strings.

test('party_size', t => {
  const state = [
    { id: '1', party_size: 1 },
    { id: '2', party_size: 3 },
    { id: '3', party_size: 1 },
    { id: '4', party_size: 2 },
  ];
  t.deepEqual(
    [
      { id: '1', party_size: 1 },
      { id: '3', party_size: 1 },
    ],
    filteredState(state, {party_size: '1'})
  );
});
