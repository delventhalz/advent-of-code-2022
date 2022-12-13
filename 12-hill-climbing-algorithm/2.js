'use strict';

// --- Part Two ---

const { eachMatrix, eachAdjacent, mapMatrix, least } = require('../lib');


const toNode = (heightChar, [x, y]) => ({
  x,
  y,
  height: heightChar.charCodeAt(0) - 96,
  distance: Infinity,
  edges: []
});

const addEdges = (node, [x, y], map) => {
  eachAdjacent(map, [x, y], (neighbor) => {
    if (neighbor.height <= (node.height + 1)) {
      node.edges.push(neighbor);
    }
  });
};

const measureShortestPath = (nodeMap, start, end) => {
  const startNode = nodeMap[ start[1] ][ start[0] ];
  const endNode = nodeMap[ end[1] ][ end[0] ];
  startNode.distance = 0;

  const unvisited = new Set(nodeMap.flat());
  let next = [startNode];

  while (unvisited.has(endNode) && next.length > 0) {
    const current = least(next, node => node.distance);
    next = next.filter(node => node !== current);

    for (const edge of current.edges) {
      if (unvisited.has(edge)) {
        edge.distance = Math.min(edge.distance, current.distance + 1);
        next.push(edge);
      }
    }

    unvisited.delete(current);
  }

  const distance = endNode.distance;
  eachMatrix(nodeMap, node => {
    node.distance = Infinity;
  });

  return distance;
};


module.exports = (_, rawInput) => {
  const map = rawInput.split('\n').map(row => row.split(''));
  let end;

  eachMatrix(map, (spot, [x, y]) => {
    if (spot === 'S') {
      map[y][x] = 'a';
    }
    if (spot === 'E') {
      end = [x, y];
      map[y][x] = 'z';
    }
  });

  const nodeMap = mapMatrix(map, toNode);
  eachMatrix(nodeMap, addEdges);

  // All possible starting positions happen to be in first column
  const firstCol = nodeMap.map(row => row[0]);

  return least(firstCol.map(({ x, y }) => measureShortestPath(nodeMap, [x, y], end)));
};
