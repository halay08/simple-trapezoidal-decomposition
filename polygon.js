import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js'
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter.js'
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer.js'
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp.js'
import 'jsts/org/locationtech/jts/monkey.js'
import * as turf from '@turf/turf'

export function clipPolygon(polygonGeoJSON, lineGeoJSON) {
  // Create a GeoJSON reader and writer
  const reader = new GeoJSONReader()
  const writer = new GeoJSONWriter()

  // Convert GeoJSON objects to JSTS geometries
  const polygon = reader.read(polygonGeoJSON)
  const line = reader.read(lineGeoJSON)

  // Compute a union of the polygon boundary and the line
  const nodedLinework = polygon.getBoundary().union(line)

  // Perform polygonization of the unioned geometry
  const polygonizer = new Polygonizer()
  polygonizer.add(nodedLinework)

  // Extract the resulting polygons
  const resultPolygons = polygonizer.getPolygons()
  const clippedPolygons = []
  for (const poly of resultPolygons) {
    const polyGeoJSON = writer.write(poly)
    // Ensure the new polygon is actually inside the original polygon
    if (RelateOp.overlaps(polygon, poly) || RelateOp.contains(polygon, poly)) {
      clippedPolygons.push(polyGeoJSON)
    }
  }

  return clippedPolygons
}

/**
 * Get coordinates of the polygon.
 *
 * @author Ken Lee <ko@kenstack.io>
 *
 * @param {turf.Polygon} polygon The input polygon
 *
 * @returns Position[]
 */
function getPolygonCoordinates(polygon) {
  const [coordinates] = polygon?.coordinates || []
  return coordinates || []
}

// Function to generate vertical lines from a given vertex
function getPolygonVertexVerticalLine(vertex) {
  const [x] = vertex
  // Define a large number for extending lines far enough
  const maxY = 1e9,
    minY = -1e9

  // Create upward and downward line using turf.lineString
  const verticalLine = turf.lineString([
    [x, minY],
    [x, maxY],
  ])

  return verticalLine
}

export function getOnlyConcaveVerticesCoordinates(polygon) {
  const coordinates = getPolygonCoordinates(polygon)
  const convexPolygon = turf.convex(polygon)

  return coordinates.reduce((acc, cur) => {
    if (turf.booleanPointInPolygon(cur, convexPolygon, { ignoreBoundary: true })) {
      acc.push(cur)
    }
    return acc
  }, [])
}

// Function to perform trapezoidal decomposition
export function decomposeTrapezoidal(originalPolygon) {
  // Extract coordinates and prepare event queue (vertices of the originalPolygon)
  const points = getOnlyConcaveVerticesCoordinates(originalPolygon)

  // Sort vertices by x-coordinate (sweep line algorithm)
  const sortedPoints = points.slice().sort((a, b) => a[0] - b[0])

  // Process each point in the event queue
  const lines = sortedPoints.map((vertex) => {
    // For each vertex, extend vertical lines until they hit another edge
    return getPolygonVertexVerticalLine(vertex)
  })

  let polygonGeoJSON = {
    type: 'Polygon',
    coordinates: [getPolygonCoordinates(originalPolygon)],
  }

  return lines.reduce((acc, line) => {
    if (polygonGeoJSON?.coordinates?.length) {
      const lineGeoJSON = {
        type: 'LineString',
        coordinates: line.geometry.coordinates,
      }
      let clippedPolygons = clipPolygon(polygonGeoJSON, lineGeoJSON)

      if (clippedPolygons?.length) {
        clippedPolygons = clippedPolygons.reduce((acc, curClipped) => {
          const centroid = turf.centroid(turf.polygon(curClipped.coordinates))
          const isInside = turf.booleanPointInPolygon(centroid, originalPolygon, {
            ignoreBoundary: true,
          })
          if (isInside) {
            acc.push(curClipped)
          }
          return acc
        }, [])

        // Get convex polygon from clippedPolygons.
        const index = clippedPolygons.findIndex((item) => {
          const coords = getOnlyConcaveVerticesCoordinates(item)
          return coords.length > 0
        })

        if (index >= 0) {
          polygonGeoJSON = {
            type: 'Polygon',
            coordinates: [getPolygonCoordinates(clippedPolygons[index])],
          }
          clippedPolygons.splice(index, 1)
        }

        acc.push(...clippedPolygons)
      }
    }

    return acc
  }, [])
}
