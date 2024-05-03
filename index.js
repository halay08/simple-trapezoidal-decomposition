import { decomposeTrapezoidal } from './polygon.js'
import * as turf from '@turf/turf'

// Define the polygon and line in GeoJSON format
const polygon = turf.polygon([
  [
    [108.23395054626502, 16.0537489390081],
    [108.2439946871461, 16.053220021110302],
    [108.24397211513453, 16.04755092267483],
    [108.24023478761109, 16.044779535015692],
    [108.23113721082224, 16.04510126406594],
    [108.23015732274641, 16.047923935455735],
    [108.23680536240724, 16.047633352735318],
    [108.22913495559953, 16.05124428903199],
    [108.2393318041216, 16.050053789755317],
    [108.23395054626502, 16.0537489390081],
  ],
])

const clippedPolygons = decomposeTrapezoidal(polygon.geometry)
clippedPolygons.map((item, index) => {
  console.log(`Polygon ${index}:`, item.coordinates)
})
