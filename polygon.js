import * as turf from '@turf/turf'
import * as polygonSlice from './polygon-slice.js'

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
  const [coordinates] = polygon?.geometry?.coordinates || []
  return coordinates || []
}

function sortClippedPolygons(polygons) {
  return polygons?.sort((a, b) => {
    const aCoords = a.geometry.coordinates[0]
    const bCoords = b.geometry.coordinates[0]

    const aSouth = Math.min(...aCoords.map((coord) => coord[1]))
    const bSouth = Math.min(...bCoords.map((coord) => coord[1]))

    if (aSouth === bSouth) {
      const aWest = Math.min(...aCoords.map((coord) => coord[0]))
      const bWest = Math.min(...bCoords.map((coord) => coord[0]))
      return aWest - bWest
    }

    return bSouth - aSouth
  })
}

// Function to generate vertical lines from a given vertex
function getPolygonVertexVerticalLine(vertex) {
  const [x, y] = vertex

  const reasonableExtent = 0.05
  const verticalLine = turf.lineString([
    [x, y - reasonableExtent],
    [x, y + reasonableExtent],
  ])

  const centroid = turf.centroid(verticalLine)
  // Specify the angle of rotation in degrees and the rotation options
  const angle = 90 // Rotate by 45 degrees, modify as needed
  const options = { pivot: centroid.geometry.coordinates }

  // Rotate the lineString around its centroid
  return turf.transformRotate(verticalLine, angle, options)
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
  let lines = sortedPoints.map((vertex) => {
    // For each vertex, extend vertical lines until they hit another edge
    return getPolygonVertexVerticalLine(vertex)
  })

  for (let i = 0; i < lines.length - 1; i++) {
    const overlap = turf.lineOverlap(lines[i], lines[i + 1], { tolerance: 0.0005 })
    if (overlap.features.length > 0) {
      lines.splice(i, 1)
    }
  }

  // lines = [lines[0]]

  let clippingPolygonInput = turf.clone(originalPolygon)

  const finalClippedPolygons = lines.reduce((acc, line) => {
    if (clippingPolygonInput?.geometry?.coordinates?.length) {
      const result = polygonSlice.polygonSlice(clippingPolygonInput, line)
      if (result?.features?.length) {
        // Sort NS - EW
        const clippedPolygons = sortClippedPolygons(result?.features).reduce((acc, cur) => {
          // Check the polygon is duplicate
          const prev = acc[acc.length - 1]
          if (prev) {
            const centroidCur = turf.centroid(cur.geometry)
            const centroidPrev = turf.centroid(prev.geometry)
            const distance = turf.distance(centroidCur, centroidPrev, { units: 'meters' })
            if (Math.round(distance) > 1) {
              acc.push(cur)
            }
          } else {
            acc.push(cur)
          }

          return acc
        }, [])

        // Get convex polygon from clippedPolygons.
        const index = clippedPolygons.findIndex((item) => {
          // Calculate the convex hull of the polygon
          const convexHull = turf.convex(item)

          // Compare the convex hull with the original polygon to check for concavity
          const isConvex = turf.booleanEqual(convexHull, item)

          // If it's not convex, it's concave
          return !isConvex
        })

        if (index >= 0) {
          clippingPolygonInput = clippedPolygons[index]
          clippedPolygons.splice(index, 1)
        }

        acc.push(...clippedPolygons)
      }
    }

    return acc
  }, [])

  return sortClippedPolygons(finalClippedPolygons)
}
