import { decomposeTrapezoidal } from './polygon.js'
import * as turf from '@turf/turf'

// Define the polygon and line in GeoJSON format
const polygon = turf.polygon([
  [
    [117.8825633018336, -32.75702681301532],
    [117.84606873827897, -32.75496911916587],
    [117.85589849978179, -32.751730151092445],
    [117.85323639637512, -32.745771059680216],
    [117.87523477407585, -32.74129684347971],
    [117.87163717811059, -32.74584462961205],
    [117.87887026487863, -32.7496916501948],
    [117.86100073529369, -32.749092630248455],
    [117.86905383631799, -32.75182539848036],
    [117.8620435797708, -32.75381621165349],
    [117.8825633018336, -32.75702681301532],
  ],
])

// Clip the polygons by angle of 45 degrees.
const clippedPolygons = decomposeTrapezoidal(polygon, 1)
const coordinates = clippedPolygons.map((item, index) => item.geometry.coordinates[0])
console.log('coordinates', coordinates, coordinates.length)
