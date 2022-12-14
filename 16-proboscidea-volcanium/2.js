'use strict';

// --- Part Two ---

// You're worried that even with an optimal approach, the pressure released
// won't be enough. What if you got one of the elephants to help you?

// It would take you 4 minutes to teach an elephant how to open the right valves
// in the right order, leaving you with only 26 minutes to actually execute
// your plan. Would having two of you working together be better, even if it
// means having less time? (Assume that you teach the elephant before opening
// any valves yourself, giving you both the same full 26 minutes.)

// In the example above, you could teach the elephant to help you as follows:

//     == Minute 1 ==
//     No valves are open.
//     You move to valve II.
//     The elephant moves to valve DD.

//     == Minute 2 ==
//     No valves are open.
//     You move to valve JJ.
//     The elephant opens valve DD.

//     == Minute 3 ==
//     Valve DD is open, releasing 20 pressure.
//     You open valve JJ.
//     The elephant moves to valve EE.

//     == Minute 4 ==
//     Valves DD and JJ are open, releasing 41 pressure.
//     You move to valve II.
//     The elephant moves to valve FF.

//     == Minute 5 ==
//     Valves DD and JJ are open, releasing 41 pressure.
//     You move to valve AA.
//     The elephant moves to valve GG.

//     == Minute 6 ==
//     Valves DD and JJ are open, releasing 41 pressure.
//     You move to valve BB.
//     The elephant moves to valve HH.

//     == Minute 7 ==
//     Valves DD and JJ are open, releasing 41 pressure.
//     You open valve BB.
//     The elephant opens valve HH.

//     == Minute 8 ==
//     Valves BB, DD, HH, and JJ are open, releasing 76 pressure.
//     You move to valve CC.
//     The elephant moves to valve GG.

//     == Minute 9 ==
//     Valves BB, DD, HH, and JJ are open, releasing 76 pressure.
//     You open valve CC.
//     The elephant moves to valve FF.

//     == Minute 10 ==
//     Valves BB, CC, DD, HH, and JJ are open, releasing 78 pressure.
//     The elephant moves to valve EE.

//     == Minute 11 ==
//     Valves BB, CC, DD, HH, and JJ are open, releasing 78 pressure.
//     The elephant opens valve EE.

//     (At this point, all valves are open.)

//     == Minute 12 ==
//     Valves BB, CC, DD, EE, HH, and JJ are open, releasing 81 pressure.

//     ...

//     == Minute 20 ==
//     Valves BB, CC, DD, EE, HH, and JJ are open, releasing 81 pressure.

//     ...

//     == Minute 26 ==
//     Valves BB, CC, DD, EE, HH, and JJ are open, releasing 81 pressure.

// With the elephant helping, after 26 minutes, the best you could do would
// release a total of 1707 pressure.

// With you and an elephant working together for 26 minutes, what is the most
// pressure you could release?

const { range } = require('lodash');
const { count, greatest } = require('../lib');


const VALVE_PATTERN = /^Valve (..) has flow rate=(\d+); tunnels? leads? to valves? (.+)$/;
let WORKING_COUNT = Infinity;

// It turns out JS objects with string keys have a limit of 8 million entries
// and Maps have a limit of 16 million entries. I need more than that.
// An array of maps indexed off the time remaining is a reasonably even spread
// with no extra calculations AND it nearly 30x's my entry limit.
const FOUND = range(0, 27).map(() => new Map());

const parseValve = (valveString) => {
  const [_, id, rateString, tunnelString] = valveString.match(VALVE_PATTERN);

  return {
    id,
    rate: Number(rateString),
    tunnelIds: tunnelString.split(', ')
  };
};

const connectTunnels = (valves) => {
  const valveMap = Object.fromEntries(valves.map(valve => [valve.id, valve]));

  for (const valve of valves) {
    valve.tunnels = valve.tunnelIds.map(id => valveMap[id]);
  }
};

// These two functions are part of a working optimization that can cut time
// down by removing nodes with a rate of zero. Unfortunately, I worked it out
// without realizing that I have no idea how to make the variable time passage
// work with my multi-location approach below.
const __wip__connectTunnels = (valves) => {
  const valveMap = Object.fromEntries(valves.map(valve => [valve.id, valve]));

  for (const valve of valves) {
    valve.tunnels = valve.tunnelIds.map((id) => ({
      id,
      to: valveMap[id],
      time: 1
    }));

    delete valve.tunnelIds;
  }
};

const __wip__disconnectBrokenValves = (valves) => {
  const brokenValves = valves.filter(({ rate }) => rate === 0);

  for (const valve of brokenValves) {
    for (const source of valve.tunnels) {
      for (const dest of valve.tunnels) {
        if (source !== dest) {
          const nextTime = source.time + dest.time;
          let nextTunnel = source.to.tunnels.find(({ id }) => id === dest.id);

          if (!nextTunnel || nextTunnel.time > nextTime) {
            nextTunnel = { ...dest, time: nextTime };
          }

          source.to.tunnels = [
            ...source.to.tunnels.filter(({ id }) => id !== nextTunnel.id && id !== valve.id),
            nextTunnel
          ];
        }
      }
    }
  }
};

const toLabel = (...args) => args.sort().join('');

const findGreatestRelief = (loc1, loc2, time, opened) => {
  if (time <= 0 || opened.size >= WORKING_COUNT) {
    return 0;
  }

  const label = toLabel(loc1.id, loc2.id) + toLabel(...opened);
  if (FOUND[time].has(label)) {
    return FOUND[time].get(label);
  }

  const options1 = [];
  const options2 = [];

  if (loc1.rate > 0 && !opened.has(loc1.id)) {
    options1.push(loc1.rate * (time - 1));
  }
  if (loc2.rate > 0 && !opened.has(loc2.id) && loc1 !== loc2) {
    options2.push(loc2.rate * (time - 1));
  }

  for (const tunnel of loc1.tunnels) {
    options1.push(tunnel);
  }
  for (const tunnel of loc2.tunnels) {
    options2.push(tunnel);
  }

  const branches = [];

  for (const opt1 of options1) {
    for (const opt2 of options2) {
      if (typeof opt1 == 'number' && typeof opt2 === 'number') {
        const nextOpened = new Set([...opened, loc1.id, loc2.id]);
        branches.push(opt1 + opt2 + findGreatestRelief(loc1, loc2, time - 1, nextOpened));
      } else if (typeof opt1 == 'number') {
        const nextOpened = new Set([...opened, loc1.id]);
        branches.push(opt1 + findGreatestRelief(loc1, opt2, time - 1, nextOpened));
      } else if (typeof opt2 === 'number') {
        const nextOpened = new Set([...opened, loc2.id]);
        branches.push(opt2 + findGreatestRelief(opt1, loc2, time - 1, nextOpened));
      } else {
        branches.push(findGreatestRelief(opt1, opt2, time - 1, opened));
      }
    }
  }

  const mostRelief = greatest(branches);
  FOUND[time].set(label, mostRelief);
  return mostRelief;
};


module.exports = (_, rawInput) => {
  const valves = rawInput.split('\n').map(parseValve);
  const start = valves.find(({ id }) => id === 'AA');
  WORKING_COUNT = count(valves, ({ rate }) => rate > 0);

  connectTunnels(valves);
  // __wip__disconnectBrokenValves(valves);

  return findGreatestRelief(start, start, 26, new Set([]));
};

// Your puzzle answer was 2416.
