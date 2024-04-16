import test from 'ava';
import stateSorted from './sort';

// State is mapped because the strings are not naturally sortable

test('state › asc', t => {
  const state = {
    '1': { id: '1', state: 'open' },
    '2': { id: '2', state: 'full' },
    '3': { id: '3', state: 'offline' },
    '4': { id: '4', state: 'locked' },
  };
  t.deepEqual(
    [
      { id: '1', state: 'open' },
      { id: '2', state: 'full' },
      { id: '3', state: 'offline' },
      { id: '4', state: 'locked' },
    ],
    stateSorted(state, 'state', 'asc')
  );
});

test('state › desc', t => {
  const state = {
    '1': { id: '1', state: 'open' },
    '2': { id: '2', state: 'full' },
    '3': { id: '3', state: 'offline' },
    '4': { id: '4', state: 'locked' },
  };
  t.deepEqual(
    [
      { id: '4', state: 'locked' },
      { id: '3', state: 'offline' },
      { id: '2', state: 'full' },
      { id: '1', state: 'open' },
    ],
    stateSorted(state, 'state', 'desc')
  );
});


// Map is representative of an alpha sort, with no mapping

test('map › desc', t => {
  const state = {
    '1': { id: '1', map: 'takistan' },
    '2': { id: '2', map: 'chernarusplus' },
    '3': { id: '3', map: 'enoch' },
    '4': { id: '4', map: 'namalsk' },
    '5': { id: '5', map: 'deerisle' },
  };
  t.deepEqual(
    [
      { id: '1', map: 'takistan' },
      { id: '4', map: 'namalsk' },
      { id: '3', map: 'enoch' },
      { id: '5', map: 'deerisle' },
      { id: '2', map: 'chernarusplus' },
    ],
    stateSorted(state, 'map', 'desc')
  );
});

test('map › asc', t => {
  const state = {
    '1': { id: '1', map: 'takistan' },
    '2': { id: '2', map: 'chernarusplus' },
    '3': { id: '3', map: 'enoch' },
    '4': { id: '4', map: 'namalsk' },
    '5': { id: '5', map: 'deerisle' },
  };
  t.deepEqual(
    [
      { id: '2', map: 'chernarusplus' },
      { id: '5', map: 'deerisle' },
      { id: '3', map: 'enoch' },
      { id: '4', map: 'namalsk' },
      { id: '1', map: 'takistan' },
    ],
    stateSorted(state, 'map', 'asc')
  );
});

