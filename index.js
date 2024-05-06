import { decomposeTrapezoidal } from './polygon.js'
import * as turf from '@turf/turf'

// Define the polygon and line in GeoJSON format
const polygon = turf.polygon([
  [
    [117.86401460111085, -32.75564091134756],
    [117.8460687490761, -32.75496491216645],
    [117.8563587824273, -32.75161621866625],
    [117.85323640717223, -32.74576685268078],
    [117.86634316893021, -32.7450300552656],
    [117.86093110198583, -32.75060740732039],
    [117.86401460111085, -32.75564091134756],
  ],
])

// Clip the polygons by angle of 45 degrees.
const clippedPolygons = decomposeTrapezoidal(polygon, 1)
clippedPolygons.map((item, index) => {
  console.log(`Polygon ${index + 1}:`, item.geometry.coordinates[0])
})
