import {
  point,
  polygon,
  multiPolygon,
  lineString,
  featureCollection,
  lineOffset,
  lineOverlap,
  lineToPolygon,
  unkinkPolygon,
  difference,
  getGeom,
  booleanPointInPolygon,
} from '@turf/turf'
/**
 * Slices {@link Polygon} using a {@link Linestring}.
 *
 * @name polygonSlice
 * @param {Feature<Polygon>} poly Polygon to slice
 * @param {Feature<LineString>} splitter LineString used to slice Polygon
 * @returns {FeatureCollection<Polygon>} Sliced Polygons
 * @example
 * var polygon = {
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[
 *         [0, 0],
 *         [0, 10],
 *         [10, 10],
 *         [10, 0],
 *         [0, 0]
 *     ]]
 *   }
 * };
 * var linestring =  {
 *     "type": "Feature",
 *     "properties": {},
 *     "geometry": {
 *       "type": "LineString",
 *       "coordinates": [
 *         [5, 15],
 *         [5, -15]
 *       ]
 *     }
 *   }
 * var sliced = polygonSlice(polygon, linestring);
 * //=sliced
 */
export function polygonSlice(poly, splitter) {
  poly = getGeom(poly)
  splitter = getGeom(splitter)
  var line = trimStartEndPoints(poly, splitter)
  if (line == null) {
    return featureCollection(poly)
  }

  var feature = cutPolygon(poly, line)

  if (!feature) {
    feature = poly
  }
  let generatedPolygons = []

  if (feature.geometry.type == 'Polygon') {
    generatedPolygons.push(feature)
  }
  if (feature.geometry.type == 'MultiPolygon') {
    feature.geometry.coordinates.forEach((p) => {
      generatedPolygons.push(polygon([p[0]]).geometry)
    })
  }

  return featureCollection(generatedPolygons.map((p) => polygon(p.coordinates)))
}
function cutPolygon(poly, line) {
  var j
  var cutPolyGeoms = []
  var retVal = null
  if (poly.type != 'Polygon' || line.type != 'LineString') return retVal

  var thickLinePolygon = prepareDiffLinePolygon(line)
  var clipped
  try {
    clipped = difference(poly, thickLinePolygon)
  } catch (e) {
    return retVal
  }

  if (clipped.geometry.type == 'MultiPolygon') {
    for (j = 0; j < clipped.geometry.coordinates.length; j++) {
      //@ts-ignore
      var polyg = polygon(clipped.geometry.coordinates[j])
      cutPolyGeoms.push(polyg.geometry.coordinates)
    }
  } else {
    var polyg = polygon(clipped.geometry.coordinates)
    cutPolyGeoms.push(polyg.geometry.coordinates)
  }

  if (cutPolyGeoms.length == 1) {
    retVal = polygon(cutPolyGeoms[0])
  } else if (cutPolyGeoms.length > 1) {
    retVal = multiPolygon(cutPolyGeoms)
  }

  return retVal
}
/**
 * return non self intersection polygon
 * for difference-cutting
 */
function prepareDiffLinePolygon(line) {
  const offsetScale = 0.8

  let polyCoords = []
  let offsetLine = lineOffset(line, -offsetScale, {
    units: 'millimeters',
  })

  polyCoords.push(...offsetLine.geometry.coordinates)

  offsetLine = lineOffset(line, offsetScale, {
    units: 'millimeters',
  })
  for (let k = offsetLine.geometry.coordinates.length - 1; k >= 0; k--) {
    polyCoords.push(offsetLine.geometry.coordinates[k])
  }

  polyCoords.push(polyCoords[0])

  return polygon([polyCoords])
}
/**
 * Prepare linestrings from polygon-cut
 * avoid start and end points inside polygon for calculation
 */
function trimStartEndPoints(poly, line) {
  let j
  let startAt = 0
  let endAt = line.coordinates.length
  for (j = 0; j < line.coordinates.length; j++) {
    if (booleanPointInPolygon(point(line.coordinates[j]), poly)) {
      startAt++
    } else {
      break
    }
  }
  for (j = line.coordinates.length - 1; j >= 0; j--) {
    if (booleanPointInPolygon(point(line.coordinates[j]), poly)) {
      endAt--
    } else {
      break
    }
  }
  line.coordinates = line.coordinates.slice(startAt, endAt)
  return line.coordinates.length > 1 ? line : null
}
