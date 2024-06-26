# Simple Trapezoidal Decomposition

[![Version Badge][npm-img]][npm-url]
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

[npm-img]: https://img.shields.io/npm/v/@turf/turf.svg
[npm-url]: https://www.npmjs.com/package/@turf/turf

This repository aims to implement the trapezoidal Decomposition Solution based on the concave vertices of the polygon. Let's consider a scenario where we have a polygon with two distinct concave vertices. Our objective is to clip the polygon using these concave vertices as reference points.

I would like to express my gratitude to the [Turf.js](https://github.com/Turfjs/turf) team for their repositories and npm packages, which have greatly assisted me in building this solution.

![Demo](./assets/img/demo.png)

## Getting Started

Please make sure you have installed NodeJS version 20+ and NPM CLI.

```js
$ npm i
```

### Create a polygon

```js
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
```

### Clip the polygon

```js
const clippedPolygons = decomposeTrapezoidal(polygon.geometry)
clippedPolygons.map((item, index) => {
  console.log(`Polygon ${index + 1}:`, item.geometry.coordinates[0])
})
```
