/**
 * Map and Territory Management
 * Hex-grid based tactical map system
 */

const MAP_CONFIG = {
    width: typeof WORLD_MAP_WIDTH !== 'undefined' ? WORLD_MAP_WIDTH : 200,
    height: typeof WORLD_MAP_HEIGHT !== 'undefined' ? WORLD_MAP_HEIGHT : 120,
    tileSize: 28,
    hexSize: 25,
    viewportWidth: 30, // Number of tiles visible horizontally
    viewportHeight: 20 // Number of tiles visible vertically
};

const WORLD_GENERATION_DEFAULTS = {
    mode: 'historical', // historical | procedural
    seed: '500ad-001',
    terrain: {
        seaLevel: 0.36,
        hillThreshold: 0.61,
        mountainThreshold: 0.76,
        elevationScale: 46,
        ruggednessScale: 21,
        forestMoistureThreshold: 0.6
    },
    climate: {
        temperatureScale: 32,
        humidityScale: 27,
        desertWarmthThreshold: 0.58,
        desertHumidityThreshold: 0.38,
        tundraTemperatureThreshold: 0.27
    },
    resources: {
        spacing: 2,
        richnessHighThreshold: 0.83,
        richnessMediumThreshold: 0.52,
        targetRatios: {
            food: 0.055,
            wood: 0.05,
            stone: 0.04,
            iron: 0.03,
            rare: 0.018
        },
        minCounts: { food: 10, wood: 10, stone: 8, iron: 6, rare: 4 }
    }
};

// Biome moveCostMultiplier semantics:
// values > 1 increase move cost (slower movement / penalty), values < 1 reduce it (faster movement / bonus).
const BIOME_RULES = {
    plains: {
        moveCostMultiplier: 1,
        resourceMultipliers: { food: 1.15, wood: 0.95, stone: 0.95, iron: 0.95, rare: 1 },
        eventWeights: { harvest: 1.25, drought: 0.9, migration: 1, blizzard: 0.2 }
    },
    forest: {
        moveCostMultiplier: 1.06,
        resourceMultipliers: { food: 0.95, wood: 1.35, stone: 0.9, iron: 0.95, rare: 1.05 },
        eventWeights: { harvest: 0.95, drought: 0.7, migration: 0.95, blizzard: 0.35 }
    },
    desert: {
        moveCostMultiplier: 1.12,
        resourceMultipliers: { food: 0.5, wood: 0.35, stone: 1.15, iron: 0.95, rare: 1.25 },
        eventWeights: { harvest: 0.45, drought: 1.35, migration: 1.2, blizzard: 0 }
    },
    mountains: {
        moveCostMultiplier: 1.05,
        resourceMultipliers: { food: 0.45, wood: 0.85, stone: 1.35, iron: 1.25, rare: 1.15 },
        eventWeights: { harvest: 0.4, drought: 0.9, migration: 0.85, blizzard: 0.75 }
    },
    tundra: {
        moveCostMultiplier: 1.12,
        resourceMultipliers: { food: 0.55, wood: 0.65, stone: 1.05, iron: 1.1, rare: 1.1 },
        eventWeights: { harvest: 0.55, drought: 0.3, migration: 1.15, blizzard: 1.4 }
    }
};

function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

function isUnsafeObjectKey(key) {
    return key === '__proto__' || key === 'prototype' || key === 'constructor';
}

function cloneConfigValue(value) {
    if (Array.isArray(value)) return value.map(cloneConfigValue);
    if (isPlainObject(value)) return deepMergeObjects(value, {});
    return value;
}

function deepMergeObjects(base, overrides) {
    if (!isPlainObject(overrides)) {
        if (!isPlainObject(base)) return overrides;
        const clonedBase = {};
        Object.keys(base).forEach((key) => {
            if (isUnsafeObjectKey(key)) return;
            clonedBase[key] = cloneConfigValue(base[key]);
        });
        return clonedBase;
    }
    const result = {};
    if (isPlainObject(base)) {
        Object.keys(base).forEach((key) => {
            if (isUnsafeObjectKey(key)) return;
            result[key] = cloneConfigValue(base[key]);
        });
    }
    Object.keys(overrides).forEach((key) => {
        if (isUnsafeObjectKey(key)) return;
        const incoming = overrides[key];
        result[key] = isPlainObject(incoming)
            ? deepMergeObjects(result[key], incoming)
            : incoming;
    });
    return result;
}

function clampNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, num));
}

function normalizeWorldGenerationConfig(config) {
    const merged = deepMergeObjects(WORLD_GENERATION_DEFAULTS, config || {});
    merged.mode = merged.mode === 'procedural' ? 'procedural' : 'historical';
    merged.seed = String(merged.seed || WORLD_GENERATION_DEFAULTS.seed);
    merged.terrain = isPlainObject(merged.terrain) ? merged.terrain : { ...WORLD_GENERATION_DEFAULTS.terrain };
    merged.climate = isPlainObject(merged.climate) ? merged.climate : { ...WORLD_GENERATION_DEFAULTS.climate };
    merged.resources = isPlainObject(merged.resources) ? merged.resources : { ...WORLD_GENERATION_DEFAULTS.resources };
    merged.resources.targetRatios = isPlainObject(merged.resources.targetRatios)
        ? merged.resources.targetRatios
        : { ...WORLD_GENERATION_DEFAULTS.resources.targetRatios };
    merged.resources.minCounts = isPlainObject(merged.resources.minCounts)
        ? merged.resources.minCounts
        : { ...WORLD_GENERATION_DEFAULTS.resources.minCounts };

    merged.terrain.seaLevel = clampNumber(merged.terrain.seaLevel, 0.2, 0.6, WORLD_GENERATION_DEFAULTS.terrain.seaLevel);
    merged.terrain.hillThreshold = clampNumber(merged.terrain.hillThreshold, 0.45, 0.85, WORLD_GENERATION_DEFAULTS.terrain.hillThreshold);
    merged.terrain.mountainThreshold = clampNumber(merged.terrain.mountainThreshold, 0.55, 0.95, WORLD_GENERATION_DEFAULTS.terrain.mountainThreshold);
    merged.terrain.elevationScale = clampNumber(merged.terrain.elevationScale, 8, 240, WORLD_GENERATION_DEFAULTS.terrain.elevationScale);
    merged.terrain.ruggednessScale = clampNumber(merged.terrain.ruggednessScale, 6, 180, WORLD_GENERATION_DEFAULTS.terrain.ruggednessScale);
    merged.terrain.forestMoistureThreshold = clampNumber(merged.terrain.forestMoistureThreshold, 0.35, 0.85, WORLD_GENERATION_DEFAULTS.terrain.forestMoistureThreshold);

    merged.climate.temperatureScale = clampNumber(merged.climate.temperatureScale, 8, 200, WORLD_GENERATION_DEFAULTS.climate.temperatureScale);
    merged.climate.humidityScale = clampNumber(merged.climate.humidityScale, 8, 200, WORLD_GENERATION_DEFAULTS.climate.humidityScale);
    merged.climate.desertWarmthThreshold = clampNumber(merged.climate.desertWarmthThreshold, 0.35, 0.9, WORLD_GENERATION_DEFAULTS.climate.desertWarmthThreshold);
    merged.climate.desertHumidityThreshold = clampNumber(merged.climate.desertHumidityThreshold, 0.1, 0.7, WORLD_GENERATION_DEFAULTS.climate.desertHumidityThreshold);
    merged.climate.tundraTemperatureThreshold = clampNumber(merged.climate.tundraTemperatureThreshold, 0.05, 0.5, WORLD_GENERATION_DEFAULTS.climate.tundraTemperatureThreshold);

    merged.resources.spacing = Math.round(clampNumber(merged.resources.spacing, 1, 6, WORLD_GENERATION_DEFAULTS.resources.spacing));
    merged.resources.richnessHighThreshold = clampNumber(merged.resources.richnessHighThreshold, 0.5, 0.98, WORLD_GENERATION_DEFAULTS.resources.richnessHighThreshold);
    merged.resources.richnessMediumThreshold = clampNumber(
        merged.resources.richnessMediumThreshold,
        0.1,
        merged.resources.richnessHighThreshold - 0.05,
        WORLD_GENERATION_DEFAULTS.resources.richnessMediumThreshold
    );
    const minimumRichnessGap = 0.05;
    if (merged.resources.richnessHighThreshold <= merged.resources.richnessMediumThreshold + minimumRichnessGap) {
        merged.resources.richnessHighThreshold = clampNumber(
            merged.resources.richnessMediumThreshold + minimumRichnessGap,
            0.5,
            0.98,
            WORLD_GENERATION_DEFAULTS.resources.richnessHighThreshold
        );
        if (merged.resources.richnessHighThreshold <= merged.resources.richnessMediumThreshold + minimumRichnessGap) {
            merged.resources.richnessMediumThreshold = clampNumber(
                merged.resources.richnessHighThreshold - minimumRichnessGap,
                0.1,
                Math.max(0.1, merged.resources.richnessHighThreshold - minimumRichnessGap),
                WORLD_GENERATION_DEFAULTS.resources.richnessMediumThreshold
            );
        }
    }
    return merged;
}

function getGlobalWorldGenerationOverrides() {
    if (typeof window === 'undefined') return null;
    return window.WORLD_GENERATION_CONFIG || null;
}

function resolveWorldGenerationConfig() {
    return normalizeWorldGenerationConfig(getGlobalWorldGenerationOverrides());
}

function hashSeedValue(seedValue) {
    const seedString = String(seedValue ?? '');
    let hash = 2166136261;
    for (let i = 0; i < seedString.length; i++) {
        hash ^= seedString.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

const HISTORIC_MAP_BOUNDS = typeof GEOGRAPHY_BOUNDS !== 'undefined'
    ? GEOGRAPHY_BOUNDS
    : { west: -15, east: 92, north: 60, south: 5 };

function toTileCoordinate(lon, lat) {
    const xNorm = (lon - HISTORIC_MAP_BOUNDS.west) / (HISTORIC_MAP_BOUNDS.east - HISTORIC_MAP_BOUNDS.west);
    const yNorm = (HISTORIC_MAP_BOUNDS.north - lat) / (HISTORIC_MAP_BOUNDS.north - HISTORIC_MAP_BOUNDS.south);

    const x = Math.max(0, Math.min(MAP_CONFIG.width - 1, Math.round(xNorm * (MAP_CONFIG.width - 1))));
    const y = Math.max(0, Math.min(MAP_CONFIG.height - 1, Math.round(yNorm * (MAP_CONFIG.height - 1))));

    return { x, y };
}

function historicTown(id, name, lon, lat, type, importance, extra = {}) {
    return {
        id,
        name,
        ...toTileCoordinate(lon, lat),
        lon,
        lat,
        type,
        importance,
        ...extra
    };
}

const HISTORIC_TOWNS = [
    // Balkans & Greece
    historicTown('constantinople', 'Constantinopla', 28.97, 41.01, 'capital', 10),
    historicTown('thessalonica', 'Tessalônica', 22.95, 40.64, 'city', 8),
    historicTown('athens', 'Atenas', 23.73, 37.98, 'town', 6),
    historicTown('preslav', 'Preslav', 26.82, 43.16, 'city', 7, { faction: 'bulgar' }),
    historicTown('belgrade', 'Belgrado', 20.46, 44.82, 'city', 7),
    historicTown('serdica', 'Sérdica', 23.32, 42.70, 'city', 7),
    historicTown('skopje', 'Escópia', 21.43, 41.99, 'town', 6),

    // Anatolia & Caucasus
    historicTown('nicaea', 'Niceia', 29.72, 40.43, 'city', 7),
    historicTown('antioch', 'Antioquia', 36.20, 36.20, 'city', 9),
    historicTown('iconium', 'Icônio', 32.49, 37.87, 'city', 7),
    historicTown('trebizond', 'Trebizonda', 39.72, 41.00, 'city', 7),
    historicTown('tbilisi', 'Tíflis', 44.80, 41.70, 'town', 6),
    historicTown('ancyra', 'Ancara', 32.86, 39.93, 'city', 7),
    historicTown('caesarea', 'Cesareia da Capadócia', 35.49, 38.73, 'city', 7),
    historicTown('edessa', 'Edessa', 38.79, 37.16, 'city', 7),

    // Levant, Mesopotamia & Arabia
    historicTown('jerusalem', 'Jerusalém', 35.22, 31.78, 'city', 10),
    historicTown('damascus', 'Damasco', 36.29, 33.51, 'city', 8),
    historicTown('aleppo', 'Alepo', 37.16, 36.20, 'city', 8),
    historicTown('baghdad', 'Bagdá', 44.37, 33.31, 'capital', 10, { faction: 'arab' }),
    historicTown('ctesiphon', 'Ctesifonte', 44.58, 33.09, 'capital', 10, { faction: 'sassanid' }),
    historicTown('mosul', 'Mossul', 43.13, 36.34, 'city', 8),
    historicTown('basra', 'Baçorá', 47.78, 30.50, 'city', 7, { faction: 'arab' }),
    historicTown('isfahan', 'Isfahan', 51.67, 32.65, 'city', 8, { faction: 'sassanid' }),
    historicTown('rayy', 'Rei', 51.44, 35.60, 'city', 7, { faction: 'sassanid' }),
    historicTown('merv', 'Merv', 62.18, 37.66, 'city', 8, { faction: 'sassanid' }),
    historicTown('samarkand', 'Samarcanda', 66.97, 39.65, 'city', 8, { faction: 'sassanid' }),
    historicTown('bukhara', 'Buxorá', 64.42, 39.77, 'town', 7, { faction: 'sassanid' }),
    historicTown('herat', 'Herate', 62.20, 34.35, 'city', 7),
    historicTown('balkh', 'Balkh', 66.90, 36.75, 'city', 7),
    historicTown('kabul', 'Cabul', 69.19, 34.53, 'city', 7),
    historicTown('kandahar', 'Candaar', 65.70, 31.62, 'town', 6),
    historicTown('multan', 'Multã', 71.48, 30.20, 'town', 7),
    historicTown('lahore', 'Laor', 74.34, 31.55, 'city', 7),
    historicTown('medina', 'Medina', 39.61, 24.47, 'city', 7, { faction: 'arab' }),
    historicTown('mecca', 'Meca', 39.86, 21.39, 'city', 8, { faction: 'arab' }),
    historicTown('sanaa', 'Saná', 44.20, 15.35, 'town', 6),
    historicTown('aden', 'Áden', 45.03, 12.79, 'town', 6),

    // North Africa & Ethiopia
    historicTown('alexandria', 'Alexandria', 29.92, 31.20, 'city', 9),
    historicTown('fustat', 'Fustate', 31.24, 30.03, 'city', 7),
    historicTown('carthage', 'Cartago', 10.33, 36.86, 'city', 8),
    historicTown('leptis_magna', 'Léptis Magna', 14.29, 32.64, 'town', 6),
    historicTown('tripoli', 'Trípoli', 13.19, 32.89, 'city', 7),
    historicTown('cyrene', 'Cirene', 21.86, 32.83, 'town', 6),
    historicTown('axum', 'Axum', 38.72, 14.13, 'city', 7),
    historicTown('adulis', 'Adúlis', 39.45, 15.30, 'town', 6),
    historicTown('dongola', 'Velha Dongola', 30.48, 18.25, 'town', 6),

    // Italy & Western Mediterranean
    historicTown('rome', 'Roma', 12.50, 41.90, 'capital', 10),
    historicTown('ravenna', 'Ravena', 12.20, 44.42, 'city', 8),
    historicTown('venice', 'Veneza', 12.33, 45.44, 'city', 7),
    historicTown('milan', 'Milão', 9.19, 45.46, 'city', 8),
    historicTown('naples', 'Nápoles', 14.27, 40.85, 'town', 6),
    historicTown('cartagena', 'Cartagena', -0.98, 37.60, 'town', 6),
    historicTown('cordoba', 'Córdova', -4.78, 37.89, 'city', 8),
    historicTown('toledo', 'Toledo', -4.02, 39.86, 'city', 7),
    historicTown('massilia', 'Marselha', 5.37, 43.30, 'city', 7),

    // Central & Northern Europe
    historicTown('aachen', 'Aquisgrão', 6.08, 50.78, 'city', 8, { faction: 'frank' }),
    historicTown('paris', 'Paris', 2.35, 48.86, 'city', 7),
    historicTown('london', 'Londres', -0.13, 51.50, 'city', 7),
    historicTown('kiev', 'Quieve', 30.52, 50.45, 'city', 7),
    historicTown('prague', 'Praga', 14.43, 50.08, 'city', 7),
    historicTown('vienna', 'Viena', 16.37, 48.21, 'city', 7)
];

const HISTORIC_ROADS = [
    // Via Egnatia & Balkan routes (Stone)
    { from: 'rome', to: 'ravenna', type: 'stone' },
    { from: 'ravenna', to: 'venice', type: 'stone' },
    { from: 'belgrade', to: 'serdica', type: 'stone' },
    { from: 'serdica', to: 'constantinople', type: 'stone' },
    { from: 'constantinople', to: 'thessalonica', type: 'stone' },
    { from: 'thessalonica', to: 'athens', type: 'stone' },
    { from: 'serdica', to: 'thessalonica', type: 'stone' },

    // Anatolian routes (Stone)
    { from: 'constantinople', to: 'nicaea', type: 'stone' },
    { from: 'nicaea', to: 'ancyra', type: 'stone' },
    { from: 'ancyra', to: 'caesarea', type: 'stone' },
    { from: 'caesarea', to: 'antioch', type: 'stone' },
    { from: 'nicaea', to: 'iconium', type: 'stone' },
    { from: 'iconium', to: 'antioch', type: 'stone' },
    { from: 'ancyra', to: 'trebizond', type: 'stone' },

    // Fertile Crescent & Persia (Sand)
    { from: 'antioch', to: 'aleppo', type: 'sand' },
    { from: 'aleppo', to: 'edessa', type: 'sand' },
    { from: 'edessa', to: 'mosul', type: 'sand' },
    { from: 'mosul', to: 'baghdad', type: 'sand' },
    { from: 'baghdad', to: 'ctesiphon', type: 'sand' },
    { from: 'ctesiphon', to: 'isfahan', type: 'sand' },
    { from: 'isfahan', to: 'rayy', type: 'sand' },
    { from: 'rayy', to: 'merv', type: 'sand' },
    { from: 'merv', to: 'samarkand', type: 'sand' },
    { from: 'samarkand', to: 'bukhara', type: 'sand' },

    // Levant & Egypt (Sand)
    { from: 'antioch', to: 'damascus', type: 'sand' },
    { from: 'damascus', to: 'jerusalem', type: 'sand' },
    { from: 'jerusalem', to: 'alexandria', type: 'sand' },
    { from: 'alexandria', to: 'fustat', type: 'sand' },

    // North Africa (Sand)
    { from: 'fustat', to: 'tripoli', type: 'sand' },
    { from: 'tripoli', to: 'carthage', type: 'sand' },
    { from: 'carthage', to: 'cordoba', type: 'sand' },

    // Europe (Dirt)
    { from: 'aachen', to: 'paris', type: 'dirt' },
    { from: 'paris', to: 'massilia', type: 'dirt' },
    { from: 'massilia', to: 'milan', type: 'dirt' },
    { from: 'milan', to: 'venice', type: 'dirt' },
    { from: 'aachen', to: 'vienna', type: 'dirt' },
    { from: 'vienna', to: 'belgrade', type: 'dirt' }
];

const TERRAIN_TYPES = {
    plains: { color: '#C4B896', moveCost: 1, defenseBonus: 0 },
    forest: { color: '#6B8E5F', moveCost: 2, defenseBonus: 0.2 },
    hills: { color: '#A89968', moveCost: 2, defenseBonus: 0.3 },
    mountains: { color: '#8B7355', moveCost: 3, defenseBonus: 0.4 },
    water: { color: '#7BA7C4', moveCost: 999, defenseBonus: 0 },
    city: { color: '#D4AF37', moveCost: 1, defenseBonus: 0.5 }
};

const RESOURCE_NODE_TYPES = {
    food: { color: '#D6C05A', symbol: 'F', baseYield: 2 },
    wood: { color: '#6B8E5F', symbol: 'W', baseYield: 2 },
    stone: { color: '#9B8C7A', symbol: 'S', baseYield: 1 },
    iron: { color: '#7A7A85', symbol: 'I', baseYield: 1 },
    rare: { color: '#8B5FAF', symbol: 'R', baseYield: 1 }
};

const TERRAIN_EFFECTS = {
    plains: {
        moveCostMultiplier: 1,
        attackMultiplier: 1,
        defenseMultiplier: 1,
        canFarm: true,
        canIrrigate: true,
        canPlantForest: true,
        canCanal: true
    },
    forest: {
        moveCostMultiplier: 1,
        attackMultiplier: 0.95,
        defenseMultiplier: 1.15,
        canFarm: false,
        canIrrigate: false,
        canPlantForest: true,
        canCanal: false
    },
    hills: {
        moveCostMultiplier: 1,
        attackMultiplier: 0.95,
        defenseMultiplier: 1.2,
        canFarm: false,
        canIrrigate: false,
        canPlantForest: true,
        canCanal: false
    },
    mountains: {
        moveCostMultiplier: 1,
        attackMultiplier: 0.9,
        defenseMultiplier: 1.3,
        canFarm: false,
        canIrrigate: false,
        canPlantForest: false,
        canCanal: false
    },
    water: {
        moveCostMultiplier: 1,
        attackMultiplier: 1,
        defenseMultiplier: 1,
        canFarm: false,
        canIrrigate: false,
        canPlantForest: false,
        canCanal: false
    },
    city: {
        moveCostMultiplier: 1,
        attackMultiplier: 1,
        defenseMultiplier: 1.25,
        canFarm: true,
        canIrrigate: true,
        canPlantForest: true,
        canCanal: true
    }
};

function deterministicTileNoise(x, y, salt = 0, seed = 0) {
    let h = ((x + 1) * 374761393) ^ ((y + 1) * 668265263) ^ ((salt + 1) * 700001) ^ Math.imul(seed + 1, 2654435761);
    h = Math.imul((h ^ (h >>> 13)), 1274126177);
    h ^= h >>> 16;
    return ((h >>> 0) % 100000) / 100000;
}

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function valueNoise2D(x, y, salt = 0, seed = 0) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const sx = smoothstep(x - x0);
    const sy = smoothstep(y - y0);

    const n00 = deterministicTileNoise(x0, y0, salt, seed);
    const n10 = deterministicTileNoise(x1, y0, salt, seed);
    const n01 = deterministicTileNoise(x0, y1, salt, seed);
    const n11 = deterministicTileNoise(x1, y1, salt, seed);

    const ix0 = lerp(n00, n10, sx);
    const ix1 = lerp(n01, n11, sx);
    return lerp(ix0, ix1, sy);
}

function fractalNoise2D(x, y, options = {}) {
    const scale = Math.max(1, Number(options.scale) || 32);
    const octaves = Math.max(1, Math.floor(options.octaves || 3));
    const persistence = Number.isFinite(options.persistence) ? options.persistence : 0.5;
    const lacunarity = Number.isFinite(options.lacunarity) ? options.lacunarity : 2;
    const salt = Number.isFinite(options.salt) ? options.salt : 0;
    const seed = Number.isFinite(options.seed) ? options.seed : 0;

    let amplitude = 1;
    let frequency = 1;
    let total = 0;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
        const sampleX = (x / scale) * frequency;
        const sampleY = (y / scale) * frequency;
        total += valueNoise2D(sampleX, sampleY, salt + i * 1031, seed) * amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return maxAmplitude > 0 ? total / maxAmplitude : 0;
}

function fallbackHeightToTerrain(height) {
    if (!Number.isFinite(height)) return 'plains';
    if (height <= 39) return 'water';
    if (height <= 52) return 'plains';
    if (height <= 150) return 'plains';
    if (height <= 205) return 'hills';
    return 'mountains';
}

function safeHeightToTerrain(height) {
    if (typeof heightToTerrain === 'function') return heightToTerrain(height);
    return fallbackHeightToTerrain(height);
}

const CITY_WONDERS = {
    constantinople: 'Santa Sofia',
    rome: 'Muralhas Aurelianas',
    baghdad: 'Casa da Sabedoria',
    alexandria: 'Legado da Biblioteca'
};

class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.canvas = null;
        this.ctx = null;

        // Camera/viewport system (pan only, no zoom)
        this.camera = {
            x: 0,
            y: 0
        };

        // Pan state
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        this.panMoved = false;
        this.panDistance = 0;
        this.suppressNextClick = false;
        this.awaitingMoveOrder = false;
        this.lastTouchTap = { x: null, y: null, time: 0 };
        this.pendingTileSelectionTimer = null;
        this.touchGesture = {
            active: false,
            moved: false,
            distance: 0,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            startTile: null
        };

        // Fog of war
        this.fogOfWar = [];
        this.visibilityMap = [];

        this.selectedTile = null;
        this.hoveredTile = null;
        this.territoryControl = [];
        this.territoryControlDirty = true;
        this.referenceMapImage = null;
        this.referenceMapReady = false;
        this.referenceMapCrop = {
            x: 0.08,
            y: 0.06,
            width: 0.84,
            height: 0.86
        };
        this.fogAlphaCache = [];
        this.renderQueued = false;
        this.battleHealthHighlights = new Map();
        this.generationConfig = resolveWorldGenerationConfig();
        this.worldSeed = hashSeedValue(this.generationConfig.seed);

        this.initializeMap();
        this.initializeReferenceMap();
    }

    refreshGenerationConfig() {
        this.generationConfig = resolveWorldGenerationConfig();
        this.worldSeed = hashSeedValue(this.generationConfig.seed);
    }

    getGenerationConfigSnapshot() {
        return JSON.parse(JSON.stringify(this.generationConfig));
    }

    initializeReferenceMap() {
        if (typeof Image === 'undefined') {
            this.referenceMapReady = false;
            return;
        }
        const referenceMapPath = './assets/images/large_map_1.jpg';
        const loadReferenceImage = () => {
            const image = new Image();
            image.onload = () => {
                this.referenceMapImage = image;
                this.referenceMapReady = true;
                this.requestRender();
            };
            image.onerror = () => {
                this.referenceMapReady = false;
            };
            image.src = referenceMapPath;
        };

        if (typeof fetch !== 'function') {
            loadReferenceImage();
            return;
        }

        fetch(referenceMapPath, { method: 'HEAD', cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    this.referenceMapReady = false;
                    return;
                }
                loadReferenceImage();
            })
            .catch(() => {
                this.referenceMapReady = false;
            });
    }

    /**
     * Initialize map with terrain
     */
    initializeMap() {
        this.refreshGenerationConfig();
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = {
                    x,
                    y,
                    terrain: this.generateTerrain(x, y),
                    naturalTerrain: null,
                    unit: null,
                    building: null,
                    fort: null,
                    road: false,
                    owner: null,
                    visible: true,
                    explored: false,
                    baseColor: null,
                    resourceNode: null,
                    biome: null,
                    biomeEventWeights: null
                };
                this.tiles[y][x].naturalTerrain = this.tiles[y][x].terrain;
                this.updateTileBaseColor(this.tiles[y][x]);
            }
        }

        // Place historical towns
        this.placeHistoricalTowns();
        // Place historical main roads
        this.placeHistoricalRoads();
        // Assign deterministic climate biomes after terrain/towns are finalized.
        this.assignBiomes();
        // Place strategic resources after cities/roads so placements avoid city tiles.
        this.placeStrategicResources();
        this.markTerritoryDirty();

        // Ensure Constantinople is correctly set up as default start center if needed
        // but generally initialization should be handled by scenario in state.js
    }

    updateTileBaseColor(tile) {
        if (!tile) return;
        let color = TERRAIN_TYPES[tile.terrain]?.color || '#777';
        const h = (typeof MEDITERRANEAN_HEIGHTMAP !== 'undefined')
            ? MEDITERRANEAN_HEIGHTMAP?.[tile.y]?.[tile.x]
            : undefined;
        if (h !== undefined) {
            const generatedTerrain = safeHeightToTerrain(h);
            if (generatedTerrain === tile.terrain && typeof heightToColor === 'function') {
                color = heightToColor(h);
            }
        }
        tile.baseColor = color;
    }

    /**
     * Generate terrain from detailed geographic heightmap
     */
    generateTerrain(x, y) {
        if (this.generationConfig?.mode === 'procedural') {
            return this.generateProceduralTerrain(x, y);
        }

        // Use the detailed Mediterranean heightmap
        if (typeof MEDITERRANEAN_HEIGHTMAP !== 'undefined' &&
            MEDITERRANEAN_HEIGHTMAP[y] &&
            MEDITERRANEAN_HEIGHTMAP[y][x] !== undefined) {
            return safeHeightToTerrain(MEDITERRANEAN_HEIGHTMAP[y][x]);
        }

        // Fallback to procedural generation when no historic heightmap is available.
        return this.generateProceduralTerrain(x, y);
    }

    generateProceduralTerrain(x, y) {
        const terrainCfg = this.generationConfig?.terrain || WORLD_GENERATION_DEFAULTS.terrain;
        const elevation = fractalNoise2D(x, y, {
            scale: terrainCfg.elevationScale,
            octaves: 4,
            persistence: 0.55,
            salt: 31,
            seed: this.worldSeed
        });
        const ruggedness = fractalNoise2D(x, y, {
            scale: terrainCfg.ruggednessScale,
            octaves: 3,
            persistence: 0.6,
            salt: 97,
            seed: this.worldSeed
        });
        const continental = (elevation * 0.74) + (ruggedness * 0.26);

        if (continental < terrainCfg.seaLevel) return 'water';
        if (continental > terrainCfg.mountainThreshold + ruggedness * 0.06) return 'mountains';
        if (continental > terrainCfg.hillThreshold + ruggedness * 0.03) return 'hills';

        const climate = this.getClimateSample(x, y);
        if (climate.humidity >= terrainCfg.forestMoistureThreshold && climate.temperature > 0.2) {
            return 'forest';
        }
        return 'plains';
    }

    getClimateSample(x, y) {
        const climateCfg = this.generationConfig?.climate || WORLD_GENERATION_DEFAULTS.climate;
        const latNorm = this.height <= 1 ? 0.5 : (y / (this.height - 1)); // south = warmer
        const latTemp = 0.16 + (latNorm * 0.78);
        const tempNoise = fractalNoise2D(x, y, {
            scale: climateCfg.temperatureScale,
            octaves: 3,
            persistence: 0.55,
            salt: 211,
            seed: this.worldSeed
        });
        const humidityNoise = fractalNoise2D(x, y, {
            scale: climateCfg.humidityScale,
            octaves: 3,
            persistence: 0.55,
            salt: 353,
            seed: this.worldSeed
        });
        const temperature = Math.max(0, Math.min(1, (latTemp * 0.72) + (tempNoise * 0.28)));
        const humidity = Math.max(0, Math.min(1, humidityNoise));
        return { temperature, humidity, latNorm };
    }

    getBiomeBaseTerrain(tile) {
        if (!tile) return 'plains';
        if (tile.terrain !== 'city') return tile.terrain;
        if (tile.naturalTerrain && tile.naturalTerrain !== 'city' && tile.naturalTerrain !== 'water') {
            return tile.naturalTerrain;
        }
        const h = (typeof MEDITERRANEAN_HEIGHTMAP !== 'undefined')
            ? MEDITERRANEAN_HEIGHTMAP?.[tile.y]?.[tile.x]
            : undefined;
        if (typeof h === 'number') {
            const naturalTerrain = safeHeightToTerrain(h);
            return naturalTerrain === 'water' ? 'plains' : naturalTerrain;
        }
        return 'plains';
    }

    determineBiomeForTile(tile) {
        if (!tile || tile.terrain === 'water') return null;
        const baseTerrain = this.getBiomeBaseTerrain(tile);
        // Mountains always use the mountains biome; hills can still shift by climate.
        if (baseTerrain === 'mountains') {
            return 'mountains';
        }

        const climateCfg = this.generationConfig?.climate || WORLD_GENERATION_DEFAULTS.climate;
        const climate = this.getClimateSample(tile.x, tile.y);
        let humidity = climate.humidity;
        if (this.isRiverTile(tile.x, tile.y)) humidity = Math.min(1, humidity + 0.15);
        if (this.isCoastalTile(tile.x, tile.y)) humidity = Math.min(1, humidity + 0.08);

        if (climate.temperature <= climateCfg.tundraTemperatureThreshold) return 'tundra';
        if (climate.temperature >= climateCfg.desertWarmthThreshold && humidity <= climateCfg.desertHumidityThreshold) return 'desert';
        if (baseTerrain === 'forest' || humidity >= (this.generationConfig?.terrain?.forestMoistureThreshold || 0.6)) return 'forest';
        return 'plains';
    }

    assignBiomes() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y]?.[x];
                if (!tile) continue;
                const biome = this.determineBiomeForTile(tile);
                tile.biome = biome;
                tile.biomeEventWeights = biome ? { ...(BIOME_RULES[biome]?.eventWeights || {}) } : null;
            }
        }
    }

    getBiomeEffects(tile, unit = null) {
        const biome = tile?.biome;
        if (!biome || !BIOME_RULES[biome]) {
            return {
                biome: biome || null,
                moveCostMultiplier: 1,
                resourceMultipliers: null,
                eventWeights: null
            };
        }

        const base = BIOME_RULES[biome];
        let moveCostMultiplier = base.moveCostMultiplier || 1;
        if (biome === 'desert' && unit?.category === 'desert') moveCostMultiplier *= 0.82;
        if (biome === 'tundra' && unit?.category === 'mountain') moveCostMultiplier *= 0.9;
        if (biome === 'mountains' && unit?.category === 'mountain') moveCostMultiplier *= 0.92;
        // Cavalry is intentionally penalized in forests (higher move cost = slower movement).
        if (biome === 'forest' && unit?.type === 'cavalry') moveCostMultiplier *= 1.06;

        return {
            biome,
            moveCostMultiplier,
            resourceMultipliers: base.resourceMultipliers ? { ...base.resourceMultipliers } : null,
            eventWeights: base.eventWeights ? { ...base.eventWeights } : null
        };
    }

    /**
     * Check if coordinates are in Mediterranean Sea
     */
    isMediterranean(nx, ny) {
        // Western Mediterranean
        if (nx > 0.25 && nx < 0.42 && ny > 0.50 && ny < 0.65) return true;
        // Central Mediterranean (around Italy)
        if (nx > 0.35 && nx < 0.48 && ny > 0.45 && ny < 0.62) return true;
        // Eastern Mediterranean
        if (nx > 0.45 && nx < 0.68 && ny > 0.48 && ny < 0.68) return true;
        // Aegean Sea
        if (nx > 0.48 && nx < 0.58 && ny > 0.42 && ny < 0.52) return true;
        return false;
    }

    /**
     * Check if coordinates are in Black Sea
     */
    isBlackSea(nx, ny) {
        return nx > 0.55 && nx < 0.72 && ny > 0.28 && ny < 0.38;
    }

    /**
     * Check if coordinates are in Caspian Sea
     */
    isCaspianSea(nx, ny) {
        return nx > 0.82 && nx < 0.92 && ny > 0.32 && ny < 0.48;
    }

    /**
     * Place historical towns on the map.
     * @param {Array|null} towns - Override list (e.g. importedTowns from ScenarioLoader); defaults to HISTORIC_TOWNS.
     */
    placeHistoricalTowns(towns = null) {
        const list = towns ?? (typeof HISTORIC_TOWNS !== 'undefined' ? HISTORIC_TOWNS : []);
        list.forEach(town => {
            if (town.y < this.height && town.x < this.width) {
                // Ensure city surroundings are not isolated in open water due to coastline rasterization.
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = town.x + dx;
                        const ny = town.y + dy;
                        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                        const neighbor = this.tiles[ny][nx];
                        if (!neighbor) continue;
                        if (neighbor.terrain === 'water') {
                            neighbor.terrain = Math.abs(dx) + Math.abs(dy) === 2 ? 'hills' : 'plains';
                            neighbor.naturalTerrain = neighbor.terrain;
                            this.updateTileBaseColor(neighbor);
                        }
                    }
                }

                const tile = this.tiles[town.y][town.x];
                tile.naturalTerrain = tile.naturalTerrain || tile.terrain;
                tile.terrain = 'city';
                this.updateTileBaseColor(tile);
                tile.building = town.type === 'capital' ? 'capital' : 'town';
                tile.name = town.name;
                tile.importance = town.importance;
                tile.cityId = town.id;
                tile.cityData = {
                    id: town.id,
                    name: town.name,
                    kind: town.type,
                    capitalRole: null,
                    population: town.type === 'capital' ? 6 : 4,
                    production: {
                        food: town.type === 'capital' ? 5 : 3,
                        industry: town.type === 'capital' ? 4 : 2,
                        gold: town.type === 'capital' ? 5 : 3
                    },
                    infrastructure: {
                        roads: town.type === 'capital' ? 2 : 1,
                        agriculture: town.type === 'capital' ? 2 : 1,
                        industry: town.type === 'capital' ? 2 : 1
                    },
                    autoBuildEnabled: true,
                    wonder: CITY_WONDERS[town.id] || null
                };
                // Don't set owner here, state.js will handle that based on scenario
            }
        });
    }

    getCityTiles(owner = null) {
        const cities = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                if (!tile?.cityData) continue;
                if (owner && tile.owner !== owner) continue;
                cities.push(tile);
            }
        }
        return cities;
    }

    markTerritoryDirty() {
        this.territoryControlDirty = true;
        if (typeof renderCache !== 'undefined') renderCache.clear();
    }

    rebuildTerritoryControl() {
        const control = [];
        const strength = [];
        const citySources = [];
        const nonCitySources = [];
        for (let y = 0; y < this.height; y++) {
            control[y] = [];
            strength[y] = [];
            for (let x = 0; x < this.width; x++) {
                control[y][x] = null;
                strength[y][x] = -1;
                const tile = this.tiles[y][x];
                if (!tile || tile.terrain === 'water' || !tile.owner) continue;
                if (tile.cityData) {
                    citySources.push(tile);
                } else {
                    nonCitySources.push(tile);
                }
            }
        }

        const applyInfluence = (originX, originY, owner, radius, baseStrength) => {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = originX + dx;
                    const y = originY + dy;
                    if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
                    const tile = this.tiles[y][x];
                    if (!tile || tile.terrain === 'water') continue;

                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist > radius) continue;

                    const influence = baseStrength - dist;
                    if (influence > strength[y][x]) {
                        strength[y][x] = influence;
                        control[y][x] = owner;
                    }
                }
            }
        };

        // Cities define the primary area of control.
        citySources.forEach((cityTile) => {
            if (!cityTile.owner) return;
            const radius = cityTile.cityData?.kind === 'capital' ? 7 : 4 + Math.floor((cityTile.importance || 5) / 3);
            const base = cityTile.cityData?.kind === 'capital' ? 10 : 7;
            applyInfluence(cityTile.x, cityTile.y, cityTile.owner, radius, base);
        });

        // Explicitly owned non-city tiles still project minimal control.
        nonCitySources.forEach((tile) => {
            applyInfluence(tile.x, tile.y, tile.owner, 1, 2);
        });

        this.territoryControl = control;
        this.territoryControlDirty = false;
    }

    getTerritoryOwnerAt(x, y) {
        if (this.territoryControlDirty) {
            this.rebuildTerritoryControl();
        }
        return this.territoryControl[y]?.[x] || null;
    }

    /**
     * Initialize canvas and controls
     */
    initializeCanvas(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        // Center camera on Constantinople in the world projection.
        const constantinople = HISTORIC_TOWNS.find(t => t.id === 'constantinople');
        const constantinopleX = constantinople ? constantinople.x : Math.floor(this.width * 0.58);
        const constantinopleY = constantinople ? constantinople.y : Math.floor(this.height * 0.36);
        this.camera.x = (constantinopleX * MAP_CONFIG.tileSize) - (this.canvas.width / 2);
        this.camera.y = (constantinopleY * MAP_CONFIG.tileSize) - (this.canvas.height / 2);

        // Initialize fog of war (all tiles fogged initially)
        this.initializeFogOfWar();

        this.setupControls();

        // Add event listeners
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });
    }

    /**
     * Initialize fog of war
     */
    initializeFogOfWar() {
        this.fogOfWar = [];
        this.visibilityMap = [];
        this.fogAlphaCache = [];
        for (let y = 0; y < this.height; y++) {
            this.fogOfWar[y] = [];
            this.visibilityMap[y] = [];
            this.fogAlphaCache[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Start with everything fogged
                this.fogOfWar[y][x] = true;
                this.visibilityMap[y][x] = false;
                this.fogAlphaCache[y][x] = -1;
            }
        }
    }

    /**
     * Reveal area around a position (for units/cities)
     */
    revealArea(x, y, radius = 3, options = {}) {
        const markVisible = options?.markVisible !== false;
        const newlyExplored = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= radius) {
                        if (markVisible && this.visibilityMap[ny]) {
                            this.visibilityMap[ny][nx] = true;
                        }
                        if (this.fogOfWar[ny][nx]) {
                            this.fogOfWar[ny][nx] = false;
                            newlyExplored.push({ x: nx, y: ny });
                        }
                        for (let cdy = -1; cdy <= 1; cdy++) {
                            for (let cdx = -1; cdx <= 1; cdx++) {
                                const cx = nx + cdx;
                                const cy = ny + cdy;
                                if (cx < 0 || cx >= this.width || cy < 0 || cy >= this.height) continue;
                                this.fogAlphaCache[cy][cx] = -1;
                            }
                        }
                    }
                }
            }
        }
        return newlyExplored;
    }

    clearVisibilityMap() {
        for (let y = 0; y < this.height; y++) {
            const row = this.visibilityMap[y];
            if (!row) continue;
            row.fill(false);
        }
    }

    getUnitVisionRadius(unit) {
        if (!unit) return 2;
        const bonusVision = Number.isFinite(unit.bonuses?.vision) ? Math.floor(unit.bonuses.vision) : 0;
        let radius = 2 + bonusVision;
        if (unit.category === 'scout' || unit.category === 'intel') radius += 1;
        if (unit.type === 'naval') radius += 1;
        return Math.max(1, Math.min(7, radius));
    }

    getCityVisionRadius(cityTile) {
        if (!cityTile?.cityData) return 3;
        let radius = cityTile.cityData.kind === 'capital' ? 5 : 4;
        const wallsLevel = Number(cityTile.cityData.buildings?.walls || 0);
        if (wallsLevel >= 2) radius += 1;
        return Math.max(3, Math.min(7, radius));
    }

    recalculatePlayerVision(state) {
        if (!state) return [];
        this.clearVisibilityMap();
        const newlyExplored = [];

        const playerCities = this.getCityTiles('player') || [];
        playerCities.forEach((tile) => {
            const radius = this.getCityVisionRadius(tile);
            const discovered = this.revealArea(tile.x, tile.y, radius, { markVisible: true });
            if (discovered.length > 0) newlyExplored.push(...discovered);
        });

        const playerUnits = (state.units || []).filter((unit) =>
            unit?.owner === 'player'
            && !unit.isCarried
            && Number.isFinite(unit.position?.x)
            && Number.isFinite(unit.position?.y)
        );
        playerUnits.forEach((unit) => {
            const radius = this.getUnitVisionRadius(unit);
            const discovered = this.revealArea(unit.position.x, unit.position.y, radius, { markVisible: true });
            if (discovered.length > 0) newlyExplored.push(...discovered);
        });

        return newlyExplored;
    }

    /**
     * Check if tile is fogged
     */
    isFoggedTile(x, y) {
        if (!this.fogOfWar[y] || this.fogOfWar[y][x] === undefined) return false;
        return this.fogOfWar[y][x];
    }

    isTileVisible(x, y) {
        if (!this.visibilityMap[y] || this.visibilityMap[y][x] === undefined) return false;
        return this.visibilityMap[y][x];
    }

    /**
     * Fog alpha for a tile with softened explored/unexplored edges.
     */
    getFogAlpha(x, y) {
        if (!this.isFoggedTile(x, y)) {
            return 0;
        }
        const cached = this.fogAlphaCache?.[y]?.[x];
        if (typeof cached === 'number' && cached >= 0) return cached;

        let exploredNeighbors = 0;
        let totalNeighbors = 0;

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                totalNeighbors++;
                if (!this.isFoggedTile(nx, ny)) exploredNeighbors++;
            }
        }

        const edgeFactor = totalNeighbors > 0 ? exploredNeighbors / totalNeighbors : 0;
        // Keep terrain readable but make unexplored areas clearly grayed-out.
        const alpha = 0.36 + (1 - edgeFactor) * 0.22;
        if (this.fogAlphaCache?.[y]) {
            this.fogAlphaCache[y][x] = alpha;
        }
        return alpha;
    }

    /**
     * Draw major river overlays on visible region.
     * Major rivers (Nile, Danube, Euphrates, Tigris, Volga) render wider.
     * Minor rivers render thin. Bridges drawn when road infrastructure is present.
     */
    drawRivers(startX, startY, endX, endY, tileSize) {
        if (typeof MEDITERRANEAN_HEIGHTMAP === 'undefined') return;
        if (typeof getRiverWidthClass !== 'function') return;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const height = MEDITERRANEAN_HEIGHTMAP[y]?.[x];
                if (height === undefined || height > 50 || height < 40) continue;
                if (this.isFoggedTile(x, y)) continue;

                const geo = this.tileToGeo(x, y);
                const widthClass = getRiverWidthClass(geo.lon, geo.lat);
                if (!widthClass) continue;

                const px = x * tileSize;
                const py = y * tileSize;
                const isMajor = widthClass === 'major';

                // River stroke
                this.ctx.strokeStyle = isMajor
                    ? 'rgba(75, 155, 215, 0.75)'
                    : 'rgba(95, 175, 230, 0.65)';
                this.ctx.lineWidth = isMajor
                    ? Math.max(2, tileSize * 0.38)
                    : Math.max(1, tileSize * 0.18);
                this.ctx.beginPath();
                this.ctx.moveTo(px + tileSize * 0.1, py + tileSize * 0.5);
                this.ctx.lineTo(px + tileSize * 0.9, py + tileSize * 0.5);
                this.ctx.stroke();

                // Bridge overlay: draw when a road tile crosses any river.
                // Road tiles store type in tile.road; cityData.infrastructure.roads is city-only.
                const tile = this.tiles[y]?.[x];
                if (tile?.road) {
                    this.ctx.strokeStyle = 'rgba(140, 120, 90, 0.9)';
                    this.ctx.lineWidth = Math.max(2, tileSize * 0.14);
                    this.ctx.beginPath();
                    this.ctx.moveTo(px + tileSize * 0.5, py + tileSize * 0.15);
                    this.ctx.lineTo(px + tileSize * 0.5, py + tileSize * 0.85);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawCityInfrastructure(tile, tileSize) {
        if (!tile?.cityData?.infrastructure) return;

        const { roads, agriculture, industry } = tile.cityData.infrastructure;
        const cx = tile.x * tileSize + tileSize / 2;
        const cy = tile.y * tileSize + tileSize / 2;

        if (roads > 0) {
            const isRomanCity = tile.cityData?.kind === 'capital' || (tile.importance || 0) >= 8;
            this.ctx.strokeStyle = isRomanCity ? 'rgba(120, 125, 130, 0.8)' : 'rgba(180, 150, 95, 0.7)';
            this.ctx.lineWidth = Math.max(1, tileSize * 0.08);
            this.ctx.beginPath();
            this.ctx.moveTo(cx - tileSize * 0.5, cy);
            this.ctx.lineTo(cx + tileSize * 0.5, cy);
            this.ctx.moveTo(cx, cy - tileSize * 0.5);
            this.ctx.lineTo(cx, cy + tileSize * 0.5);
            this.ctx.stroke();
        }

        if (agriculture > 0) {
            // Agriculture: green field stripes.
            this.ctx.strokeStyle = 'rgba(160, 205, 120, 0.9)';
            this.ctx.lineWidth = Math.max(1, tileSize * 0.05);
            for (let i = -1; i <= 1; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(cx - tileSize * 0.22, cy + tileSize * (0.2 + i * 0.06));
                this.ctx.lineTo(cx + tileSize * 0.22, cy + tileSize * (0.2 + i * 0.06));
                this.ctx.stroke();
            }
        }

        if (industry > 0) {
            // Industry: compact forge icon.
            const size = tileSize * 0.16;
            this.ctx.fillStyle = 'rgba(176, 183, 194, 0.95)';
            this.ctx.fillRect(cx - size, cy - size * 0.9, size * 2, size * 1.5);
            this.ctx.fillStyle = 'rgba(130, 137, 150, 0.95)';
            this.ctx.fillRect(cx + size * 0.4, cy - size * 1.4, size * 0.6, size * 0.7);
            this.ctx.fillStyle = 'rgba(236, 186, 95, 0.95)';
            this.ctx.fillRect(cx - size * 0.3, cy - size * 0.3, size * 0.6, size * 0.5);
        }

        // Show surrounding economy around the city.
        const neighborOffsets = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: -1 }, { x: 1, y: 1 }
        ];

        neighborOffsets.forEach((offset, index) => {
            const nx = tile.x + offset.x;
            const ny = tile.y + offset.y;
            if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) return;
            if (this.isFoggedTile(nx, ny)) return;

            const nTile = this.tiles[ny][nx];
            if (!nTile || nTile.terrain === 'water') return;

            const npx = nx * tileSize + tileSize / 2;
            const npy = ny * tileSize + tileSize / 2;

            if (roads > 1) {
                const isRomanCity = tile.cityData?.kind === 'capital' || (tile.importance || 0) >= 8;
                this.ctx.strokeStyle = isRomanCity ? 'rgba(120, 125, 130, 0.5)' : 'rgba(190, 160, 100, 0.5)';
                this.ctx.lineWidth = Math.max(1, tileSize * 0.06);
                this.ctx.beginPath();
                this.ctx.moveTo(cx, cy);
                this.ctx.lineTo(npx, npy);
                this.ctx.stroke();
            }

            if (agriculture > 1 && index % 2 === 0) {
                this.ctx.fillStyle = 'rgba(168, 215, 132, 0.85)';
                this.ctx.beginPath();
                this.ctx.arc(npx, npy, Math.max(2, tileSize * 0.09), 0, Math.PI * 2);
                this.ctx.fill();
            } else if (industry > 1 && index % 2 === 1) {
                const s = Math.max(2, tileSize * 0.14);
                this.ctx.fillStyle = 'rgba(180, 186, 196, 0.85)';
                this.ctx.fillRect(npx - s / 2, npy - s / 2, s, s);
            }
        });
    }

    drawCityLabels(startX, startY, endX, endY, tileSize) {
        const detailedLimit = 10;
        let detailedCount = 0;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                if (!tile?.cityData) continue;
                if (this.isFoggedTile(x, y) && tile.owner !== 'player') continue;

                const px = x * tileSize + tileSize / 2;
                const py = y * tileSize;
                const isEnemy = tile.owner === 'enemy';
                const isNeutral = tile.owner === 'neutral';
                const cityColor = isEnemy ? '#ff9f9f' : (isNeutral ? '#9cd3b0' : '#f4d03f');

                const shouldDrawDetailed = tile.owner === 'player'
                    || (this.selectedTile && this.selectedTile.x === x && this.selectedTile.y === y)
                    || detailedCount < detailedLimit;
                if (shouldDrawDetailed) {
                    this.drawCityInfrastructure(tile, tileSize);
                    detailedCount++;
                }

                // City name
                this.ctx.font = `${Math.max(10, Math.floor(tileSize * 0.34))}px "Old Standard TT", serif`;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                this.ctx.fillText(tile.cityData.name, px + 1, py - 6 + 1);
                this.ctx.fillStyle = cityColor;
                this.ctx.fillText(tile.cityData.name, px, py - 6);

                // Production line
                if (shouldDrawDetailed) {
                    const p = tile.cityData.production;
                    const prodText = `F${p.food} I${p.industry} G${p.gold}`;
                    this.ctx.font = `${Math.max(9, Math.floor(tileSize * 0.28))}px "Crimson Text", serif`;
                    this.ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
                    this.ctx.fillText(prodText, px + 1, py + tileSize + 11);
                    this.ctx.fillStyle = 'rgba(230, 235, 240, 0.92)';
                    this.ctx.fillText(prodText, px, py + tileSize + 10);
                }

                // Wonder marker
                if (shouldDrawDetailed && tile.cityData.wonder) {
                    this.ctx.font = `${Math.max(9, Math.floor(tileSize * 0.26))}px "Crimson Text", serif`;
                    this.ctx.fillStyle = 'rgba(255, 220, 130, 0.95)';
                    this.ctx.fillText(`${tile.cityData.wonder}`, px, py - 20);
                    this.ctx.strokeStyle = 'rgba(255, 220, 130, 0.95)';
                    this.ctx.lineWidth = Math.max(1, tileSize * 0.06);
                    this.ctx.beginPath();
                    this.ctx.moveTo(px, py - 28);
                    this.ctx.lineTo(px + 4, py - 24);
                    this.ctx.lineTo(px, py - 20);
                    this.ctx.lineTo(px - 4, py - 24);
                    this.ctx.closePath();
                    this.ctx.stroke();
                }
            }
        }
    }

    /**
     * Render the map with pan support and fog of war
     */
    render() {
        if (!this.ctx) return;
        
        // Performance monitoring
        const frameTimer = typeof perfMonitor !== 'undefined' ? perfMonitor.startTimer('frame') : null;
        const renderTimer = typeof perfMonitor !== 'undefined' ? perfMonitor.startTimer('render') : null;
        
        if (this.territoryControlDirty) {
            const territoryTimer = typeof perfMonitor !== 'undefined' ? perfMonitor.startTimer('territory_rebuild') : null;
            this.rebuildTerritoryControl();
            if (territoryTimer && typeof perfMonitor !== 'undefined') perfMonitor.endTimer(territoryTimer);
        }

        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context state
        this.ctx.save();

        // Apply camera transformation (pan only)
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Calculate visible tile range with small buffer for smooth panning
        const tileSize = MAP_CONFIG.tileSize;
        const buffer = 2; // Extra tiles to render beyond viewport
        const startX = Math.max(0, Math.floor(this.camera.x / tileSize) - buffer);
        const startY = Math.max(0, Math.floor(this.camera.y / tileSize) - buffer);
        const endX = Math.min(this.width, Math.ceil((this.camera.x + this.canvas.width) / tileSize) + 1 + buffer);
        const endY = Math.min(this.height, Math.ceil((this.camera.y + this.canvas.height) / tileSize) + 1 + buffer);

        if (this.referenceMapReady && this.referenceMapImage) {
            const crop = this.referenceMapCrop;
            const sx = this.referenceMapImage.width * crop.x;
            const sy = this.referenceMapImage.height * crop.y;
            const sw = this.referenceMapImage.width * crop.width;
            const sh = this.referenceMapImage.height * crop.height;
            this.ctx.globalAlpha = 0.5;
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(
                this.referenceMapImage,
                sx,
                sy,
                sw,
                sh,
                0,
                0,
                this.width * tileSize,
                this.height * tileSize
            );
            this.ctx.globalAlpha = 1;
        }

        const terrainTimer = typeof perfMonitor !== 'undefined' ? perfMonitor.startTimer('terrain_render') : null;
        
        // Pass 1: terrain, grid, territory, buildings
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                if (!tile) continue;
                const isFogged = this.isFoggedTile(x, y);
                const px = x * tileSize;
                const py = y * tileSize;
                const terrainColor = tile.baseColor || TERRAIN_TYPES[tile.terrain].color;

                // Draw terrain
                this.ctx.fillStyle = terrainColor;
                this.ctx.fillRect(px, py, tileSize, tileSize);

                // Draw subtle grid only on explored tiles to avoid "square earth" look in fog.
                if (!isFogged) {
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(px, py, tileSize, tileSize);
                }

                // Draw territory control overlay (cache result to avoid repeated lookup per frame).
                if (!isFogged && tile.terrain !== 'water') {
                    const cacheKey = `to:${x},${y}`;
                    let controlOwner = typeof renderCache !== 'undefined' ? renderCache.get(cacheKey) : null;
                    if (controlOwner === null) {
                        controlOwner = tile.owner || this.getTerritoryOwnerAt(x, y) || '';
                        if (typeof renderCache !== 'undefined') renderCache.set(cacheKey, controlOwner);
                    }
                    if (controlOwner) {
                        if (controlOwner === 'player') {
                            this.ctx.fillStyle = 'rgba(107, 44, 145, 0.28)';
                        } else if (controlOwner === 'enemy') {
                            this.ctx.fillStyle = 'rgba(139, 0, 0, 0.28)';
                        } else {
                            this.ctx.fillStyle = 'rgba(56, 114, 84, 0.24)';
                        }
                        this.ctx.fillRect(px, py, tileSize, tileSize);
                    }
                }

                // Draw city/building icons
                if (!isFogged && tile.building) {
                    const cx = px + tileSize / 2;
                    const cy = py + tileSize / 2;
                    const size = tileSize * 0.22;
                    this.ctx.strokeStyle = '#d9be6a';
                    this.ctx.fillStyle = 'rgba(212, 175, 55, 0.45)';
                    this.ctx.lineWidth = Math.max(1, tileSize * 0.08);
                    if (tile.building === 'capital') {
                        this.ctx.beginPath();
                        this.ctx.moveTo(cx, cy - size);
                        this.ctx.lineTo(cx + size * 0.85, cy - size * 0.2);
                        this.ctx.lineTo(cx + size * 0.65, cy + size);
                        this.ctx.lineTo(cx - size * 0.65, cy + size);
                        this.ctx.lineTo(cx - size * 0.85, cy - size * 0.2);
                        this.ctx.closePath();
                        this.ctx.fill();
                        this.ctx.stroke();
                    } else {
                        this.ctx.fillRect(cx - size, cy - size * 0.8, size * 2, size * 1.6);
                        this.ctx.strokeRect(cx - size, cy - size * 0.8, size * 2, size * 1.6);
                    }
                }
            }
        }

        // Pass 2: forts, roads, resources rendered in a separate overlay pass before fog.
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                if (!tile || tile.terrain === 'water') continue;
                if (this.isFoggedTile(x, y)) continue;
                const px = x * tileSize;
                const py = y * tileSize;

                if (tile.fort) {
                    const cx = px + tileSize / 2;
                    const cy = py + tileSize / 2;
                    const size = tileSize * 0.25;
                    this.ctx.fillStyle = tile.fort.owner === 'player'
                        ? 'rgba(107, 44, 145, 0.8)'
                        : 'rgba(139, 0, 0, 0.8)';
                    this.ctx.strokeStyle = '#d9be6a';
                    this.ctx.lineWidth = Math.max(1, tileSize * 0.07);
                    this.ctx.beginPath();
                    this.ctx.moveTo(cx, cy - size);
                    this.ctx.lineTo(cx + size * 0.9, cy - size * 0.15);
                    this.ctx.lineTo(cx + size * 0.7, cy + size);
                    this.ctx.lineTo(cx - size * 0.7, cy + size);
                    this.ctx.lineTo(cx - size * 0.9, cy - size * 0.15);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                }

                if (tile.road) {
                    this.drawRoad(tile, px, py, tileSize);
                }
                if (tile.resourceNode) {
                    this.drawResourceNode(tile, px, py, tileSize);
                }
            }
        }

        // Pass 3: fog/shroud on top of all tile content
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                if (!tile) continue;
                const tileVisible = this.isTileVisible(x, y);
                if (!tileVisible) {
                    const px = x * tileSize;
                    const py = y * tileSize;
                    const isFogged = this.isFoggedTile(x, y);
                    if (isFogged) {
                        const fogAlpha = this.getFogAlpha(x, y);
                        if (fogAlpha > 0) {
                            this.ctx.fillStyle = `rgba(122, 126, 136, ${fogAlpha})`;
                            this.ctx.fillRect(px, py, tileSize, tileSize);
                        }
                    } else {
                        // Explored-but-not-currently-visible shroud.
                        this.ctx.fillStyle = 'rgba(88, 92, 102, 0.14)';
                        this.ctx.fillRect(px, py, tileSize, tileSize);
                    }
                }
            }
        }

        if (terrainTimer && typeof perfMonitor !== 'undefined') perfMonitor.endTimer(terrainTimer);

        // Draw river overlays after terrain and fog pass.
        this.drawRivers(startX, startY, endX, endY, tileSize);

        const unitsTimer = typeof perfMonitor !== 'undefined' ? perfMonitor.startTimer('units_render') : null;
        
        // Draw units (only visible ones) - optimized with spatial filtering
        if (gameState && gameState.units) {
            for (const unit of gameState.units) {
                if (
                    unit.position.x >= startX && unit.position.x < endX &&
                    unit.position.y >= startY && unit.position.y < endY &&
                    (unit.owner === 'player' || this.isTileVisible(unit.position.x, unit.position.y))
                ) {
                    this.drawUnit(unit);
                }
            }
        }
        
        if (unitsTimer && typeof perfMonitor !== 'undefined') perfMonitor.endTimer(unitsTimer);

        // Draw city labels/production/wonders after units for readability.
        this.drawCityLabels(startX, startY, endX, endY, tileSize);

        // Draw selection
        if (this.selectedTile) {
            this.renderSelection(this.selectedTile.x, this.selectedTile.y);
        }

        // Draw hover
        if (this.hoveredTile) {
            this.renderHover(this.hoveredTile.x, this.hoveredTile.y);
        }

        // Restore context
        this.ctx.restore();

        // Draw UI overlay
        this.drawUI();
        
        if (renderTimer && typeof perfMonitor !== 'undefined') perfMonitor.endTimer(renderTimer);
        if (frameTimer && typeof perfMonitor !== 'undefined') {
            const frameDuration = perfMonitor.endTimer(frameTimer);
            if (typeof frameDuration === 'number') {
                perfMonitor.recordFrame(frameDuration);
            }
        }
    }

    requestRender() {
        if (this.renderQueued) return;
        this.renderQueued = true;
        requestAnimationFrame(() => {
            this.renderQueued = false;
            const territoryDirtyBefore = this.territoryControlDirty;
            this.render();
            if (typeof minimap !== 'undefined' && minimap) {
                if (territoryDirtyBefore) minimap.render();
                else minimap.updateViewport();
            }
        });
    }

    drawResourceNode(tile, px, py, tileSize) {
        const node = tile?.resourceNode;
        if (!node) return;
        const def = RESOURCE_NODE_TYPES[node.type];
        if (!def) return;

        const cx = px + tileSize * 0.78;
        const cy = py + tileSize * 0.24;
        const radius = Math.max(2, tileSize * 0.13);
        this.ctx.fillStyle = 'rgba(18, 18, 18, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = def.color;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (tileSize >= 16) {
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.font = `bold ${Math.max(8, Math.floor(tileSize * 0.28))}px serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(def.symbol, cx, cy + 0.5);
        }
    }

    setBattleHealthHighlights(unitIds = [], durationMs = 3000) {
        const now = Date.now();
        const expiresAt = now + Math.max(300, durationMs);
        unitIds.forEach((unitId) => {
            if (!unitId) return;
            this.battleHealthHighlights.set(unitId, expiresAt);
        });
        this.requestRender();
    }

    shouldRenderBattleHealth(unit) {
        if (!unit) return false;
        if (unit.currentHealth >= unit.stats.health) return false;
        const expiresAt = this.battleHealthHighlights.get(unit.id);
        if (!expiresAt) return false;
        if (Date.now() > expiresAt) {
            this.battleHealthHighlights.delete(unit.id);
            return false;
        }
        return true;
    }

    focusOnBattleUnits(attacker, defender) {
        if (!this.canvas) return;
        const units = [attacker, defender].filter(Boolean);
        if (units.length === 0) return;
        const avgX = units.reduce((sum, unit) => sum + unit.position.x, 0) / units.length;
        const avgY = units.reduce((sum, unit) => sum + unit.position.y, 0) / units.length;
        this.centerOn(avgX, avgY);
    }

    centerOn(tileX, tileY) {
        if (!this.canvas) return;
        const tx = Number.isFinite(tileX) ? tileX : 0;
        const ty = Number.isFinite(tileY) ? tileY : 0;
        this.camera.x = Math.floor((tx * MAP_CONFIG.tileSize) - (this.canvas.width / 2));
        this.camera.y = Math.floor((ty * MAP_CONFIG.tileSize) - (this.canvas.height / 2));
        const maxX = Math.max(0, (this.width * MAP_CONFIG.tileSize) - this.canvas.width);
        const maxY = Math.max(0, (this.height * MAP_CONFIG.tileSize) - this.canvas.height);
        this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
        this.requestRender();
    }

    /**
     * Setup pan controls (no zoom)
     */
    setupControls() {
        // Pan with mouse drag
        this.canvas.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.panMoved = false;
            this.panDistance = 0;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                const dx = e.clientX - this.lastPanX;
                const dy = e.clientY - this.lastPanY;

                this.camera.x -= dx;
                this.camera.y -= dy;
                this.panDistance += Math.sqrt((dx * dx) + (dy * dy));
                if (this.panDistance >= 4) {
                    this.panMoved = true;
                }

                // Clamp camera to map bounds
                const maxX = (this.width * MAP_CONFIG.tileSize) - this.canvas.width;
                const maxY = (this.height * MAP_CONFIG.tileSize) - this.canvas.height;
                this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
                this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));

                this.lastPanX = e.clientX;
                this.lastPanY = e.clientY;

                this.requestRender();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.isPanning && this.panMoved) {
                // Ignore only the drag-release click; keep move mode armed for the next intentional click.
                this.suppressNextClick = true;
            }
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Draw road with type-specific color and neighbor connections
     */
    drawRoad(tile, px, py, tileSize) {
        if (!tile.road || tile.terrain === 'water') return;

        const cx = px + tileSize / 2;
        const cy = py + tileSize / 2;

        let roadColor = 'rgba(190, 160, 95, 0.8)'; // Default dirt-yellow
        let lineWidth = Math.max(1, tileSize * 0.12);

        if (tile.road === 'stone') {
            roadColor = 'rgba(120, 125, 130, 0.9)'; // Gray stone for Roman roads
            lineWidth = Math.max(1.5, tileSize * 0.16);
        } else if (tile.road === 'dirt') {
            roadColor = 'rgba(130, 95, 65, 0.85)'; // Deep brown for dirt roads
            lineWidth = Math.max(1, tileSize * 0.10);
        } else if (tile.road === 'sand') {
            roadColor = 'rgba(230, 200, 150, 0.75)'; // Light sandy/silk road
            lineWidth = Math.max(1, tileSize * 0.12);
        }

        this.ctx.strokeStyle = roadColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Check 4-way neighbors to draw connections
        const neighbors = [
            { dx: 0, dy: -1 }, // North
            { dx: 1, dy: 0 },  // East
            { dx: 0, dy: 1 },  // South
            { dx: -1, dy: 0 }  // West
        ];

        let hasConnection = false;
        neighbors.forEach(offset => {
            const nx = tile.x + offset.dx;
            const ny = tile.y + offset.dy;
            const neighbor = this.getTile(nx, ny);

            if (neighbor && neighbor.road) {
                this.ctx.beginPath();
                this.ctx.moveTo(cx, cy);
                this.ctx.lineTo(cx + offset.dx * tileSize / 2, cy + offset.dy * tileSize / 2);
                this.ctx.stroke();
                hasConnection = true;
            }
        });

        // For stone roads, add some texture/width at the center
        if (tile.road === 'stone') {
            this.ctx.fillStyle = roadColor;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, lineWidth * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Draw UI overlay
     */
    drawUI() {
        // Map coordinates display
        const centerX = Math.floor((this.camera.x + this.canvas.width / 2) / MAP_CONFIG.tileSize);
        const centerY = Math.floor((this.camera.y + this.canvas.height / 2) / MAP_CONFIG.tileSize);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 30);
        this.ctx.fillStyle = '#D4AF37';
        this.ctx.font = '14px Crimson Text';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Posição: ${centerX}, ${centerY}`, 20, 30);

        // Territory legend for quick readability.
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
        this.ctx.fillRect(10, 45, 248, 24);

        this.ctx.fillStyle = 'rgba(107, 44, 145, 0.9)';
        this.ctx.fillRect(18, 53, 12, 10);
        this.ctx.fillStyle = '#f3df95';
        this.ctx.fillText('Jogador', 34, 62);

        this.ctx.fillStyle = 'rgba(139, 0, 0, 0.9)';
        this.ctx.fillRect(94, 53, 12, 10);
        this.ctx.fillStyle = '#f3df95';
        this.ctx.fillText('Hostil', 110, 62);

        this.ctx.fillStyle = 'rgba(56, 114, 84, 0.9)';
        this.ctx.fillRect(182, 53, 12, 10);
        this.ctx.fillStyle = '#f3df95';
        this.ctx.fillText('Neutro', 198, 62);

        const selected = gameState?.selectedUnit;
        if (selected?.owner === 'player') {
            const moveArmed = Boolean(this.awaitingMoveOrder);
            const panelWidth = Math.min(500, Math.max(280, this.canvas.width - 320));
            this.ctx.fillStyle = 'rgba(8, 11, 18, 0.72)';
            this.ctx.fillRect(10, 74, panelWidth, 28);
            this.ctx.fillStyle = moveArmed ? '#67f2ff' : '#f3df95';
            this.ctx.fillText(
                `${selected.name} | Movimento: ${moveArmed ? 'ON' : 'OFF'} | Duplo clique/toque na unidade para alternar`,
                20,
                93
            );
        }
    }

    /**
     * Draw a unit
     */
    drawUnit(unit) {
        const tileSize = MAP_CONFIG.tileSize;
        const px = unit.position.x * tileSize;
        const py = unit.position.y * tileSize;
        const cx = px + tileSize / 2;
        const cy = py + tileSize / 2;
        if (this.shouldRenderBattleHealth(unit)) {
            const healthRatio = Math.max(0, Math.min(1, unit.currentHealth / Math.max(1, unit.stats.health)));
            const healthColor = this.getUnitHealthColor(healthRatio);
            // Battle-only health ring overlay.
            this.ctx.strokeStyle = healthColor;
            this.ctx.lineWidth = Math.max(1, tileSize * 0.06);
            this.ctx.beginPath();
            this.ctx.arc(
                cx,
                cy,
                tileSize * 0.44,
                0,
                Math.PI * 2
            );
            this.ctx.stroke();
        }

        const unitType = getUnitById(unit.typeId);
        const size = tileSize * 0.4;

        this.ctx.save();

        // Shadow for depth
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowOffsetY = 2;

        // Draw shape based on type
        this.ctx.beginPath();
        if (unit.type === 'infantry') {
            // Shield-like rounded bottom
            this.ctx.moveTo(cx - size, cy - size * 0.8);
            this.ctx.lineTo(cx + size, cy - size * 0.8);
            this.ctx.lineTo(cx + size, cy + size * 0.2);
            this.ctx.quadraticCurveTo(cx + size, cy + size, cx, cy + size);
            this.ctx.quadraticCurveTo(cx - size, cy + size, cx - size, cy + size * 0.2);
            this.ctx.closePath();
        } else if (unit.type === 'cavalry') {
            // Circular badge
            this.ctx.arc(cx, cy, size, 0, Math.PI * 2);
        } else if (unit.type === 'naval') {
            // Boat hull shape
            this.ctx.moveTo(cx - size, cy - size * 0.3);
            this.ctx.lineTo(cx + size, cy - size * 0.3);
            this.ctx.lineTo(cx + size * 0.7, cy + size * 0.8);
            this.ctx.lineTo(cx - size * 0.7, cy + size * 0.8);
            this.ctx.closePath();
        } else {
            // Hexagon for special/others
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3 - Math.PI / 2;
                this.ctx.lineTo(cx + size * Math.cos(angle), cy + size * Math.sin(angle));
            }
            this.ctx.closePath();
        }

        const gradient = this.ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
        if (unit.owner === 'player') {
            gradient.addColorStop(0, '#9B59B6');
            gradient.addColorStop(1, '#6C3483');
        } else {
            gradient.addColorStop(0, '#E74C3C');
            gradient.addColorStop(1, '#943126');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;

        // Border based on category
        let borderColor = '#D4AF37';
        let lineWidth = 1.5;
        if (unit.category === 'elite') {
            lineWidth = 3;
            borderColor = '#FFFDE7';
        } else if (unit.category === 'heavy' || unit.category === 'superheavy') {
            lineWidth = 2.5;
            borderColor = '#F1C40F';
        }

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();

        // Icon/Symbol
        this.ctx.fillStyle = '#FFFFFF';
        // Adjust font size for combined symbols like '🏇🏹'
        const symbol = unit.symbol || unitType?.symbol || '⚔️';
        const fontSize = Math.floor(tileSize * (symbol.length > 2 ? 0.3 : 0.45));
        this.ctx.font = `bold ${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.fillText(symbol, cx, cy);

        const isSelected = gameState?.selectedUnit?.id === unit.id;
        if (isSelected) {
            const moveArmed = Boolean(this.awaitingMoveOrder);
            this.ctx.strokeStyle = moveArmed ? '#67f2ff' : '#F4D03F';
            this.ctx.lineWidth = Math.max(2, tileSize * 0.12);
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, tileSize * 0.48, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    getUnitHealthColor(ratio) {
        const clamped = Math.max(0, Math.min(1, ratio));
        const red = Math.floor(230 * (1 - clamped));
        const green = Math.floor(220 * clamped);
        return `rgb(${red}, ${green}, 40)`;
    }

    /**
     * Render a unit on the map (legacy method)
     */
    renderUnit(unit) {
        this.drawUnit(unit);
    }

    /**
     * Render selection highlight
 */
    renderSelection(x, y) {
        const px = x * MAP_CONFIG.tileSize;
        const py = y * MAP_CONFIG.tileSize;

        this.ctx.strokeStyle = '#F4D03F';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(px + 2, py + 2, MAP_CONFIG.tileSize - 4, MAP_CONFIG.tileSize - 4);
    }

    /**
     * Render hover highlight
     */
    renderHover(x, y) {
        const px = x * MAP_CONFIG.tileSize;
        const py = y * MAP_CONFIG.tileSize;

        this.ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
        this.ctx.fillRect(px, py, MAP_CONFIG.tileSize, MAP_CONFIG.tileSize);
    }

    /**
     * Handle click event
     */
    handleClick(event) {
        if (this.suppressNextClick) {
            this.suppressNextClick = false;
            return;
        }
        const tile = this.screenToTile(event.clientX, event.clientY);
        if (!tile) return;

        const unit = this.getSelectableUnitAt(tile.x, tile.y);
        const selectedUnitId = gameState?.selectedUnit?.id || null;
        const clickedSelectedPlayerUnit = Boolean(
            unit
            && unit.owner === 'player'
            && selectedUnitId === unit.id
            && this.awaitingMoveOrder
        );

        if (event.detail === 1 && clickedSelectedPlayerUnit) {
            this.scheduleTileSelection(tile, 260);
            return;
        }

        this.clearPendingTileSelection();
        this.selectTile(tile.x, tile.y);
    }

    handleDoubleClick(event) {
        if (this.suppressNextClick) {
            this.suppressNextClick = false;
            return;
        }
        this.clearPendingTileSelection();
        const tile = this.screenToTile(event.clientX, event.clientY);
        if (!tile) return;
        const unit = gameState.units.find((u) =>
            u.owner === 'player'
            && !u.isCarried
            && u.position?.x === tile.x
            && u.position?.y === tile.y
        );
        if (!unit) return;
        this.toggleMoveModeForUnit(unit, { activationHint: 'Clique no tile de destino para mover.' });
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(event) {
        const tile = this.screenToTile(event.clientX, event.clientY);
        if (tile) {
            if (!this.hoveredTile || this.hoveredTile.x !== tile.x || this.hoveredTile.y !== tile.y) {
                this.hoveredTile = tile;
                this.requestRender();
            }
        }
    }

    /**
     * Handle touch event
     */
    handleTouchStart(event) {
        if (!event.touches || event.touches.length !== 1) return;
        event.preventDefault();
        const touch = event.touches[0];
        if (!touch) return;
        this.touchGesture.active = true;
        this.touchGesture.moved = false;
        this.touchGesture.distance = 0;
        this.touchGesture.startX = touch.clientX;
        this.touchGesture.startY = touch.clientY;
        this.touchGesture.lastX = touch.clientX;
        this.touchGesture.lastY = touch.clientY;
        this.touchGesture.startTile = this.screenToTile(touch.clientX, touch.clientY);
    }

    handleTouchMove(event) {
        if (!this.touchGesture.active || !event.touches || event.touches.length !== 1) return;
        event.preventDefault();
        const touch = event.touches[0];
        if (!touch) return;

        const dx = touch.clientX - this.touchGesture.lastX;
        const dy = touch.clientY - this.touchGesture.lastY;
        this.camera.x -= dx;
        this.camera.y -= dy;
        this.touchGesture.distance += Math.sqrt((dx * dx) + (dy * dy));
        if (this.touchGesture.distance >= 4) {
            this.touchGesture.moved = true;
        }

        const maxX = (this.width * MAP_CONFIG.tileSize) - this.canvas.width;
        const maxY = (this.height * MAP_CONFIG.tileSize) - this.canvas.height;
        this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));

        this.touchGesture.lastX = touch.clientX;
        this.touchGesture.lastY = touch.clientY;
        this.requestRender();
    }

    handleTouchEnd(event) {
        if (!this.touchGesture.active) return;
        event.preventDefault();

        const changedTouch = event.changedTouches?.[0] || null;
        const endTile = changedTouch
            ? this.screenToTile(changedTouch.clientX, changedTouch.clientY)
            : null;
        const tile = this.touchGesture.startTile || endTile;

        if (this.touchGesture.moved) {
            this.suppressNextClick = true;
            this.touchGesture.active = false;
            this.touchGesture.startTile = null;
            this.lastTouchTap = { x: null, y: null, time: 0 };
            return;
        }

        this.touchGesture.active = false;
        this.touchGesture.startTile = null;
        if (!tile) return;

        const now = Date.now();
        const recentTapMs = now - (this.lastTouchTap.time || 0);
        const sameTile = this.lastTouchTap.x === tile.x && this.lastTouchTap.y === tile.y;
        const isDoubleTap = sameTile && recentTapMs > 0 && recentTapMs <= 340;

        this.lastTouchTap = { x: tile.x, y: tile.y, time: now };

        if (isDoubleTap) {
            this.clearPendingTileSelection();
            const unit = gameState.units.find((u) =>
                u.owner === 'player'
                && !u.isCarried
                && u.position?.x === tile.x
                && u.position?.y === tile.y
            );
            if (unit) {
                this.toggleMoveModeForUnit(unit, { activationHint: 'Toque o tile de destino para mover.' });
                return;
            }
        }

        const tappedUnit = this.getSelectableUnitAt(tile.x, tile.y);
        const selectedUnitId = gameState?.selectedUnit?.id || null;
        const tappedSelectedPlayerUnit = Boolean(
            tappedUnit
            && tappedUnit.owner === 'player'
            && selectedUnitId === tappedUnit.id
            && this.awaitingMoveOrder
        );
        if (tappedSelectedPlayerUnit) {
            this.scheduleTileSelection(tile, 360);
            return;
        }

        this.clearPendingTileSelection();
        this.selectTile(tile.x, tile.y);
    }

    handleTouchCancel(event) {
        event.preventDefault();
        this.touchGesture.active = false;
        this.touchGesture.moved = false;
        this.touchGesture.distance = 0;
        this.touchGesture.startTile = null;
    }

    toggleMoveModeForUnit(unit, options = {}) {
        if (!unit || unit.owner !== 'player') return;
        gameState.selectUnit(unit.id);
        const desiredState = (typeof options.desiredState === 'boolean')
            ? options.desiredState
            : !this.awaitingMoveOrder;
        this.awaitingMoveOrder = desiredState;
        if (window.uiManager) {
            uiManager.showUnitPanel(unit);
            uiManager.showNotification(
                this.awaitingMoveOrder
                    ? `Modo de movimento ATIVADO. ${options.activationHint || 'Clique no tile de destino para mover.'}`
                    : 'Modo de movimento DESATIVADO.',
                'info'
            );
        }
        this.requestRender();
    }

    clearPendingTileSelection() {
        if (this.pendingTileSelectionTimer) {
            clearTimeout(this.pendingTileSelectionTimer);
            this.pendingTileSelectionTimer = null;
        }
    }

    scheduleTileSelection(tile, delayMs = 260) {
        this.clearPendingTileSelection();
        this.pendingTileSelectionTimer = setTimeout(() => {
            this.pendingTileSelectionTimer = null;
            if (!tile || !Number.isFinite(tile.x) || !Number.isFinite(tile.y)) return;
            this.selectTile(tile.x, tile.y);
        }, Math.max(0, delayMs));
    }

    getSelectableUnitAt(x, y) {
        return gameState.units.find((u) => {
            if (u.position.x !== x || u.position.y !== y) return false;
            if (u.owner === 'player') return true;
            return this.isTileVisible(x, y);
        }) || null;
    }

    screenToTile(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const mapX = (clientX - rect.left) + this.camera.x;
        const mapY = (clientY - rect.top) + this.camera.y;
        const x = Math.floor(mapX / MAP_CONFIG.tileSize);
        const y = Math.floor(mapY / MAP_CONFIG.tileSize);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return { x, y };
    }

    /**
     * Select a tile
     */
    selectTile(x, y) {
        this.selectedTile = { x, y };
        const tile = this.getTile(x, y);

        // Check if there's a unit on this tile
        const unit = this.getSelectableUnitAt(x, y);

        if (unit && unit.owner === 'player') {
            const selectedUnitId = gameState.selectedUnit?.id || null;
            const clickedSelectedUnit = selectedUnitId === unit.id;
            if (clickedSelectedUnit && this.awaitingMoveOrder) {
                this.awaitingMoveOrder = false;
                if (window.uiManager) {
                    uiManager.showUnitPanel(unit);
                    uiManager.showNotification('Modo de movimento OFF.', 'info');
                }
                this.requestRender();
                return;
            }
            gameState.selectUnit(unit.id);
            if (!clickedSelectedUnit) {
                this.awaitingMoveOrder = false;
            }
            if (window.uiManager) {
                window.uiManager.showUnitPanel(unit);
            }
        } else if (unit && unit.owner !== 'player' && !this.awaitingMoveOrder) {
            if (window.uiManager) {
                window.uiManager.showEnemyUnitPanel(unit);
            }
        } else if (gameState.selectedUnit && this.awaitingMoveOrder) {
            // Try to move selected unit
            const moved = gameState.moveUnit(gameState.selectedUnit.id, { x, y });
            if (!moved && window.uiManager) {
                window.uiManager.showNotification('Unidade não pode se mover para esse tile', 'error');
            } else if (moved) {
                window.uiManager?.onTutorialAction?.('move');
                this.awaitingMoveOrder = false;
            }
        } else if (tile?.cityData && window.uiManager && !this.isFoggedTile(x, y)) {
            const p = tile.cityData.production;
            const wonderText = tile.cityData.wonder ? ` | Maravilha: ${tile.cityData.wonder}` : '';
            const tribeText = tile.cityData.tribe ? ` | Tribo: ${tile.cityData.tribe}` : '';
            window.uiManager.showNotification(
                `${tile.cityData.name} (${tile.owner || 'neutro'}) - F${p.food} I${p.industry} G${p.gold}${tribeText}${wonderText}`,
                'info'
            );
        }

        this.requestRender();
    }

    /**
     * Place historically precise main roads between major cities
     */
    placeHistoricalRoads() {
        HISTORIC_ROADS.forEach(road => {
            const fromCity = HISTORIC_TOWNS.find(t => t.id === road.from);
            const toCity = HISTORIC_TOWNS.find(t => t.id === road.to);
            if (!fromCity || !toCity) return;

            // Simple line algorithm to place roads between cities
            let x0 = fromCity.x;
            let y0 = fromCity.y;
            let x1 = toCity.x;
            let y1 = toCity.y;

            let dx = Math.abs(x1 - x0);
            let dy = Math.abs(y1 - y0);
            let sx = (x0 < x1) ? 1 : -1;
            let sy = (y0 < y1) ? 1 : -1;
            let err = dx - dy;

            while (true) {
                const tile = this.getTile(x0, y0);
                if (tile && tile.terrain !== 'water') {
                    // Upgrade road type if a better one already exists, or just set it
                    if (!tile.road || (road.type === 'stone' && tile.road !== 'stone')) {
                        tile.road = road.type || 'dirt';
                    }
                }

                if (x0 === x1 && y0 === y1) break;
                let e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x0 += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y0 += sy;
                }
            }
        });
    }

    /**
     * Get tile at position
     */
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y][x];
        }
        return null;
    }

    exportFogState() {
        const totalTiles = this.width * this.height;
        const byteLength = Math.ceil(totalTiles / 8);
        const bytes = new Uint8Array(byteLength);

        let index = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.fogOfWar[y]?.[x]) {
                    const byteIndex = index >> 3;
                    const bitOffset = index & 7;
                    bytes[byteIndex] |= (1 << bitOffset);
                }
                index++;
            }
        }

        const encoded = this.encodeBytesToBase64(bytes);
        if (typeof encoded === 'string' && encoded.length > 0) {
            return {
                exploredTiles: encoded,
                encoding: 'bitset-base64',
                width: this.width,
                height: this.height
            };
        }

        // Fallback for environments without base64 helpers.
        const exploredTiles = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.fogOfWar[y]?.[x]) exploredTiles.push([x, y]);
            }
        }
        return { exploredTiles };
    }

    importFogState(data) {
        this.initializeFogOfWar();
        if (data?.encoding === 'bitset-base64' && typeof data?.exploredTiles === 'string') {
            const bytes = this.decodeBase64ToBytes(data.exploredTiles);
            const savedWidth = Number.isInteger(data.width) ? data.width : this.width;
            const savedHeight = Number.isInteger(data.height) ? data.height : this.height;
            if (bytes && savedWidth > 0 && savedHeight > 0) {
                const totalTiles = savedWidth * savedHeight;
                for (let index = 0; index < totalTiles; index++) {
                    const byteIndex = index >> 3;
                    const bitOffset = index & 7;
                    if (byteIndex >= bytes.length) break;
                    const explored = (bytes[byteIndex] & (1 << bitOffset)) !== 0;
                    if (!explored) continue;
                    const y = Math.floor(index / savedWidth);
                    const x = index % savedWidth;
                    if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
                    this.fogOfWar[y][x] = false;
                    this.fogAlphaCache[y][x] = -1;
                }
                return;
            }
        }

        const exploredTiles = Array.isArray(data?.exploredTiles) ? data.exploredTiles : [];
        exploredTiles.forEach((entry) => {
            if (!Array.isArray(entry) || entry.length < 2) return;
            const [x, y] = entry;
            if (!Number.isInteger(x) || !Number.isInteger(y)) return;
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
            this.fogOfWar[y][x] = false;
            this.fogAlphaCache[y][x] = -1;
        });
    }

    encodeBytesToBase64(bytes) {
        if (!(bytes instanceof Uint8Array)) return null;
        if (typeof btoa === 'function') {
            let binary = '';
            const chunkSize = 0x8000;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
                binary += String.fromCharCode(...slice);
            }
            return btoa(binary);
        }
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(bytes).toString('base64');
        }
        return null;
    }

    decodeBase64ToBytes(encoded) {
        if (typeof encoded !== 'string' || encoded.length === 0) return null;
        if (typeof atob === 'function') {
            try {
                const binary = atob(encoded);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i) & 0xFF;
                }
                return bytes;
            } catch (error) {
                return null;
            }
        }
        if (typeof Buffer !== 'undefined') {
            try {
                const buffer = Buffer.from(encoded, 'base64');
                return new Uint8Array(buffer);
            } catch (error) {
                return null;
            }
        }
        return null;
    }

    tileToGeo(x, y) {
        const lon = HISTORIC_MAP_BOUNDS.west + (x / (this.width - 1)) * (HISTORIC_MAP_BOUNDS.east - HISTORIC_MAP_BOUNDS.west);
        const lat = HISTORIC_MAP_BOUNDS.north - (y / (this.height - 1)) * (HISTORIC_MAP_BOUNDS.north - HISTORIC_MAP_BOUNDS.south);
        return { lon, lat };
    }

    isCoastalTile(x, y) {
        const offsets = [
            { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }
        ];
        return offsets.some((offset) => this.getTile(x + offset.x, y + offset.y)?.terrain === 'water');
    }

    getTileNeighborhood(x, y, radius = 1) {
        const tiles = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tile = this.getTile(x + dx, y + dy);
                if (tile) tiles.push(tile);
            }
        }
        return tiles;
    }

    /**
     * Whether a tile carries a river, decided by river geometry rather than height.
     *
     * This used to accept any tile in the height band 40..52 and fall back to
     * isNearRiver(). The band was never a safe proxy: assets/geography.js puts
     * inland lakes at exactly 40 and the coastal shelf at roughly 35..51, so of
     * the 2732 tiles it matched only 374 were near a river -- 247 were lakes and
     * 2111 were open sea. getCityTerrainAccess() builds its neighbourhood with
     * getTileNeighborhood(), which unlike terrainAllowsBuildAction() does not
     * filter water, so 335 land tiles claimed river access from an adjacent
     * saltwater tile and collected irrigation, canal and food bonuses for it.
     *
     * The band was also redundant. MEDITERRANEAN_HEIGHTMAP and isNearRiver both
     * come from assets/geography.js, so there is no load order in which the band
     * is available and the geometry is not, and on land the two agree exactly.
     */
    isRiverTile(x, y) {
        if (typeof isNearRiver !== 'function') return false;
        const geo = this.tileToGeo(x, y);
        return isNearRiver(geo.lon, geo.lat);
    }

    isFertileTile(x, y) {
        const tile = this.getTile(x, y);
        if (!tile || tile.terrain === 'water' || tile.terrain === 'mountains') return false;
        const h = (typeof MEDITERRANEAN_HEIGHTMAP !== 'undefined')
            ? MEDITERRANEAN_HEIGHTMAP?.[y]?.[x]
            : undefined;
        const richAlluvial = typeof h === 'number' && h >= 54 && h <= 98;
        return richAlluvial || this.isRiverTile(x, y) || this.isCoastalTile(x, y);
    }

    getTownFoundationBonuses(x, y) {
        const result = {
            food: 0,
            gold: 0,
            manpower: 0,
            notes: []
        };

        if (this.isRiverTile(x, y)) {
            result.food += 2;
            result.manpower += 1;
            result.notes.push('bacia fluvial');
        }
        if (this.isCoastalTile(x, y)) {
            result.gold += 2;
            result.food += 1;
            result.notes.push('comércio costeiro');
        }
        if (this.isFertileTile(x, y)) {
            result.food += 2;
            result.gold += 1;
            result.notes.push('terra fértil');
        }

        return result;
    }

    getTerrainEffects(terrain, context = {}) {
        const base = TERRAIN_EFFECTS[terrain] || TERRAIN_EFFECTS.plains;
        const effects = { ...base };
        const unit = context.unit;
        if (unit?.category === 'mountain' && (terrain === 'hills' || terrain === 'mountains')) {
            effects.moveCostMultiplier *= 0.65;
            effects.attackMultiplier *= 1.05;
        }
        if (unit?.type === 'cavalry' && (terrain === 'forest' || terrain === 'mountains')) {
            effects.moveCostMultiplier *= 1.3;
            effects.attackMultiplier *= 0.9;
        }
        const fortBonus = context.fortDefenseBonus || 0;
        if (fortBonus > 0) {
            effects.defenseMultiplier *= 1 + Math.max(0, Math.min(0.35, fortBonus));
        }
        return effects;
    }

    terrainAllowsBuildAction(x, y, actionId) {
        const tile = this.getTile(x, y);
        if (!tile) return { allowed: false, reason: 'tile invalido' };
        const around = this.getTileNeighborhood(x, y, 1).filter((t) => t.terrain !== 'water');
        const hasFertile = this.isFertileTile(x, y) || around.some((t) => this.isFertileTile(t.x, t.y));
        const hasRiver = this.isRiverTile(x, y) || around.some((t) => this.isRiverTile(t.x, t.y));
        const hasCoast = this.isCoastalTile(x, y) || around.some((t) => this.isCoastalTile(t.x, t.y));
        const hasForestLand = around.some((t) => t.terrain === 'forest' || t.terrain === 'plains' || t.terrain === 'hills');

        switch (actionId) {
            case 'build_farm':
                if (!hasFertile) return { allowed: false, reason: 'Fazendas exigem terras férteis, fluviais ou costeiras próximas' };
                return { allowed: true };
            case 'irrigate':
                if (!(hasRiver || hasCoast || hasFertile)) return { allowed: false, reason: 'Irrigação requer rio, costa ou terra fértil próxima' };
                return { allowed: true };
            case 'plant_forest':
                if (!hasForestLand) return { allowed: false, reason: 'Gestão de florestas requer terra trabalhável próxima' };
                return { allowed: true };
            case 'build_canal':
                if (!(hasCoast || hasRiver)) return { allowed: false, reason: 'Canais requerem costa ou rio próximo' };
                return { allowed: true };
            default:
                return { allowed: true };
        }
    }

    getResourcePlacementWeights(tile) {
        if (!tile || tile.terrain === 'water' || tile.terrain === 'city') return null;
        const terrain = tile.terrain;
        const coastal = this.isCoastalTile(tile.x, tile.y);
        const river = this.isRiverTile(tile.x, tile.y);
        const fertile = this.isFertileTile(tile.x, tile.y);
        const biomeEffects = this.getBiomeEffects(tile);
        const weights = {
            food: 0,
            wood: 0,
            stone: 0,
            iron: 0,
            rare: 0
        };

        if (terrain === 'plains') {
            weights.food += fertile ? 4.2 : 2.1;
            weights.wood += 0.8;
            weights.stone += 0.6;
            weights.rare += coastal ? 0.5 : 0.2;
        }
        if (terrain === 'forest') {
            weights.wood += 4.8;
            weights.food += fertile ? 1.8 : 0.6;
            weights.rare += 0.4;
            weights.stone += 0.4;
        }
        if (terrain === 'hills') {
            weights.stone += 3.7;
            weights.iron += 2.6;
            weights.wood += 0.8;
            weights.rare += 0.9;
        }
        if (terrain === 'mountains') {
            weights.stone += 4.2;
            weights.iron += 3.5;
            weights.rare += 1.6;
        }

        if (river) {
            weights.food += 1.8;
            weights.rare += 0.2;
        }
        if (coastal) {
            weights.food += 1.2;
            weights.rare += 0.7;
        }

        if (biomeEffects.resourceMultipliers) {
            Object.keys(weights).forEach((key) => {
                weights[key] *= biomeEffects.resourceMultipliers[key] || 1;
            });
        }

        return weights;
    }

    placeStrategicResources() {
        const landTiles = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                if (!tile) continue;
                tile.resourceNode = null;
                if (tile.terrain === 'water' || tile.terrain === 'city') continue;
                landTiles.push(tile);
            }
        }
        if (landTiles.length === 0) return;

        const resourceCfg = this.generationConfig?.resources || WORLD_GENERATION_DEFAULTS.resources;
        const targetRatios = resourceCfg.targetRatios || WORLD_GENERATION_DEFAULTS.resources.targetRatios;
        const minCounts = resourceCfg.minCounts || WORLD_GENERATION_DEFAULTS.resources.minCounts;
        const selected = new Set();
        const selectedByType = new Map(Object.keys(targetRatios).map((k) => [k, []]));

        Object.keys(targetRatios).forEach((type, typeIdx) => {
            const candidates = [];
            for (const tile of landTiles) {
                const weights = this.getResourcePlacementWeights(tile);
                const weight = weights?.[type] || 0;
                if (weight <= 0) continue;
                const noise = deterministicTileNoise(tile.x, tile.y, 17 + typeIdx * 97, this.worldSeed);
                candidates.push({
                    tile,
                    score: weight * (0.85 + noise * 0.45),
                    noise
                });
            }
            candidates.sort((a, b) => b.score - a.score);
            const targetCount = Math.max(minCounts[type], Math.floor(landTiles.length * targetRatios[type]));

            for (const candidate of candidates) {
                if (selectedByType.get(type).length >= targetCount) break;
                const tile = candidate.tile;
                const key = `${tile.x},${tile.y}`;
                if (selected.has(key)) continue;

                const sameTypeTooClose = selectedByType.get(type).some((other) =>
                    Math.abs(other.x - tile.x) + Math.abs(other.y - tile.y) <= resourceCfg.spacing
                );
                if (sameTypeTooClose) continue;

                const richness = candidate.noise > resourceCfg.richnessHighThreshold
                    ? 3
                    : (candidate.noise > resourceCfg.richnessMediumThreshold ? 2 : 1);
                tile.resourceNode = { type, richness };
                selected.add(key);
                selectedByType.get(type).push(tile);
            }
        });
    }

    getTileResourceYield(tile) {
        const node = tile?.resourceNode;
        if (!node) return null;
        const def = RESOURCE_NODE_TYPES[node.type];
        if (!def) return null;
        return {
            type: node.type,
            amount: Math.max(1, (def.baseYield || 1) + ((node.richness || 1) - 1))
        };
    }

    getNearbyResourceYields(x, y, radius = 2) {
        const totals = { food: 0, wood: 0, stone: 0, iron: 0, rare: 0 };
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist > radius) continue;
                const tile = this.getTile(x + dx, y + dy);
                if (!tile) continue;
                const yieldNode = this.getTileResourceYield(tile);
                if (!yieldNode) continue;
                const proximityMultiplier = dist === 0 ? 1 : (dist === 1 ? 0.75 : 0.45);
                const contribution = Math.floor(yieldNode.amount * proximityMultiplier);
                if (contribution > 0) {
                    totals[yieldNode.type] += contribution;
                }
            }
        }
        return totals;
    }

    /**
     * Get unit at position
     */
    getUnitAt(x, y) {
        return gameState.units.find(u => u.position.x === x && u.position.y === y);
    }
}

// Global map instance
let gameMap = null;

function getWorldGenerationConfigSnapshot() {
    if (gameMap?.getGenerationConfigSnapshot) {
        return gameMap.getGenerationConfigSnapshot();
    }
    return resolveWorldGenerationConfig();
}

function setWorldGenerationConfig(overrides = {}, options = {}) {
    if (typeof window === 'undefined') return getWorldGenerationConfigSnapshot();
    window.WORLD_GENERATION_CONFIG = deepMergeObjects(getWorldGenerationConfigSnapshot(), overrides || {});
    const shouldRegenerate = options.regenerate !== false;
    const hasActiveGameState = !!(typeof gameState !== 'undefined'
        && gameState
        && gameState.initialized
        && (Array.isArray(gameState.units) ? gameState.units.length > 0 : false));
    const allowActiveGameReset = options.allowActiveGameReset === true;
    if (gameMap && shouldRegenerate) {
        if (hasActiveGameState && !allowActiveGameReset) {
            console.warn('setWorldGenerationConfig ignorou a regeneração do mapa porque um jogo ativo está carregado. Use { allowActiveGameReset: true } apenas durante um fluxo controlado de reinicialização/carregamento.');
            return getWorldGenerationConfigSnapshot();
        }
        gameMap.initializeMap();
        gameMap.markTerritoryDirty();
        if (typeof gameMap.initializeFogOfWar === 'function') {
            gameMap.initializeFogOfWar();
        }
        gameMap.requestRender?.();
    }
    return getWorldGenerationConfigSnapshot();
}

/**
 * Initialize game map
 */
function initializeGameMap() {
    const canvas = document.getElementById('game-map');
    if (!canvas) return;

    // Reuse the existing map/canvas instance to avoid duplicating event listeners.
    if (gameMap
        && gameMap.canvas === canvas
        && gameMap.width === MAP_CONFIG.width
        && gameMap.height === MAP_CONFIG.height) {
        gameMap.canvas.width = gameMap.canvas.offsetWidth;
        gameMap.canvas.height = gameMap.canvas.offsetHeight;
        gameMap.initializeMap();
        gameMap.initializeFogOfWar();
        gameMap.selectedTile = null;
        gameMap.hoveredTile = null;
        const constantinople = HISTORIC_TOWNS.find(t => t.id === 'constantinople');
        const constantinopleX = constantinople ? constantinople.x : Math.floor(gameMap.width * 0.58);
        const constantinopleY = constantinople ? constantinople.y : Math.floor(gameMap.height * 0.36);
        gameMap.camera.x = (constantinopleX * MAP_CONFIG.tileSize) - (canvas.width / 2);
        gameMap.camera.y = (constantinopleY * MAP_CONFIG.tileSize) - (canvas.height / 2);
        gameMap.markTerritoryDirty();
        gameMap.requestRender();
        return;
    }

    gameMap = new GameMap(MAP_CONFIG.width, MAP_CONFIG.height);
    gameMap.initializeCanvas(canvas);
    gameMap.requestRender();
}

if (typeof window !== 'undefined') {
    window.getWorldGenerationConfig = getWorldGenerationConfigSnapshot;
    window.setWorldGenerationConfig = setWorldGenerationConfig;
}
