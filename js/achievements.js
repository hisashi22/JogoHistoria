/**
 * Achievements System
 * Tracks player accomplishments and awards milestone badges.
 * Achievements persist in localStorage independently of save slots.
 */

// ─── Achievement Definitions ────────────────────────────────────────────────

const ACHIEVEMENT_DEFS = [
    // ── Combat ──────────────────────────────────────────────────────────────
    {
        id: 'first_blood',
        title: 'Primeiro Sangue',
        description: 'Vença sua primeira batalha.',
        icon: '⚔️',
        category: 'combat',
        condition: (s) => s.battlesWon >= 1
    },
    {
        id: 'veteran_commander',
        title: 'Comandante Veterano',
        description: 'Vença 25 batalhas.',
        icon: '🛡️',
        category: 'combat',
        condition: (s) => s.battlesWon >= 25
    },
    {
        id: 'warlord',
        title: 'Senhor da Guerra',
        description: 'Vença 100 batalhas.',
        icon: '🗡️',
        category: 'combat',
        condition: (s) => s.battlesWon >= 100
    },
    {
        id: 'greek_fire',
        title: 'Fogo Grego',
        description: 'Vença uma batalha usando uma unidade de Fogo Grego.',
        icon: '🔥',
        category: 'combat',
        condition: (s) => s.greekFireVictories >= 1
    },
    {
        id: 'naval_supremacy',
        title: 'Supremacia Naval',
        description: 'Vença 10 batalhas navais.',
        icon: '⚓',
        category: 'combat',
        condition: (s) => s.navalBattlesWon >= 10
    },

    // ── Expansion ────────────────────────────────────────────────────────────
    {
        id: 'first_conquest',
        title: 'Primeira Conquista',
        description: 'Capture sua primeira cidade.',
        icon: '🏰',
        category: 'expansion',
        condition: (s) => s.citiesCaptured >= 1
    },
    {
        id: 'empire_builder',
        title: 'Construtor de Impérios',
        description: 'Domine 10 cidades ao mesmo tempo.',
        icon: '🏛️',
        category: 'expansion',
        condition: (s) => s.maxCitiesHeld >= 10
    },
   {
        id: 'reconqueror',
        title: 'De Volta ao Dono',
        description: 'Reconquiste uma cidade que tinha perdido para os inimigos.',
        icon: '🔄',
        category: 'expansion',
        condition: (s) => s.citiesRecaptured >= 1
    },
    {
        id: 'silk_road',
        title: 'Rota da Seda',
        description: 'Domine 3 cidades nas regiões do leste (x > 200).',
        icon: '🐪',
        category: 'expansion',
        condition: (s) => s.easternCitiesHeld >= 3
    },

    // ── Technology ───────────────────────────────────────────────────────────
    {
        id: 'scholar',
        title: 'Erudito',
        description: 'Pesquise sua primeira tecnologia.',
        icon: '📚',
        category: 'technology',
        condition: (s) => s.techResearched >= 1
    },
    {
        id: 'renaissance',
        title: 'Renascença Bizantina',
        description: 'Pesquise todas as tecnologias disponíveis.',
        icon: '🔬',
        category: 'technology',
        condition: (s) => s.totalTechResearched >= Object.keys(TECHNOLOGY_TREE).length
    },
    {
        id: 'master_engineer',
        title: 'Engenheiro Mestre',
        description: 'Construa 5 estradas.',
        icon: '🛤️',
        category: 'technology',
        condition: (s) => s.roadsBuilt >= 5
    },

    // ── Economy ──────────────────────────────────────────────────────────────
    {
        id: 'merchant_prince',
        title: 'Príncipe dos Mercadores',
        description: 'Acumule 10,000 moedas.',
        icon: '💰',
        category: 'economy',
        condition: (s) => s.maxGoldHeld >= 10000
    },
    {
        id: 'trade_empire',
        title: 'Império Comercial',
        description: 'Estabeleça 3 rotas comerciais ativas.',
        icon: '🤝',
        category: 'economy',
        condition: (s) => s.maxTradeRoutes >= 3
    },
    {
        id: 'granary',
        title: 'Celeiro do Leste',
        description: 'Acumule um estoque de 500 de comida.',
        icon: '🌾',
        category: 'economy',
        condition: (s) => s.maxFoodStockpile >= 500
    },

    // ── Diplomacy ────────────────────────────────────────────────────────────
    {
        id: 'peacemaker',
        title: 'Pacificador',
        description: 'Firmar sua primeira trégua.',
        icon: '🕊️',
        category: 'diplomacy',
        condition: (s) => s.trucesEstablished >= 1
    },
    {
        id: 'alliance',
        title: 'Aliança de Nações',
        description: 'Forme 2 alianças ao mesmo tempo.',
        icon: '🤲',
        category: 'diplomacy',
        condition: (s) => s.maxAlliances >= 2
    },

    // ── Progression ──────────────────────────────────────────────────────────
    {
        id: 'survivor',
        title: 'Sobrevivente',
        description: 'Alcance a rodada 50.',
        icon: '⏳',
        category: 'progression',
        condition: (s) => s.maxTurnReached >= 50
    },
    {
        id: 'century',
        title: 'Um Século de Reinado',
        description: 'Alcance o turno 100.',
        icon: '📅',
        category: 'progression',
        condition: (s) => s.maxTurnReached >= 100
    },
    {
        id: 'veteran_unit',
        title: 'Tropa de Elite',
        description: 'Evolua uma unidade até o nível 5.',
        icon: '🌟',
        category: 'progression',
        condition: (s) => s.maxUnitLevel >= 5
    },
    {
        id: 'quest_complete',
        title: 'Missão Cumprida',
        description: 'Conclua sua primeira missão.',
        icon: '📜',
        category: 'progression',
        condition: (s) => s.questsCompleted >= 1
    },
    {
        id: 'all_quests',
        title: 'Cronista',
        description: 'Conclua 10 missões.',
        icon: '📖',
        category: 'progression',
        condition: (s) => s.questsCompleted >= 10
    },

    // ── Victory ──────────────────────────────────────────────────────────────
    {
        id: 'glory_of_constantinople',
        title: 'Glória de Constantinopla',
        description: 'Vença uma campanha.',
        icon: '👑',
        category: 'victory',
        condition: (s) => s.campaignsWon >= 1
    }
];

const EMPIRE_START_TECH_IDS = new Set(['military_logistics', 'naval_architecture', 'cavalry_tactics', 'irrigation_systems']);

// ─── AchievementManager ─────────────────────────────────────────────────────

class AchievementManager {
    constructor() {
        this._storageKey = '500ad_achievements';
        // Unlocked achievement ids (persisted globally, not per-save)
        this.unlocked = new Set();
        // Lifetime stats used for condition evaluation; persisted to localStorage
        // alongside `unlocked` and accumulated across sessions/campaigns.
        this.stats = this._defaultStats();
        this._cityLookupById = null;
        // Track achievement ids whose condition has already thrown once, so
        // _checkAll() logs each failure exactly once per session.
        this._conditionErrorsLogged = new Set();
        this._load();
    }

    _defaultStats() {
        return {
            battlesWon: 0,
            navalBattlesWon: 0,
            greekFireVictories: 0,
            citiesCaptured: 0,
            citiesRecaptured: 0,
            maxCitiesHeld: 0,
            easternCitiesHeld: 0,
            techResearched: 0,
            totalTechResearched: 0,
            roadsBuilt: 0,
            maxGoldHeld: 0,
            maxFoodStockpile: 0,
            maxTradeRoutes: 0,
            trucesEstablished: 0,
            maxAlliances: 0,
            maxTurnReached: 0,
            maxUnitLevel: 0,
            questsCompleted: 0,
            campaignsWon: 0,
            // Set in memory for O(1) membership checks; serialized to an array
            // in _save() and rebuilt from the array in _load().
            playerHeldCityIds: new Set()
        };
    }

    // ── Persistence ──────────────────────────────────────────────────────────

    _load() {
        try {
            const raw = localStorage.getItem(this._storageKey);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (Array.isArray(data.unlocked)) {
                this.unlocked = new Set(data.unlocked.filter(id => typeof id === 'string'));
            }
            if (data.stats && typeof data.stats === 'object') {
                const loaded = { ...data.stats };
                // Migrate old key name → new key. If both keys are present
                // (partial migration from an earlier session), keep whichever
                // value is larger so we never regress the lifetime peak.
                if ('goldEarned' in loaded) {
                    const prev = Number(loaded.maxGoldHeld) || 0;
                    const old = Number(loaded.goldEarned) || 0;
                    loaded.maxGoldHeld = Math.max(prev, old);
                    delete loaded.goldEarned;
                }
                // Rebuild playerHeldCityIds as a Set of strings (it lives on
                // disk as an array). Tolerate the legacy in-memory shape too.
                const rawHeld = loaded.playerHeldCityIds;
                const heldSource = Array.isArray(rawHeld)
                    ? rawHeld
                    : (rawHeld instanceof Set ? [...rawHeld] : []);
                loaded.playerHeldCityIds = new Set(
                    heldSource.filter(id => typeof id === 'string')
                );
                this.stats = { ...this._defaultStats(), ...loaded };
            }
        } catch (e) {
            console.warn('Conquistas: falha ao carregar', e);
        }
    }

    _save() {
        try {
            // JSON can't represent Set; serialize playerHeldCityIds as an array.
            const heldIds = this.stats.playerHeldCityIds;
            const statsToSave = {
                ...this.stats,
                playerHeldCityIds: heldIds instanceof Set ? [...heldIds] : (Array.isArray(heldIds) ? heldIds : [])
            };
            localStorage.setItem(this._storageKey, JSON.stringify({
                unlocked: [...this.unlocked],
                stats: statsToSave
            }));
        } catch (e) {
            console.warn('Conquistas: falha ao salvar', e);
        }
    }

    // ── Stats update helpers ─────────────────────────────────────────────────

    /**
     * Sync live game-state derived stats and check for new unlocks.
     * Call this after any significant game event.
     */
    syncFromGameState() {
        if (typeof gameState === 'undefined' || !gameState.initialized) return;

        const gs = gameState;
        const playerTerritories = Array.isArray(gs.player?.territories) ? gs.player.territories : [];

        // Turn
        this.stats.maxTurnReached = Math.max(this.stats.maxTurnReached, gs.turn || 0);

        // Technologies
        const techIds = Array.isArray(gs.player?.techResearched) ? gs.player.techResearched : [];
        const techCount = techIds.length;

        // Total techs ever held (including free start techs) — used for Byzantine Renaissance
        this.stats.totalTechResearched = Math.max(this.stats.totalTechResearched, techCount);

        // Player-actively-researched techs (excluding free scenario start techs) — used for Scholar
        const freeTechCount = gs.selectedScenario === 'managing_empire'
            ? techIds.filter(id => EMPIRE_START_TECH_IDS.has(id)).length
            : 0;
        this.stats.techResearched = Math.max(this.stats.techResearched, Math.max(0, techCount - freeTechCount));

        // Peak gold ever held (NOT cumulative earnings — condition checks this snapshot)
        const currentGold = gs.player?.resources?.gold || 0;
        this.stats.maxGoldHeld = Math.max(this.stats.maxGoldHeld, currentGold);

        // Food stockpile
        const currentFood = gs.player?.resources?.food || 0;
        this.stats.maxFoodStockpile = Math.max(this.stats.maxFoodStockpile, currentFood);

        // Cities held
        const cityCount = gs.player?.territories?.length || 0;
        this.stats.maxCitiesHeld = Math.max(this.stats.maxCitiesHeld, cityCount);

        // Eastern cities (x > 200 on the 320-wide map)
        // Founded city IDs use format 'founded_${x}_${y}_${turn}' — parse x when lookup misses
        const cityLookup = this._getCityLookupById();
        const easternCount = playerTerritories.reduce((count, cityId) => {
            const city = cityLookup.get(cityId);
            if (city) {
                return count + (typeof city.x === 'number' && city.x > 200 ? 1 : 0);
            }
            if (String(cityId).startsWith('founded_')) {
                const x = Number(String(cityId).split('_')[1]);
                return count + (Number.isFinite(x) && x > 200 ? 1 : 0);
            }
            return count;
        }, 0);
        this.stats.easternCitiesHeld = Math.max(this.stats.easternCitiesHeld, easternCount);

        // Accumulate city IDs ever held by the player (for recapture detection across save/load)
        for (const cityId of playerTerritories) {
            this.stats.playerHeldCityIds.add(cityId);
        }

        // Unit max level
        const maxLevel = (gs.units || [])
            .filter(u => u.owner === 'player')
            .reduce((m, u) => Math.max(m, u.level || 1), 0);
        this.stats.maxUnitLevel = Math.max(this.stats.maxUnitLevel, maxLevel);

        // Trade routes
        const tradeRoutes = gs.diplomacyState?.tradeRoutes?.filter(r => r.active)?.length || 0;
        this.stats.maxTradeRoutes = Math.max(this.stats.maxTradeRoutes, tradeRoutes);

        // Alliances
        const alliances = Object.values(gs.diplomacyState?.factions || {})
            .filter(f => f.status === 'alliance').length;
        this.stats.maxAlliances = Math.max(this.stats.maxAlliances, alliances);

        // Quests completed — history entries use status:'resolved'|'expired', not boolean flags
        const questsDone = (gs.dynamicNarrativeState?.history || [])
            .filter(e => e.status === 'resolved').length;
        this.stats.questsCompleted = Math.max(this.stats.questsCompleted, questsDone);

        this._checkAll();
        this._save();
    }

    /** Record a battle win. Pass the winning unit for type-specific checks. */
    recordBattleWon(winnerUnit = null) {
        this.stats.battlesWon++;
        if (winnerUnit?.type === 'naval') this.stats.navalBattlesWon++;
        if (winnerUnit?.bonuses?.greekFire || (winnerUnit?.typeId && String(winnerUnit.typeId).includes('greekfire'))) {
            this.stats.greekFireVictories++;
        }
        this._checkAll();
        this._save();
    }

    /** Record a city capture. Pass the tile for recapture detection. */
    recordCityCapture(tile = null, oldOwner = null) {
        this.stats.citiesCaptured++;
        const cityId = tile?.cityData?.id || null;
        if (cityId) {
            if (this.stats.playerHeldCityIds.has(cityId)) {
                this.stats.citiesRecaptured++;
            } else {
                this.stats.playerHeldCityIds.add(cityId);
            }
        }
        this._checkAll();
        this._save();
    }

    /** Record a city joining peacefully (not a conquest — no citiesCaptured increment). */
    recordCityJoined(tile = null) {
        const cityId = tile?.cityData?.id || null;
        if (cityId && !this.stats.playerHeldCityIds.has(cityId)) {
            this.stats.playerHeldCityIds.add(cityId);
            this._save();
        }
    }

    /** Update peak gold and food peaks immediately on resource gain. */
    syncResourcePeak() {
        if (typeof gameState === 'undefined' || !gameState.initialized) return;
        const resources = gameState.player?.resources || {};
        let changed = false;
        const gold = Number(resources.gold) || 0;
        const food = Number(resources.food) || 0;
        if (gold > this.stats.maxGoldHeld) { this.stats.maxGoldHeld = gold; changed = true; }
        if (food > this.stats.maxFoodStockpile) { this.stats.maxFoodStockpile = food; changed = true; }
        if (changed) { this._checkAll(); this._save(); }
    }

    /** Record the highest level reached by a player unit immediately after level-up. */
    recordUnitLevel(unitOrLevel) {
        const level = typeof unitOrLevel === 'number'
            ? unitOrLevel
            : Number(unitOrLevel?.level || 0);
        if (!Number.isFinite(level) || level <= this.stats.maxUnitLevel) return;
        this.stats.maxUnitLevel = level;
        this._checkAll();
        this._save();
    }

    /** Reset per-campaign transient state. Call at the start of each new campaign. */
    resetForNewCampaign(startingTerritories = []) {
        const seed = Array.isArray(startingTerritories)
            ? startingTerritories.filter((cityId) => typeof cityId === 'string')
            : [];
        this.stats.playerHeldCityIds = new Set(seed);
        this._save();
    }

    /** Record a road built. */
    recordRoadBuilt() {
        this.stats.roadsBuilt++;
        this._checkAll();
        this._save();
    }

    /** Record a truce established. */
    recordTruceEstablished() {
        this.stats.trucesEstablished++;
        this._checkAll();
        this._save();
    }

    /** Record a campaign win. */
    recordCampaignWon() {
        this.stats.campaignsWon++;
        this._checkAll();
        this._save();
    }

    // ── Unlock logic ─────────────────────────────────────────────────────────

    _checkAll() {
        for (const def of ACHIEVEMENT_DEFS) {
            if (this.unlocked.has(def.id)) continue;
            try {
                if (def.condition(this.stats)) {
                    this._unlock(def);
                }
            } catch (e) {
                // Surface the failure once per achievement id so a broken
                // condition or unexpected stats shape is discoverable from
                // the console without spamming on every check cycle.
                if (!this._conditionErrorsLogged.has(def.id)) {
                    this._conditionErrorsLogged.add(def.id);
                    console.warn(`Erro na condição da conquista "${def.id}":`, e);
                }
            }
        }
    }

    _unlock(def) {
        if (this.unlocked.has(def.id)) return;
        this.unlocked.add(def.id);
        console.log(`Conquista desbloqueada: ${def.title}`);
        this._showToast(def);
    }

    _showToast(def) {
        if (typeof uiManager === 'undefined') return;
        // Use existing notification system with a special achievement type
        const msg = `🏆 Conquista: ${def.icon} ${def.title}`;
        uiManager.showNotification(msg, 'achievement');
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    getAll() {
        return ACHIEVEMENT_DEFS.map(def => ({
            ...def,
            unlocked: this.unlocked.has(def.id)
        }));
    }

    getUnlockedCount() {
        return this.unlocked.size;
    }

    getTotalCount() {
        return ACHIEVEMENT_DEFS.length;
    }

    /** Group achievements by category for the panel. */
    getByCategory() {
        const categories = {};
        for (const def of ACHIEVEMENT_DEFS) {
            if (!categories[def.category]) categories[def.category] = [];
            categories[def.category].push({
                ...def,
                unlocked: this.unlocked.has(def.id)
            });
        }
        return categories;
    }

    _getCityLookupById() {
        if (this._cityLookupById instanceof Map) {
            return this._cityLookupById;
        }
        const lookup = new Map();
        if (typeof HISTORIC_TOWNS !== 'undefined' && Array.isArray(HISTORIC_TOWNS)) {
            HISTORIC_TOWNS.forEach((town) => {
                if (town?.id) {
                    lookup.set(town.id, town);
                }
            });
        }
        this._cityLookupById = lookup;
        return lookup;
    }
}

// Global singleton
const achievementManager = new AchievementManager();
window.achievementManager = achievementManager;
