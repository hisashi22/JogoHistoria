/**
 * AI Manager
 * Multi-faction enemy AI with personality-driven priorities.
 */

const AI_PERSONALITY_PROFILES = {
    aggressive: {
        aggressionBias: 0.9,
        defenseBias: 0.35,
        expansionBias: 0.75,
        resourceBias: 0.45,
        diplomacyBias: 0.2
    },
    defensive: {
        aggressionBias: 0.42,
        defenseBias: 0.92,
        expansionBias: 0.38,
        resourceBias: 0.7,
        diplomacyBias: 0.45
    },
    opportunistic: {
        aggressionBias: 0.65,
        defenseBias: 0.55,
        expansionBias: 0.88,
        resourceBias: 0.6,
        diplomacyBias: 0.35
    },
    diplomatic: {
        aggressionBias: 0.35,
        defenseBias: 0.55,
        expansionBias: 0.5,
        resourceBias: 0.65,
        diplomacyBias: 0.95
    }
};

function getAIPersonalityBehaviorDefaults(personality) {
    const profile = AI_PERSONALITY_PROFILES[personality] || AI_PERSONALITY_PROFILES.defensive;
    return {
        aggression: profile.aggressionBias,
        expansion: profile.expansionBias,
        defense: profile.defenseBias,
        diplomacy: profile.diplomacyBias,
        resourceFocus: profile.resourceBias
    };
}

if (typeof window !== 'undefined') {
    window.getAIPersonalityBehaviorDefaults = getAIPersonalityBehaviorDefaults;
}

class AIManager {
    constructor() {
        this.thinkingDelay = 350; // ms between actions
    }

    getFactionIdForUnit(unit) {
        return unit?.faction || 'tribal';
    }

    getPersonalityProfile(factionId) {
        const state = gameState?.ensureAIFactionState?.(factionId);
        const personality = state?.personality || 'defensive';
        return AI_PERSONALITY_PROFILES[personality] || AI_PERSONALITY_PROFILES.defensive;
    }

    /**
     * Build per-faction inputs used across planning and tactical phases for one AI turn.
     * `threatenedCities` and `frontierCities` are derived snapshots for this turn only.
     */
    buildFactionContext(factionId, units) {
        const state = gameState?.ensureAIFactionState?.(factionId);
        const profile = this.getPersonalityProfile(factionId);
        const playerThreatUnits = this.getActivePlayerThreatUnits();
        const cities = gameState?.getAIFactionCityTiles?.(factionId) || [];
        const playerCities = gameMap?.getCityTiles?.('player') || [];
        const neutralCities = (gameMap?.getCityTiles?.() || []).filter((tile) => tile.owner === 'neutral' || tile.owner === null);
        const recentEvents = gameState?.getRecentAIWorldEvents?.(12) || [];

        const threatenedCities = cities.filter((city) => this.minDistanceToPlayerUnit(city, playerThreatUnits) <= 5);
        const frontierCities = cities.filter((city) => this.findNearestNeutralCity(city, neutralCities, 9) || this.findNearestPlayerCity(city, playerCities, 10));
        const resourcePotential = this.estimateFactionResourcePotential(cities);

        return {
            factionId,
            state,
            profile,
            units,
            cities,
            playerCities,
            playerThreatUnits,
            neutralCities,
            recentEvents,
            threatenedCities,
            frontierCities,
            resourcePotential
        };
    }

    /**
     * Rank strategic priorities for the current faction turn and return the top focuses.
     * Scores combine personality biases with current intel, city pressure, and resources.
     */
    planFactionTurn(context) {
        const { state, profile, cities, threatenedCities, neutralCities, resourcePotential } = context;
        const intel = state?.intel || {};
        const diplomacyScore = state?.diplomacy?.player || 0;
        const lowCitiesPressure = Math.max(0, 4 - cities.length) * 8;
        const resourcePressure = Math.max(0, 16 - (resourcePotential.totalStrategic || 0));

        const warfareScore = (profile.aggressionBias * 50) + (intel.playerThreat || 0) + ((diplomacyScore > 25 ? 14 : 0));
        const defenseScore = (profile.defenseBias * 50) + (threatenedCities.length * 16) + (intel.playerPressure || 0);
        const expansionScore = (profile.expansionBias * 50) + (neutralCities.length > 0 ? 10 : -10) + lowCitiesPressure;
        const resourceScore = (profile.resourceBias * 50) + resourcePressure;
        const diplomacyFocusScore = (profile.diplomacyBias * 50) + Math.max(0, 12 - Math.abs(diplomacyScore));

        const ranked = [
            { type: 'warfare', score: warfareScore },
            { type: 'defense', score: defenseScore },
            { type: 'expansion', score: expansionScore },
            { type: 'resource', score: resourceScore },
            { type: 'diplomacy', score: diplomacyFocusScore }
        ].sort((a, b) => b.score - a.score);

        const primaryFocus = ranked[0]?.type || 'warfare';
        const secondaryFocus = ranked[1]?.type || 'defense';

        if (state) {
            state.lastPlans = [...(state.lastPlans || []), { turn: gameState.turn, primaryFocus, secondaryFocus, scores: ranked }]
                .slice(-8);
            state.lastActionTurn = gameState.turn;
        }

        return { primaryFocus, secondaryFocus, ranked };
    }

    async processTurn() {
        console.log('Processando turno inimigo...');

        if (!gameState || !gameMap) {
            console.warn('Turno inimigo pulado: estado/mapa não está pronto.');
            return;
        }
        if (typeof gameState.refreshAIFactionState !== 'function' || typeof gameState.updateAIFactionIntelFromWorldState !== 'function') {
            console.warn('Turno inimigo pulado: métodos de suporte da IA não estão disponíveis.');
            return;
        }

        const enemyUnits = gameState.units.filter((u) => u.owner === 'enemy');
        if (enemyUnits.length === 0) {
            console.log('Turno inimigo ignorado: sem unidades inimigas disponíveis.');
            return;
        }

        const aiTimer = typeof perfMonitor !== 'undefined' ? perfMonitor.startTimer('ai_turn') : null;
        try {
            const refreshTimer = typeof perfMonitor !== 'undefined' ? perfMonitor.startTimer('ai_refresh_state') : null;
            gameState.refreshAIFactionState();
            gameState.updateAIFactionIntelFromWorldState();
            if (refreshTimer && typeof perfMonitor !== 'undefined') perfMonitor.endTimer(refreshTimer);

            const unitsByFaction = new Map();
            enemyUnits.forEach((unit) => {
                const factionId = this.getFactionIdForUnit(unit);
                if (!unitsByFaction.has(factionId)) unitsByFaction.set(factionId, []);
                unitsByFaction.get(factionId).push(unit);
            });

            const factionContexts = [...unitsByFaction.entries()]
                .map(([factionId, units]) => this.buildFactionContext(factionId, units))
                .sort((a, b) => {
                    const aThreat = a.state?.intel?.playerThreat || 0;
                    const bThreat = b.state?.intel?.playerThreat || 0;
                    return bThreat - aThreat || b.units.length - a.units.length;
                });

            if (gameMap && enemyUnits[0]) {
                gameMap.centerOn(enemyUnits[0].position.x, enemyUnits[0].position.y);
                gameMap.requestRender();
            }

            for (const context of factionContexts) {
                const factionTimer = typeof perfMonitor !== 'undefined' ? perfMonitor.startTimer(`ai_faction_${context.factionId}`) : null;
                const plan = this.planFactionTurn(context);
                await this.processFactionTurn(context, plan);
                if (factionTimer && typeof perfMonitor !== 'undefined') perfMonitor.endTimer(factionTimer);
            }

            console.log('Turno inimigo concluído');
        } finally {
            if (aiTimer && typeof perfMonitor !== 'undefined') perfMonitor.endTimer(aiTimer);
        }
    }

    async processFactionTurn(context, plan) {
        this.processFactionDiplomacy(context, plan);
        this.processFactionEconomy(context, plan);
        this.processFactionExpansion(context, plan);
        this.processFactionDefense(context, plan);

        const sortedUnits = [...context.units].sort((a, b) => {
            const aFront = this.minDistanceToPlayerUnit(a, context.playerThreatUnits) < 6 ? 1 : 0;
            const bFront = this.minDistanceToPlayerUnit(b, context.playerThreatUnits) < 6 ? 1 : 0;
            return bFront - aFront;
        });

        // Build once per faction turn and keep it in sync via move/combat updates.
        this.occupiedPositions = new Set(
            gameState.units.map((u) => `${u.position.x},${u.position.y}`)
        );

        for (const unit of sortedUnits) {
            await this.processUnit(unit, context, plan);
            await new Promise((resolve) => setTimeout(resolve, this.thinkingDelay));
        }

        this.occupiedPositions = null;
    }

    processFactionDiplomacy(context, plan) {
        const { state } = context;
        if (!state) return;
        if (!state.diplomacy) state.diplomacy = { player: 0 };

        let delta = 0;
        if (plan.primaryFocus === 'diplomacy') delta -= 2;
        else if (plan.primaryFocus === 'warfare') delta += 2;
        state.diplomacy.player = Math.max(-50, Math.min(100, (state.diplomacy.player || 0) + delta));
    }

    processFactionEconomy(context, plan) {
        const { state, cities, resourcePotential } = context;
        if (!state || cities.length === 0) return;
        this.applyFactionIncome(state, resourcePotential);

        const profile = context.profile;
        const shouldInvest = plan.primaryFocus === 'resource'
            || plan.secondaryFocus === 'resource'
            || (profile.resourceBias > 0.6 && Math.random() < 0.45);
        if (!shouldInvest) return;

        const targetCity = [...cities].sort((a, b) => {
            const aYield = gameMap.getNearbyResourceYields(a.x, a.y, 2);
            const bYield = gameMap.getNearbyResourceYields(b.x, b.y, 2);
            const aScore = (aYield.wood || 0) + (aYield.stone || 0) + (aYield.iron || 0) + (aYield.rare || 0);
            const bScore = (bYield.wood || 0) + (bYield.stone || 0) + (bYield.iron || 0) + (bYield.rare || 0);
            return bScore - aScore;
        })[0];
        if (!targetCity?.cityData) return;

        const stockpile = state.stockpile || (state.stockpile = { gold: 0, manpower: 0 });

        if (stockpile.gold >= 40) {
            let upgradeType = 'roads';
            if ((resourcePotential.food || 0) < 3) upgradeType = 'agriculture';
            else if ((resourcePotential.iron || 0) + (resourcePotential.stone || 0) > 4) upgradeType = 'industry';
            if (typeof gameState?.applyAIInfrastructureUpgrade === 'function') {
                const upgraded = gameState.applyAIInfrastructureUpgrade(targetCity, upgradeType, state);
                if (!upgraded) return;
            } else {
                const infra = targetCity.cityData.infrastructure || (targetCity.cityData.infrastructure = { roads: 1, agriculture: 1, industry: 1 });
                infra[upgradeType] = Math.min(5, (infra[upgradeType] || 1) + 1);
                stockpile.gold -= 40;
            }
        }
    }

    applyFactionIncome(state, resourcePotential) {
        if (!state) return;
        if (state.lastIncomeTurn === gameState.turn) return;
        const stockpile = state.stockpile || (state.stockpile = { gold: 0, manpower: 0 });
        stockpile.gold = Math.max(0, Math.floor((stockpile.gold || 0) + 30 + (resourcePotential?.totalStrategic || 0)));
        stockpile.manpower = Math.max(0, Math.floor((stockpile.manpower || 0) + 12));
        state.lastIncomeTurn = gameState.turn;
    }

    processFactionExpansion(context, plan) {
        const { factionId, cities, neutralCities, state, profile } = context;
        if (!cities.length || !neutralCities.length || !state) return;
        if (state.lastExpansionTurn === gameState.turn) return;
        const shouldExpand = plan.primaryFocus === 'expansion'
            || plan.secondaryFocus === 'expansion'
            || (profile.expansionBias > 0.7 && Math.random() < 0.35);
        if (!shouldExpand) return;

        let best = null;
        for (const city of cities) {
            const candidate = this.findNearestNeutralCity(city, neutralCities, 5);
            if (!candidate) continue;
            const dist = Math.abs(candidate.x - city.x) + Math.abs(candidate.y - city.y);
            const playerNearby = this.minDistanceToPlayerUnit(candidate, context.playerThreatUnits);
            const score = (6 - dist) * 10 - Math.max(0, 6 - playerNearby) * 8 + (candidate.importance || 5);
            if (!best || score > best.score) best = { city, candidate, score };
        }
        if (!best || best.score < 6) return;

        const target = best.candidate;
        if (target.owner === 'player' || target.owner === 'enemy') return;

        // Diplomatic personalities annex peacefully more often; others stage armed takeovers.
        const peacefulChance = state.personality === 'diplomatic' ? 0.55 : (state.personality === 'opportunistic' ? 0.35 : 0.15);
        const expansionMode = Math.random() < peacefulChance ? 'peaceful' : 'military';
        const expansionCost = expansionMode === 'military' ? 45 : 30;
        const stockpile = state.stockpile || (state.stockpile = { gold: 0, manpower: 0 });
        if ((stockpile.gold || 0) < expansionCost) return;
        if (!this.applyAIFactionAnnexCity(target, factionId)) return;
        stockpile.gold = Math.max(0, (stockpile.gold || 0) - expansionCost);
        state.lastExpansionTurn = gameState.turn;
        if (expansionMode === 'military') {
            const town = (typeof HISTORIC_TOWNS !== 'undefined' && Array.isArray(HISTORIC_TOWNS))
                ? HISTORIC_TOWNS.find((t) => t.id === (target.cityData?.id || target.cityId))
                : null;
            if (town) {
                const spawned = gameState.spawnFactionArmyAtTown(town, 'enemy', factionId, 1);
                if (!spawned) {
                    this.ensureAIFortifiedCity(target);
                }
            }
        }

        gameState.recordAIWorldEvent?.('ai_expansion', {
            factionId,
            cityId: target.cityData?.id || target.cityId,
            cityName: target.cityData?.name || target.name || 'Cidade desconhecida',
            mode: expansionMode
        });
        gameMap?.markTerritoryDirty?.();
        gameState?.refreshAIFactionState?.();
        // Cache is invalidated by refresh; warm it once so later faction loops reuse the rebuilt cache.
        gameState?.getAIFactionCityTiles?.(factionId);
        gameState?.updateAIFactionIntelFromWorldState?.({ skipRefresh: true, factionIds: [factionId] });
    }

    processFactionDefense(context, plan) {
        const { threatenedCities, factionId, state, profile } = context;
        if (!threatenedCities.length || !state) return;
        const shouldDefend = plan.primaryFocus === 'defense' || profile.defenseBias > 0.7;
        if (!shouldDefend) return;

        const city = threatenedCities[0];
        if (!city) return;

        const fortified = this.ensureAIFortifiedCity(city);
        if (!fortified) return;

        const stockpile = state.stockpile || (state.stockpile = { gold: 0, manpower: 0 });
        if ((stockpile.gold || 0) >= 55) {
            const town = (typeof HISTORIC_TOWNS !== 'undefined' && Array.isArray(HISTORIC_TOWNS))
                ? HISTORIC_TOWNS.find((t) => t.id === (city.cityData?.id || city.cityId))
                : null;
            if (town) {
                const spawned = gameState.spawnFactionArmyAtTown(town, 'enemy', factionId, 1);
                if (spawned) {
                    stockpile.gold = Math.max(0, stockpile.gold - 55);
                }
            }
        }
    }

    async processUnit(unit, context, plan) {
        if (!unit || unit.currentHealth <= 0) return;

        let nearbyTarget = this.findNearbyTarget(unit, context, plan);
        if (nearbyTarget) {
            this.executeAttack(unit, nearbyTarget);
            return;
        }

        const target = this.findNearestPlayerTarget(unit, context, plan);
        if (target) {
            const nextStep = this.calculateNextStep(unit.position, target.position);
            if (nextStep) {
                const oldPos = { x: unit.position.x, y: unit.position.y };
                const moved = gameState.moveUnit(unit.id, nextStep);
                if (!moved) {
                    // Failed move keeps the unit in place; do a single stationary re-check and exit.
                    nearbyTarget = this.findNearbyTarget(unit, context, plan);
                    if (nearbyTarget) this.executeAttack(unit, nearbyTarget);
                    return;
                }
                if (this.occupiedPositions) {
                    this.occupiedPositions.delete(`${oldPos.x},${oldPos.y}`);
                    this.occupiedPositions.add(`${unit.position.x},${unit.position.y}`);
                }
                nearbyTarget = this.findNearbyTarget(unit, context, plan);
                if (nearbyTarget) this.executeAttack(unit, nearbyTarget);
                return;
            }
        }

        if (plan.primaryFocus === 'defense' && context.threatenedCities.length > 0) {
            const city = context.threatenedCities[0];
            const nextStep = this.calculateNextStep(unit.position, { x: city.x, y: city.y });
            if (nextStep) {
                const oldPos = { x: unit.position.x, y: unit.position.y };
                const moved = gameState.moveUnit(unit.id, nextStep);
                if (moved && this.occupiedPositions) {
                    this.occupiedPositions.delete(`${oldPos.x},${oldPos.y}`);
                    this.occupiedPositions.add(`${unit.position.x},${unit.position.y}`);
                }
            }
        }
    }

    executeAttack(unit, target) {
        console.log(`AI(${unit.faction || 'enemy'}): ${unit.name} atacando ${target.name}`);
        const attackerPos = { x: unit.position.x, y: unit.position.y };
        const defenderPos = { x: target.position.x, y: target.position.y };
        const defenderTile = gameMap.getTile(target.position.x, target.position.y);
        const terrain = defenderTile?.terrain || 'plains';
        const battleType = defenderTile?.cityData
            ? 'siege'
            : (terrain === 'forest' || terrain === 'hills' || terrain === 'mountains' ? 'ambush' : 'field');
        if (typeof audioManager !== 'undefined') audioManager.setContext('combat');
        const result = executeBattle(unit.id, target.id, terrain, battleType, {
            attemptRetreat: true,
            retreatSide: 'defender'
        });
        if (result.success && window.uiManager) {
            window.uiManager.showCombatResult(result);
        }
        if (this.occupiedPositions && result) {
            if (result.attackerDied) {
                this.occupiedPositions.delete(`${attackerPos.x},${attackerPos.y}`);
            }
            if (result.defenderDied) {
                this.occupiedPositions.delete(`${defenderPos.x},${defenderPos.y}`);
            }
        }
    }

    findNearbyTarget(unit, context, plan) {
        const factionId = context?.factionId || this.getFactionIdForUnit(unit);
        if (typeof gameState?.isFactionHostileToPlayer === 'function' && !gameState.isFactionHostileToPlayer(factionId)) {
            return null;
        }
        const unitType = getUnitById(unit.typeId);
        const range = unitType?.stats?.range || 1;
        const profile = context?.profile || this.getPersonalityProfile(this.getFactionIdForUnit(unit));
        const cities = context?.cities || [];

        const candidates = gameState.units.filter((u) => {
            if (!u || u.owner !== 'player') return false;
            const dist = Math.abs(u.position.x - unit.position.x) + Math.abs(u.position.y - unit.position.y);
            return dist <= range;
        });
        if (candidates.length === 0) return null;

        candidates.sort((a, b) => {
            const aScore = this.scorePlayerTargetForFaction(a, cities, profile, plan);
            const bScore = this.scorePlayerTargetForFaction(b, cities, profile, plan);
            return bScore - aScore;
        });
        return candidates[0];
    }

    findNearestPlayerTarget(unit, context, plan) {
        const factionId = context?.factionId || this.getFactionIdForUnit(unit);
        if (typeof gameState?.isFactionHostileToPlayer === 'function' && !gameState.isFactionHostileToPlayer(factionId)) {
            return null;
        }
        const playerUnits = gameState.units.filter((u) => u.owner === 'player');
        const playerCities = context?.playerCities || [];
        const allTargets = [
            ...playerUnits,
            ...playerCities.map((tile) => ({ position: { x: tile.x, y: tile.y }, name: tile.cityData?.name || 'Cidade', cityData: tile.cityData }))
        ];
        if (allTargets.length === 0) return null;

        const profile = context?.profile || this.getPersonalityProfile(this.getFactionIdForUnit(unit));
        const factionCities = context?.cities || [];
        let best = null;
        for (const target of allTargets) {
            const dist = Math.abs(target.position.x - unit.position.x) + Math.abs(target.position.y - unit.position.y);
            const targetScore = this.scorePlayerTargetForFaction(target, factionCities, profile, plan);
            const score = targetScore - dist * (plan?.primaryFocus === 'warfare' ? 1.4 : 1.0);
            if (!best || score > best.score) best = { target, score };
        }
        return best?.target || null;
    }

    scorePlayerTargetForFaction(target, factionCities, profile, plan) {
        const nearestOwnCity = this.minDistanceToAny(target, factionCities);
        const cityWeight = target.cityData ? 16 : 8;
        const threatWeight = Math.max(0, 8 - nearestOwnCity) * profile.defenseBias * 4;
        const warfareBonus = plan?.primaryFocus === 'warfare' ? 8 : 0;
        const opportunisticBonus = (profile.expansionBias > 0.7 && target.cityData) ? 4 : 0;
        return cityWeight + threatWeight + warfareBonus + opportunisticBonus;
    }

    estimateFactionResourcePotential(cities) {
        const totals = { food: 0, wood: 0, stone: 0, iron: 0, rare: 0, totalStrategic: 0 };
        cities.forEach((city) => {
            const nearby = gameMap.getNearbyResourceYields(city.x, city.y, 2);
            Object.keys(totals).forEach((key) => {
                if (key === 'totalStrategic') return;
                totals[key] += nearby[key] || 0;
            });
        });
        totals.totalStrategic = totals.food + totals.wood + totals.stone + totals.iron + totals.rare;
        return totals;
    }

    getActivePlayerThreatUnits() {
        return gameState.units.filter((u) =>
            u.owner === 'player'
            && !u.isCarried
            && Number.isFinite(u.position?.x)
            && Number.isFinite(u.position?.y)
            && u.position.x >= 0
            && u.position.y >= 0
        );
    }

    applyAIFactionAnnexCity(tile, factionId) {
        if (!tile?.cityData) return false;
        if (tile.owner === 'player' || tile.owner === 'enemy') return false;
        tile.owner = 'enemy';
        tile.faction = factionId || tile.faction || 'tribal';
        tile.cityData.historicalCivilization = tile.cityData.historicalCivilization || tile.faction;
        return true;
    }

    ensureAIFortifiedCity(cityTile) {
        if (typeof gameState?.ensureAICityFortification === 'function') {
            return gameState.ensureAICityFortification(cityTile);
        }
        return false;
    }

    minDistanceToAny(targetLike, cityTiles) {
        if (!targetLike?.position || !Array.isArray(cityTiles) || cityTiles.length === 0) return 99;
        let best = 99;
        for (const city of cityTiles) {
            const dist = Math.abs(city.x - targetLike.position.x) + Math.abs(city.y - targetLike.position.y);
            if (dist < best) best = dist;
        }
        return best;
    }

    minDistanceToPlayerUnit(tileOrUnit, playerUnits = null) {
        if (!tileOrUnit) return 99;
        const pos = tileOrUnit.position ? tileOrUnit.position : { x: tileOrUnit.x, y: tileOrUnit.y };
        const activePlayerUnits = Array.isArray(playerUnits) ? playerUnits : this.getActivePlayerThreatUnits();
        if (activePlayerUnits.length === 0) return 99;
        let best = 99;
        activePlayerUnits.forEach((unit) => {
            const dist = Math.abs(unit.position.x - pos.x) + Math.abs(unit.position.y - pos.y);
            if (dist < best) best = dist;
        });
        return best;
    }

    findNearestNeutralCity(fromCity, neutralCities, maxDistance = 99) {
        if (!fromCity || !neutralCities?.length) return null;
        let best = null;
        neutralCities.forEach((city) => {
            const dist = Math.abs(city.x - fromCity.x) + Math.abs(city.y - fromCity.y);
            if (dist > maxDistance) return;
            if (!best || dist < best.dist || (dist === best.dist && (city.importance || 0) > (best.city.importance || 0))) {
                best = { city, dist };
            }
        });
        return best?.city || null;
    }

    findNearestPlayerCity(fromCity, playerCities, maxDistance = 99) {
        if (!fromCity || !playerCities?.length) return null;
        let best = null;
        playerCities.forEach((city) => {
            const dist = Math.abs(city.x - fromCity.x) + Math.abs(city.y - fromCity.y);
            if (dist > maxDistance) return;
            if (!best || dist < best.dist) best = { city, dist };
        });
        return best?.city || null;
    }

    calculateNextStep(current, target) {
        const dx = target.x - current.x;
        const dy = target.y - current.y;

        let nextX = current.x;
        let nextY = current.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            nextX += Math.sign(dx);
        } else {
            nextY += Math.sign(dy);
        }

        // Use pre-built position set for O(1) collision check instead of O(n) units.some().
        const posSet = this.occupiedPositions;
        const isOccupied = (x, y) => posSet ? posSet.has(`${x},${y}`) : gameState.units.some((u) => u.position.x === x && u.position.y === y);

        if (isOccupied(nextX, nextY)) {
            if (nextX !== current.x) {
                nextX = current.x;
                nextY += Math.sign(dy) || (Math.random() > 0.5 ? 1 : -1);
            } else {
                nextY = current.y;
                nextX += Math.sign(dx) || (Math.random() > 0.5 ? 1 : -1);
            }
        }

        nextX = Math.max(0, Math.min(gameMap.width - 1, nextX));
        nextY = Math.max(0, Math.min(gameMap.height - 1, nextY));

        const tile = gameMap.getTile(nextX, nextY);
        if (!tile) return null;
        if (tile.terrain === 'water') return null;

        return { x: nextX, y: nextY };
    }
}

// Global AI instance
const aiManager = new AIManager();
window.aiManager = aiManager;
