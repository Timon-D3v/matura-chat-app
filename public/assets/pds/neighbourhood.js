"use strict";

var moore = function(range, dimensions) {
    range = range || 1
    dimensions = dimensions || 2
  
    var size = range * 2 + 1
    var length = Math.pow(size, dimensions) - 1
    var neighbors = new Array(length)
  
    for (var i = 0; i < length; i++) {
      var neighbor = neighbors[i] = new Array(dimensions)
      var index = i < length / 2 ? i : i + 1
      for (var dimension = 1; dimension <= dimensions; dimension++) {
        var value = index % Math.pow(size, dimension)
        neighbor[dimension - 1] = value / Math.pow(size, dimension - 1) - range
        index -= value
      }
    }
  
    return neighbors
  }

/**
 * Get the neighbourhood ordered by distance, including the origin point
 * @param {int} dimensionNumber Number of dimensions
 * @returns {Array} Neighbourhood
 */
function getNeighbourhood (dimensionNumber) {
    var neighbourhood = moore(2, dimensionNumber),
        origin = [],
        dimension;

    // filter out neighbours who are too far from the center cell
    // the impact of this, performance wise, is surprisingly small, even in 3d and higher dimensions
    neighbourhood = neighbourhood.filter(function (n) {
        var dist = 0;

        for (var d = 0; d < dimensionNumber; d++) {
            dist += Math.pow(Math.max(0, Math.abs(n[d]) - 1), 2);
        }

        return dist < dimensionNumber; // cellSize = Math.sqrt(this.dimension)
    });

    for (dimension = 0; dimension < dimensionNumber; dimension++) {
        origin.push(0);
    }

    neighbourhood.push(origin);

    // sort by ascending distance to optimize proximity checks
    // see point 5.1 in Parallel Poisson Disk Sampling by Li-Yi Wei, 2008
    // http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.460.3061&rank=1
    neighbourhood.sort(function (n1, n2) {
        var squareDist1 = 0,
            squareDist2 = 0,
            dimension;

        for (dimension = 0; dimension < dimensionNumber; dimension++) {
            squareDist1 += Math.pow(n1[dimension], 2);
            squareDist2 += Math.pow(n2[dimension], 2);
        }

        if (squareDist1 < squareDist2) {
            return -1;
        } else if(squareDist1 > squareDist2) {
            return 1;
        } else {
            return 0;
        }
    });

    return neighbourhood;
}

var neighbourhoodCache = {};

/**
 * Get the neighbourhood ordered by distance, including the origin point
 * @param {int} dimensionNumber Number of dimensions
 * @returns {Array} Neighbourhood
 */
function getNeighbourhoodMemoized (dimensionNumber) {
    if (!neighbourhoodCache[dimensionNumber]) {
        neighbourhoodCache[dimensionNumber] = getNeighbourhood(dimensionNumber);
    }

    return neighbourhoodCache[dimensionNumber];
}

export default getNeighbourhoodMemoized;