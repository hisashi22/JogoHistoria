/**
 * Geography heightmap for 500 A.D.
 *
 * Real-world theater bounds for the expanded grand scenario:
 * Europe, North/East Africa, Caucasus, Central Asia, Iran, Afghanistan,
 * and the northwestern approaches of India.
 */

const WORLD_MAP_WIDTH = 320;
const WORLD_MAP_HEIGHT = 180;

const GEOGRAPHY_BOUNDS = {
  west: -15,
  east: 92,
  north: 60,
  south: 5
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hash2D(x, y, seed = 1337) {
  let n = x * 374761393 + y * 668265263 + seed * 1013904223;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return (n >>> 0) / 4294967295;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, y, scale = 1) {
  const fx = x * scale;
  const fy = y * scale;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const tx = fx - x0;
  const ty = fy - y0;
  const sx = smoothstep(tx);
  const sy = smoothstep(ty);

  const n00 = hash2D(x0, y0);
  const n10 = hash2D(x1, y0);
  const n01 = hash2D(x0, y1);
  const n11 = hash2D(x1, y1);

  const ix0 = n00 * (1 - sx) + n10 * sx;
  const ix1 = n01 * (1 - sx) + n11 * sx;

  return ix0 * (1 - sy) + ix1 * sy;
}

function fbm(x, y) {
  return (
    valueNoise(x, y, 3) * 0.50 +
    valueNoise(x, y, 7) * 0.25 +
    valueNoise(x, y, 13) * 0.15 +
    valueNoise(x, y, 25) * 0.10
  );
}

function gaussian2D(lon, lat, cx, cy, rx, ry) {
  const dx = (lon - cx) / rx;
  const dy = (lat - cy) / ry;
  return Math.exp(-(dx * dx + dy * dy));
}

function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  const t = abLenSq === 0 ? 0 : clamp((apx * abx + apy * aby) / abLenSq, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointInPolygon(lon, lat, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersects = ((yi > lat) !== (yj > lat)) &&
      (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-9) + xi);

    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceToPolygonEdge(lon, lat, polygon) {
  let minDist = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const d = distToSegment(lon, lat, a[0], a[1], b[0], b[1]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

const LAND_POLYGONS = [
  // Iberia
  [[-9.8, 43.8], [-9.5, 36.0], [-0.6, 36.0], [3.3, 42.7], [0.8, 43.8]],
  // France + Low Countries + west Germany
  [[-5.0, 43.0], [8.5, 43.0], [14.5, 47.0], [14.0, 55.0], [2.0, 56.0], [-5.0, 50.0]],
  // British Isles
  [[-8.0, 49.8], [-10.0, 52.0], [-7.0, 56.0], [-1.0, 58.0], [2.0, 55.0], [1.0, 51.0]],
  // Italy (peninsula)
  [[7.0, 45.8], [13.0, 46.2], [14.8, 41.5], [16.8, 38.7], [15.5, 37.0], [12.6, 38.6], [10.8, 41.0], [8.8, 43.0]],
  // Balkans + Greece
  [[13.0, 46.0], [28.8, 46.0], [30.2, 42.0], [28.5, 39.0], [24.5, 37.0], [19.0, 38.2], [14.5, 42.0]],
  // Bohemia + Austria + Pannonian connector
  [[11.5, 50.8], [19.5, 50.8], [19.8, 46.8], [13.0, 46.2], [11.2, 48.6]],
  // Eastern/Central Europe + steppe edge
  [[14.0, 55.8], [33.0, 56.0], [39.5, 52.0], [39.0, 46.0], [31.0, 44.0], [18.0, 47.0]],
  // Anatolia
  [[26.0, 41.9], [41.8, 42.2], [45.3, 39.0], [41.0, 36.0], [30.0, 35.5], [26.2, 39.0]],
  // Levant coast + inland Syria
  [[33.8, 37.5], [39.5, 37.2], [39.3, 30.0], [34.2, 30.0], [33.0, 33.5]],
  // Upper Mesopotamia / Osrhoene corridor (Edessa region)
  [[37.2, 38.2], [41.0, 38.0], [41.0, 35.2], [37.4, 35.2]],
  // Mesopotamia
  [[39.0, 37.8], [49.0, 37.0], [51.0, 30.0], [43.0, 28.0], [38.8, 32.5]],
  // Iranian plateau
  [[45.0, 40.0], [63.5, 39.5], [63.5, 24.0], [49.0, 24.0], [45.5, 30.0]],
  // Central Asia (Transoxiana + steppe fringe)
  [[54.0, 47.5], [75.0, 48.5], [77.5, 37.5], [66.0, 34.5], [56.0, 37.0]],
  // Afghanistan
  [[60.0, 37.5], [72.0, 37.8], [74.0, 30.0], [62.0, 29.0], [58.5, 34.0]],
  // Northwestern India / Indus basin outskirts
  [[67.0, 34.5], [79.0, 34.2], [80.5, 26.0], [71.0, 22.5], [66.5, 26.5]],
  // North Africa coastal belt
  [[-11.0, 37.2], [34.5, 37.2], [34.0, 27.0], [12.0, 27.5], [-1.0, 29.0], [-9.0, 32.0]],
  // Egypt + Sinai
  [[24.0, 32.2], [35.0, 32.2], [35.0, 22.0], [29.5, 21.8], [25.0, 24.5]],
  // Nile valley into Nubia (Old Dongola corridor)
  [[28.5, 31.8], [33.5, 31.8], [33.8, 24.0], [33.2, 18.0], [30.0, 17.2], [28.8, 23.0]],
  // Arabian Peninsula
  [[34.0, 32.0], [38.0, 31.5], [43.0, 30.5], [48.5, 30.0], [54.8, 25.0], [55.5, 16.5], [51.0, 12.0], [44.0, 13.0], [38.0, 18.0], [34.0, 26.0]],
  // Ethiopia + Horn of Africa
  [[34.8, 18.0], [44.2, 18.0], [47.0, 11.0], [45.0, 8.0], [36.0, 8.0], [33.8, 12.0]],
  // Caucasus region
  [[39.5, 45.5], [49.5, 45.2], [49.2, 40.0], [41.0, 39.8]],
  // Crimea
  [[32.0, 46.6], [37.2, 46.6], [36.8, 44.4], [33.0, 44.3]],
  // Key islands
  [[8.0, 41.5], [9.8, 41.6], [10.0, 38.7], [8.2, 38.6]],      // Sardinia
  [[8.9, 38.3], [15.8, 38.4], [15.6, 36.4], [9.0, 36.4]],      // Sicily
  [[23.1, 35.7], [26.3, 35.7], [26.0, 34.7], [23.3, 34.7]],    // Crete
  [[32.0, 35.8], [34.9, 35.8], [34.9, 34.4], [32.1, 34.4]],    // Cyprus
  [[49.5, 28.8], [51.8, 28.8], [51.8, 26.4], [49.5, 26.4]]     // Gulf coast land patch
];

// Each river has id, name, width_class ('major'|'minor'), and path ([[lon,lat],...]).
// major rivers render wider and require bridges for road crossings.
const RIVER_PATHS = [
  { id: 'nile',      name: 'Nile',      width_class: 'major', path: [[31,25],[31,22],[31,19],[32,16],[33,13]] },
  { id: 'danube',    name: 'Danube',    width_class: 'major', path: [[9,48],[14,47],[19,46],[24,45],[29,45]] },
  { id: 'euphrates', name: 'Euphrates', width_class: 'major', path: [[38,38],[40,36],[42,34],[44,32]] },
  { id: 'tigris',    name: 'Tigris',    width_class: 'major', path: [[43,38],[44,36],[45,34],[46,31]] },
  { id: 'volga',     name: 'Volga',     width_class: 'major', path: [[49,57],[49,53],[50,48],[51,46]] },
  { id: 'po',        name: 'Po',        width_class: 'minor', path: [[8,45],[10,45],[12,45]] },
  { id: 'rhone',     name: 'Rhone',     width_class: 'minor', path: [[6,46],[5,44],[5,43]] },
  { id: 'dnieper',   name: 'Dnieper',   width_class: 'minor', path: [[31,52],[31,49],[31,46]] },
  { id: 'don',       name: 'Don',       width_class: 'minor', path: [[39,57],[40,54],[40,48]] },
  { id: 'jordan',    name: 'Jordan',    width_class: 'minor', path: [[35,33],[35,32],[35,31]] },
  { id: 'amu_darya', name: 'Amu Darya', width_class: 'minor', path: [[64,38],[62,38],[60,37]] },
];

// Major inland water bodies rendered as distinct lakes (not ocean).
// These were geographically significant in the 500–1453 AD period.
const LAKE_POLYGONS = [
  { id: 'caspian',  name: 'Caspian Sea',
    polygon: [[50,37],[51,38],[52,39],[53,40],[53,42],[52,43],[51,44],[50,43],[49,42],[49,40],[49,38]] },
  { id: 'aral',     name: 'Aral Sea',
    polygon: [[59,44],[61,44],[62,45],[61,46],[59,46],[58,45]] },
  { id: 'van',      name: 'Lake Van',
    polygon: [[43,38.5],[44,38.7],[43.5,38.9],[42.8,38.7]] },
  { id: 'dead_sea', name: 'Dead Sea',
    polygon: [[35.4,31.8],[35.6,31.6],[35.5,31.3],[35.3,31.5]] },
];

function isNearRiver(lon, lat) {
  const riverWidthDeg = 0.30;

  for (const river of RIVER_PATHS) {
    const path = river.path;
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, ay] = path[i];
      const [bx, by] = path[i + 1];
      if (distToSegment(lon, lat, ax, ay, bx, by) <= riverWidthDeg) {
        return true;
      }
    }
  }

  return false;
}

function getRiverWidthClass(lon, lat) {
  const riverWidthDeg = 0.30;

  for (const river of RIVER_PATHS) {
    const path = river.path;
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, ay] = path[i];
      const [bx, by] = path[i + 1];
      if (distToSegment(lon, lat, ax, ay, bx, by) <= riverWidthDeg) {
        return river.width_class;
      }
    }
  }

  return null;
}

function isInLake(lon, lat) {
  for (const lake of LAKE_POLYGONS) {
    if (pointInPolygon(lon, lat, lake.polygon)) return true;
  }
  return false;
}

function landMaskData(lon, lat) {
  let inside = false;
  let minEdgeDist = Infinity;

  for (const polygon of LAND_POLYGONS) {
    if (pointInPolygon(lon, lat, polygon)) {
      inside = true;
    }
    const edgeDist = distanceToPolygonEdge(lon, lat, polygon);
    if (edgeDist < minEdgeDist) {
      minEdgeDist = edgeDist;
    }
  }

  return { inside, minEdgeDist };
}

function mountainSignal(lon, lat) {
  let mountains = 0;

  mountains += gaussian2D(lon, lat, 10, 46, 4, 2) * 1.4;   // Alps
  mountains += gaussian2D(lon, lat, 0, 43, 3, 2) * 1.2;    // Pyrenees
  mountains += gaussian2D(lon, lat, 11, 42, 2, 5) * 0.9;   // Apennines
  mountains += gaussian2D(lon, lat, -4, 32, 9, 3) * 1.0;   // Atlas
  mountains += gaussian2D(lon, lat, 43, 42, 5, 2) * 1.45;  // Caucasus
  mountains += gaussian2D(lon, lat, 35, 38, 6, 2) * 1.0;   // Taurus
  mountains += gaussian2D(lon, lat, 46, 33, 5, 3) * 1.25;  // Zagros
  mountains += gaussian2D(lon, lat, 66, 36, 6, 3) * 1.2;   // Hindu Kush
  mountains += gaussian2D(lon, lat, 74, 34, 7, 3) * 1.25;  // Western Himalayas
  mountains += gaussian2D(lon, lat, 66, 44, 7, 3) * 1.0;   // Tien Shan fringe
  mountains += gaussian2D(lon, lat, 39, 11, 4, 3) * 1.25;  // Ethiopian Highlands

  return mountains;
}

function aridSignal(lon, lat) {
  return Math.max(
    gaussian2D(lon, lat, 10, 26, 24, 7), // Sahara edge
    gaussian2D(lon, lat, 45, 23, 11, 7), // Arabian desert
    gaussian2D(lon, lat, 60, 39, 9, 5),  // Iranian plateau dryness
    gaussian2D(lon, lat, 71, 43, 8, 5),  // Central Asian arid belt
    gaussian2D(lon, lat, 72, 29, 8, 5)   // Indus plain dry season belt
  );
}

function generateWorldHeightmap() {
  const map = [];
  const lonSpan = GEOGRAPHY_BOUNDS.east - GEOGRAPHY_BOUNDS.west;
  const latSpan = GEOGRAPHY_BOUNDS.north - GEOGRAPHY_BOUNDS.south;

  for (let y = 0; y < WORLD_MAP_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < WORLD_MAP_WIDTH; x++) {
      const nx = x / (WORLD_MAP_WIDTH - 1);
      const ny = y / (WORLD_MAP_HEIGHT - 1);
      const lon = GEOGRAPHY_BOUNDS.west + nx * lonSpan;
      const lat = GEOGRAPHY_BOUNDS.north - ny * latSpan;

      const n = fbm(nx, ny);
      const { inside, minEdgeDist } = landMaskData(lon, lat);
      const mountains = mountainSignal(lon, lat);
      const arid = aridSignal(lon, lat);

      let elevation;

      if (inside) {
        const coastFactor = clamp(minEdgeDist / 1.3, 0, 1);
        elevation = 56 + coastFactor * 26 + n * 9 + mountains * 72 + arid * 6;
      } else {
        // Outside land polygons: generate coastal shelf near shores, then deep sea.
        if (minEdgeDist < 0.9) {
          const shelf = clamp(1 - (minEdgeDist / 0.9), 0, 1);
          elevation = 45 - shelf * 10 + n * 6;
        } else {
          elevation = 35 - clamp((minEdgeDist - 0.9) * 6, 0, 25) + n * 4;
        }
      }

      // River carving for inland lowlands.
      if (isNearRiver(lon, lat) && elevation > 55 && elevation < 155) {
        elevation = Math.min(elevation, 48);
      }

      // Major inland water bodies: override elevation to shallow-water band (height 40).
      // This makes Caspian, Aral, Lake Van, Dead Sea render as distinct inland lakes.
      // Note: !inside guard removed — Van, Dead Sea, Aral lie inside land polygons.
      if (isInLake(lon, lat)) {
        elevation = 40;
      }

      row.push(Math.floor(clamp(elevation, 0, 255)));
    }
    map.push(row);
  }

  return map;
}

function heightToTerrain(height) {
  if (height <= 50) return 'water';
  if (height <= 95) return 'plains';
  if (height <= 145) return 'hills';
  return 'mountains';
}

function heightToColor(height) {
  // Historic-map inspired palette: muted seas + parchment earth tones.
  if (height <= 12) return '#3f6570';      // Deep sea
  if (height <= 24) return '#4f7880';      // Open sea
  if (height <= 38) return '#668f94';      // Coastal sea
  if (height <= 50) return '#88aca8';      // Shallow water/rivers
  if (height <= 70) return '#d2c398';      // Coastal plains
  if (height <= 95) return '#c4b282';      // Plains
  if (height <= 120) return '#af9c73';     // Uplands
  if (height <= 145) return '#9b8765';     // Hills
  if (height <= 190) return '#7d6b55';     // Mountains
  return '#d8d2c6';                         // Snow/high peaks
}

// Keep name for compatibility with existing game code.
const MEDITERRANEAN_HEIGHTMAP = generateWorldHeightmap();
