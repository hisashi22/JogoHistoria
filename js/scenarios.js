'use strict';

/**
 * ScenarioLoader — loads historical battle scenarios from local JSON files.
 *
 * Scenarios are authored against the neobyzantine.org history material and
 * bundled into this repository under assets/scenarios/, or supplied by the
 * player as a JSON file. No remote fetching — all data is local.
 *
 * The schema is version 1.0 and is owned here rather than anywhere else:
 * _validate() below is the enforced contract, and the bundled files under
 * assets/scenarios/ are the worked examples.
 */
const NEOBYZANTINE_ORIGIN = 'https://neobyzantine.org';

/**
 * Return a scenario's external history link when it genuinely points at
 * neobyzantine.org, otherwise null.
 *
 * Scenario JSON is user-supplied via ScenarioLoader.loadFromJson, so this value
 * reaches window.open from outside the application. Comparing the parsed origin
 * states the rule the code actually depends on: a prefix test only holds while
 * the trailing slash is present, and silently starts accepting
 * neobyzantine.org.example.com the day someone trims it.
 */
function neobyzantineLink(value) {
    if (typeof value !== 'string' || value === '') return null;
    let parsed;
    try {
        parsed = new URL(value);
    } catch {
        return null;
    }
    return parsed.origin === NEOBYZANTINE_ORIGIN ? parsed.href : null;
}

class ScenarioLoader {
    static SCHEMA_VERSION = '1.0';

    // Registry populated by loadIndex() — metadata extracted from each full scenario JSON file.
    static _registry = [];

    /** Load assets/scenarios/index.json and fetch each scenario's metadata. */
    static async loadIndex() {
        let ids;
        try {
            const resp = await fetch('assets/scenarios/index.json');
            if (!resp.ok) return;
            ids = await resp.json();
        } catch {
            return;
        }
        if (!Array.isArray(ids)) return;
        const results = await Promise.all(
            ids.map(id =>
                fetch(`assets/scenarios/${id}.json`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null)
            )
        );
        ScenarioLoader._registry = results
            .filter(d => d && typeof d.id === 'string' && d.id && typeof d.title === 'string' && d.title)
            .map(d => ({
                id: d.id,
                title: d.title,
                description: d.description ?? '',
                century: String(d.century),
                playerFaction: d.forces?.[0]?.faction ?? 'byzantine',
            }));
        console.info(`[ScenarioLoader] Carregado(s) ${ScenarioLoader._registry.length} cenário(s) histórico(s)`);
    }

    /** Return registry entries for a given century string. */
    static getScenariosByCentury(century) {
        return ScenarioLoader._registry.filter(s => s.century === String(century));
    }

    /** Return registry entry for a scenario id, or null. */
    static getScenarioMeta(id) {
        return ScenarioLoader._registry.find(s => s.id === id) ?? null;
    }

    // Map scenario faction strings → 500ad faction ids
    static FACTION_MAP = {
        byzantine: 'byzantine',
        roman: 'byzantine',
        seljuk: 'arab',
        ottoman: 'arab',
        arab: 'arab',
        sassanid: 'sassanid',
        persian: 'sassanid',
        frank: 'frank',
        bulgar: 'bulgar',
        slavic: 'bulgar',
        neutral: 'byzantine',
    };

    // Map scenario unit strings → 500ad unit type ids
    static UNIT_MAP = {
        heavy_cavalry: 'cataphract',
        tagmata: 'tagmata',
        archers: 'archers',
        varangian_guard: 'varangian',
        horse_archers: 'horsearchers',
        infantry: 'skutatoi',
        siege: 'engineers',
        navy: 'transport',
    };

    constructor() {
        this._activeScenario = null;
    }

    // ── Loading ────────────────────────────────────────────────────────────

    /** Parse and validate a scenario JSON string. */
    loadFromJson(jsonString) {
        let data;
        try {
            data = JSON.parse(jsonString);
        } catch {
            throw new Error('O JSON do cenário não é um JSON válido');
        }
        return this._validate(data);
    }

    /** Load a bundled scenario from assets/scenarios/{id}.json */
    async loadBuiltin(scenarioId) {
        const url = `assets/scenarios/${scenarioId}.json`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Cenário embutido não encontrado: ${scenarioId}`);
        }
        const data = await response.json();
        return this._validate(data);
    }

    // ── Applying ───────────────────────────────────────────────────────────

    /**
     * Apply a loaded GameScenario to the running game.
     * Call after game init — places forces on tiles, sets camera.
     */
    applyScenario(gameState, gameMap, scenario) {
        this._activeScenario = scenario;

        // Center camera on scenario map_center
        if (scenario.map_center) {
            const { tile_x, tile_y } = scenario.map_center;
            if (typeof tile_x === 'number' && typeof tile_y === 'number') {
                gameMap.centerOn(tile_x, tile_y);
            }
        }

        // Place each force on the map
        for (const force of (scenario.forces || [])) {
            this._placeForce(gameState, gameMap, force);
        }

        // Register newly placed enemy units with the AI faction system
        if (typeof gameState.refreshAIFactionState === 'function') {
            gameState.refreshAIFactionState();
        }

        gameMap.requestRender();

        // Store metadata for UI display
        gameState.activeScenario = {
            id: scenario.id,
            title: scenario.title,
            dateYear: scenario.date_year,
            dateDisplay: scenario.date_display,
            neobyzantineUrl: neobyzantineLink(scenario.neobyzantine_event_url),
        };

        console.info(`[ScenarioLoader] Cenário aplicado: ${scenario.title} (${scenario.date_year})`);
    }

    /**
     * Merge GameMapExport locations into HISTORIC_TOWNS.
     * Imported entries with the same id override hardcoded entries.
     */
    applyMapData(gameMap, mapExport) {
        if (!mapExport.locations || !Array.isArray(mapExport.locations)) return;

        const importedIds = new Set(mapExport.locations.map(l => l.id));

        // Filter out overridden towns from hardcoded list
        const baseList = (typeof HISTORIC_TOWNS !== 'undefined' ? HISTORIC_TOWNS : [])
            .filter(t => !importedIds.has(t.id));

        // Convert imported locations to 500ad town format
        const importedTowns = mapExport.locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            x: loc.tile_x,
            y: loc.tile_y,
            lon: loc.lng,
            lat: loc.lat,
            type: loc.type === 'capital' ? 'capital' : loc.type === 'city' ? 'city' : 'town',
            importance: loc.importance ?? 6,
            cityData: {
                kind: loc.type,
                tribe: ScenarioLoader.FACTION_MAP[loc.faction] ?? 'byzantine',
                historicalCivilization: ScenarioLoader.FACTION_MAP[loc.faction] ?? 'byzantine',
            },
        }));

        // Merge: imported towns take precedence
        gameMap.importedTowns = [...importedTowns, ...baseList];

        // Apply merged list to map tiles — placeHistoricalTowns reads HISTORIC_TOWNS by default
        // and is called during init, so we re-invoke with the merged list to place imported entries.
        if (typeof gameMap.placeHistoricalTowns === 'function') {
            gameMap.placeHistoricalTowns(gameMap.importedTowns);
        }

        console.info(`[ScenarioLoader] Importado ${importedTowns.length} locais suplementares`);
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    getActiveScenario() {
        return this._activeScenario;
    }

    clearActiveScenario() {
        this._activeScenario = null;
    }

    // ── Internal ─────────────────────────────────────────────────────────

    _validate(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('O cenário deve ser um objeto JSON');
        }
        if (data.schema_version && data.schema_version !== ScenarioLoader.SCHEMA_VERSION) {
            console.warn(`[ScenarioLoader] Incompatibilidade na versão do esquema: obtido ${data.schema_version}, esperado ${ScenarioLoader.SCHEMA_VERSION}`);
        }
        if (!data.id || typeof data.id !== 'string') {
            throw new Error('O cenário deve ter um campo "id" do tipo string');
        }
        if (!data.title || typeof data.title !== 'string') {
            throw new Error('O cenário deve ter um campo "title" do tipo string');
        }
        return data;
    }

    _placeForce(gameState, gameMap, force) {
        const { tile_x, tile_y } = force.position || {};
        if (typeof tile_x !== 'number' || typeof tile_y !== 'number') return;

        const factionId = ScenarioLoader.FACTION_MAP[force.faction] ?? 'byzantine';
        const isPlayer = factionId === gameState.player?.faction;
        const owner = isPlayer ? 'player' : 'enemy';

        let placed = 0;
        (force.units || ['infantry']).forEach((unitKey, i) => {
            const unitTypeId = ScenarioLoader.UNIT_MAP[unitKey] ?? 'skutatoi';
            const offsetX = (i % 3) - 1;
            const offsetY = Math.floor(i / 3) - 1;
            const pos = this._findLandTile(gameState, gameMap, tile_x + offsetX, tile_y + offsetY, unitTypeId);
            if (!pos) return;
            const unit = createUnit(unitTypeId, pos, owner);
            if (!unit) return;

            unit.faction = factionId;
            if (typeof gameState.applyFactionUnitNaming === 'function') {
                gameState.applyFactionUnitNaming(unit, factionId);
            }
            gameState.units.push(unit);
            if (isPlayer) {
                gameState.player.unitsOwned.push(unit.id);
            }
            if (isPlayer) gameMap.revealArea(unit.position.x, unit.position.y, 3);
            placed++;
        });

        console.info(`[ScenarioLoader] Posicionada ${placed} unidades de ${factionId} próximo ao tile (${tile_x}, ${tile_y})`);
    }

    /** Return the nearest valid spawn tile to (x, y), searching outward up to maxRadius.
     *  Water-only units (naval/transport) target water tiles; all others target land tiles. */
    _findLandTile(gameState, gameMap, x, y, unitTypeId = null, maxRadius = 6) {
        const unitType = typeof getUnitById === 'function' ? getUnitById(unitTypeId) : null;
        const waterOnly = unitType?.type === 'naval' || unitType?.category === 'transport';

        for (let r = 0; r <= maxRadius; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (r > 0 && Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    const nx = x + dx, ny = y + dy;
                    if (waterOnly) {
                        const tile = gameMap.getTile(nx, ny);
                        if (!tile || tile.terrain !== 'water') continue;
                        if (gameState.units.some(u => u.position.x === nx && u.position.y === ny)) continue;
                        return { x: nx, y: ny };
                    }
                    if (gameState.isSpawnTileAvailable(nx, ny) && !gameMap.isRiverTile(nx, ny)) return { x: nx, y: ny };
                }
            }
        }
        return null;
    }
}

// Export for use in game.js / ui.js
if (typeof window !== 'undefined') {
    window.ScenarioLoader = ScenarioLoader;
}
