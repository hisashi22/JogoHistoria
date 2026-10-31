/**
 * Byzantine Military Units
 * Historically accurate units from 6th-15th century
 */
const UNIT_TYPES = {
    // Infantry Units
    infantry: {
        skutatoi: {
            id: 'skutatoi',
            name: 'Skutatoi',
            type: 'infantry',
            category: 'heavy',
            description: 'Infantaria pesada armada com grandes escudos e lanças',
            era: ['early', 'middle'],
            cost: {
                gold: 80,
                manpower: 50
            },
            upkeep: 5,
            stats: {
                health: 100,
                attack: 12,
                defense: 18,
                movement: 2,
                range: 1
            },
            bonuses: {
                vsInfantry: 1.2,
                vsCavalry: 0.8
            },
            icon: 'skutatoi.png',
            symbol: '🛡️'
        },

        psilos: {
            id: 'psilos',
            name: 'Psilos',
            type: 'infantry',
            category: 'light',
            description: 'Escaramuçadores leves com dardos e fundas',
            era: ['early', 'middle'],
            cost: {
                gold: 40,
                manpower: 30
            },
            upkeep: 2,
            stats: {
                health: 60,
                attack: 8,
                defense: 6,
                movement: 3,
                range: 2
            },
            bonuses: {
                vsInfantry: 1.1,
                terrain: 1.3
            },
            icon: 'psilos.png',
            symbol: '🎯'
        },

        archers: {
            id: 'archers',
            name: 'Arqueiros Bizantinos',
            type: 'infantry',
            category: 'ranged',
            description: 'Arqueiros habilidosos com poderosos arcos compostos',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 60,
                manpower: 40
            },
            upkeep: 3,
            stats: {
                health: 70,
                attack: 14,
                defense: 8,
                movement: 2,
                range: 3
            },
            bonuses: {
                vsInfantry: 1.3,
                vsCavalry: 1.1
            },
            icon: 'archers.png',
            symbol: '🏹'
        },

        varangian: {
            id: 'varangian',
            name: 'Guarda Varegue',
            type: 'infantry',
            category: 'elite',
            description: 'Mercenários nórdicos de elite empunhando machados, guarda pessoal do imperador',
            era: ['middle', 'late'],
            cost: {
                gold: 150,
                manpower: 80
            },
            upkeep: 10,
            stats: {
                health: 140,
                attack: 22,
                defense: 20,
                movement: 2,
                range: 1
            },
            bonuses: {
                vsInfantry: 1.4,
                vsCavalry: 1.2,
                morale: 2.0
            },
            icon: 'varangian.png',
            symbol: '🪓'
        },

        mountain_infantry: {
            id: 'mountain_infantry',
            name: 'Infantaria de Montanha',
            type: 'infantry',
            category: 'mountain',
            description: 'Tropas resistentes treinadas para terreno acidentado e passagens',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 90,
                manpower: 55
            },
            upkeep: 6,
            stats: {
                health: 95,
                attack: 14,
                defense: 16,
                movement: 3,
                range: 1
            },
            bonuses: {
                terrain: 1.5,
                vsInfantry: 1.1
            },
            icon: 'mountain_infantry.png',
            symbol: '🏔️'
        }
    },

    // Cavalry Units
    cavalry: {
        cataphract: {
            id: 'cataphract',
            name: 'Catafractário',
            type: 'cavalry',
            category: 'heavy',
            description: 'Cavalaria blindada superpesada, a elite das forças bizantinas',
            era: ['early', 'middle'],
            cost: {
                gold: 200,
                manpower: 100
            },
            upkeep: 15,
            stats: {
                health: 150,
                attack: 28,
                defense: 24,
                movement: 4,
                range: 1
            },
            bonuses: {
                vsInfantry: 1.5,
                vsCavalry: 1.3,
                charge: 2.0
            },
            icon: 'cataphract.png',
            symbol: '🏇'
        },

        klibanophoroi: {
            id: 'klibanophoroi',
            name: 'Klibanophoroi',
            type: 'cavalry',
            category: 'superheavy',
            description: 'Cavalaria ultrapesada com armadura completa para cavaleiro e cavalo',
            era: ['middle'],
            cost: {
                gold: 250,
                manpower: 120
            },
            upkeep: 20,
            stats: {
                health: 180,
                attack: 32,
                defense: 28,
                movement: 3,
                range: 1
            },
            bonuses: {
                vsInfantry: 1.7,
                vsCavalry: 1.4,
                charge: 2.5,
                arrowResist: 0.5
            },
            icon: 'klibanophoroi.png',
            symbol: '🎖️'
        },

        kavallarioi: {
            id: 'kavallarioi',
            name: 'Kavallarioi',
            type: 'cavalry',
            category: 'medium',
            description: 'Cavalaria média, a espinha dorsal dos exércitos bizantinos',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 100,
                manpower: 60
            },
            upkeep: 8,
            stats: {
                health: 100,
                attack: 18,
                defense: 14,
                movement: 5,
                range: 1
            },
            bonuses: {
                vsInfantry: 1.3,
                vsCavalry: 1.0
            },
            icon: 'kavallarioi.png',
            symbol: '🐎'
        },

        horsearchers: {
            id: 'horsearchers',
            name: 'Arqueiros Montados',
            type: 'cavalry',
            category: 'light',
            description: 'Cavalaria leve com arcos compostos, mestres em táticas de ataque e fuga',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 120,
                manpower: 70
            },
            upkeep: 9,
            stats: {
                health: 80,
                attack: 16,
                defense: 10,
                movement: 6,
                range: 3
            },
            bonuses: {
                vsInfantry: 1.4,
                vsCavalry: 0.9,
                mobility: 1.5
            },
            icon: 'horsearchers.png',
            symbol: '🏇🏹'
        },

        tagmata: {
            id: 'tagmata',
            name: 'Cavalaria Tagmata',
            type: 'cavalry',
            category: 'elite',
            description: 'Regimentos de cavalaria profissional de elite, os melhores do imperador',
            era: ['middle', 'late'],
            cost: {
                gold: 180,
                manpower: 90
            },
            upkeep: 12,
            stats: {
                health: 130,
                attack: 24,
                defense: 20,
                movement: 5,
                range: 1
            },
            bonuses: {
                vsInfantry: 1.4,
                vsCavalry: 1.3,
                morale: 1.5
            },
            icon: 'tagmata.png',
            symbol: '👑'
        },

        camel_riders: {
            id: 'camel_riders',
            name: 'Cavaleiros de Camelo',
            type: 'cavalry',
            category: 'desert',
            description: 'Cavalaria rápida do deserto resiliente a condições áridas',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 130,
                manpower: 65
            },
            upkeep: 9,
            stats: {
                health: 95,
                attack: 17,
                defense: 12,
                movement: 5,
                range: 1
            },
            bonuses: {
                mobility: 1.35,
                vsCavalry: 1.15
            },
            icon: 'camel_riders.png',
            symbol: '🐪'
        },

        war_elephants: {
            id: 'war_elephants',
            name: 'Elefantes de Guerra',
            type: 'cavalry',
            category: 'shock',
            description: 'Tropas de choque massivas com impacto inicial devastador',
            era: ['early', 'middle'],
            cost: {
                gold: 260,
                manpower: 120
            },
            upkeep: 18,
            stats: {
                health: 190,
                attack: 30,
                defense: 20,
                movement: 3,
                range: 1
            },
            bonuses: {
                charge: 2.2,
                vsInfantry: 1.6
            },
            icon: 'war_elephants.png',
            symbol: '🐘'
        }
    },

    // Special Units
    special: {
        greekfire: {
            id: 'greekfire',
            name: 'Sifão de Fogo Grego',
            type: 'special',
            category: 'siege',
            description: 'Devastadora arma incendiária, a arma secreta bizantina',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 300,
                manpower: 150
            },
            upkeep: 25,
            stats: {
                health: 60,
                attack: 40,
                defense: 6,
                movement: 1,
                range: 2
            },
            bonuses: {
                vsBuildings: 2.0,
                vsShips: 3.0,
                areaEffect: true
            },
            icon: 'greekfire.png',
            symbol: '🔥'
        },

        engineers: {
            id: 'engineers',
            name: 'Engenheiros de Cerco',
            type: 'special',
            category: 'siege',
            description: 'Engenheiros especialistas operando equipamentos de cerco',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 150,
                manpower: 80
            },
            upkeep: 10,
            stats: {
                health: 50,
                attack: 30,
                defense: 8,
                movement: 1,
                range: 4
            },
            bonuses: {
                vsBuildings: 2.5,
                vsFortifications: 3.0
            },
            icon: 'engineers.png',
            symbol: '⚙️'
        },

        mangonel: {
            id: 'mangonel',
            name: 'Bateria de Mangonel',
            type: 'special',
            category: 'siege',
            description: 'Artilharia de contrapeso para cercos e bombardeio de campo',
            era: ['middle', 'late'],
            cost: {
                gold: 220,
                manpower: 100
            },
            upkeep: 14,
            stats: {
                health: 70,
                attack: 34,
                defense: 8,
                movement: 1,
                range: 4
            },
            bonuses: {
                vsBuildings: 2.6,
                areaEffect: true
            },
            icon: 'mangonel.png',
            symbol: '☄️'
        },

        priests: {
            id: 'priests',
            name: 'Sacerdotes Ortodoxos',
            type: 'special',
            category: 'support',
            description: 'Líderes religiosos que fornecem moral e cura',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 100,
                manpower: 40
            },
            upkeep: 5,
            stats: {
                health: 40,
                attack: 0,
                defense: 4,
                movement: 2,
                range: 2
            },
            bonuses: {
                moraleBoost: 1.5,
                healingRate: 10
            },
            icon: 'priests.png',
            symbol: '☦️'
        },

        healer: {
            id: 'healer',
            name: 'Curandeiro de Campo',
            type: 'special',
            category: 'support',
            description: 'Unidade de suporte médico dedicada para recuperação rápida no campo de batalha',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 120,
                manpower: 45
            },
            upkeep: 6,
            stats: {
                health: 45,
                attack: 2,
                defense: 5,
                movement: 3,
                range: 1
            },
            bonuses: {
                healingRate: 16,
                moraleBoost: 1.2
            },
            icon: 'healer.png',
            symbol: '🩹'
        },

        caravan: {
            id: 'caravan',
            name: 'Caravana',
            type: 'special',
            category: 'economic',
            description: 'Comboio comercial que impulsiona a renda da cidade quando posicionado nas proximidades',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 95,
                manpower: 30
            },
            upkeep: 2,
            stats: {
                health: 45,
                attack: 2,
                defense: 4,
                movement: 3,
                range: 1
            },
            bonuses: {
                tradeBoost: 1.3
            },
            icon: 'caravan.png',
            symbol: '💰'
        },

        explorer: {
            id: 'explorer',
            name: 'Explorador',
            type: 'special',
            category: 'scout',
            description: 'Especialista em reconhecimento de longo alcance',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 70,
                manpower: 25
            },
            upkeep: 2,
            stats: {
                health: 40,
                attack: 6,
                defense: 5,
                movement: 6,
                range: 1
            },
            bonuses: {
                mobility: 1.6,
                vision: 2
            },
            icon: 'explorer.png',
            symbol: '🧭'
        },

        spy: {
            id: 'spy',
            name: 'Espião',
            type: 'special',
            category: 'intel',
            description: 'Operativo de inteligência secreta com potencial de emboscada',
            era: ['middle', 'late'],
            cost: {
                gold: 120,
                manpower: 20
            },
            upkeep: 3,
            stats: {
                health: 35,
                attack: 10,
                defense: 5,
                movement: 5,
                range: 1
            },
            bonuses: {
                ambush: 1.8
            },
            icon: 'spy.png',
            symbol: '🕵️'
        },

        transport: {
            id: 'transport',
            name: 'Transporte Fluvial',
            type: 'special',
            category: 'transport',
            description: 'Embarcação de suporte para mover homens e suprimentos através da água',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 110,
                manpower: 45
            },
            upkeep: 4,
            stats: {
                health: 75,
                attack: 8,
                defense: 8,
                movement: 5,
                range: 1
            },
            bonuses: {
                waterTraversal: true
            },
            icon: 'transport.png',
            symbol: '🚣'
        },
        civil_engineers: {
            id: 'civil_engineers',
            name: 'Engenheiros',
            type: 'special',
            category: 'infrastructure',
            description: 'Especialistas na construção de estradas e melhoria da infraestrutura urbana',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 120,
                manpower: 60
            },
            upkeep: 5,
            stats: {
                health: 40,
                attack: 2,
                defense: 4,
                movement: 3,
                range: 1
            },
            bonuses: {
                buildRoad: true,
                improveInfra: true
            },
            icon: 'civil_engineers.png',
            symbol: '🛠️'
        }
    },

    naval: {
        dromon: {
            id: 'dromon',
            name: 'Dromon',
            type: 'naval',
            category: 'warship',
            description: 'Galé de guerra bizantina armada para combate naval',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 210,
                manpower: 65
            },
            upkeep: 12,
            stats: {
                health: 130,
                attack: 24,
                defense: 16,
                movement: 6,
                range: 2
            },
            bonuses: {
                vsShips: 1.6,
                waterTraversal: true
            },
            icon: 'dromon.png',
            symbol: '⛵'
        },
        dromon_greekfire: {
            id: 'dromon_greekfire',
            name: 'Dromon de Fogo Grego',
            type: 'naval',
            category: 'warship',
            description: 'Navio de guerra de elite equipado com o letal sifão de Fogo Grego',
            era: ['middle', 'late'],
            cost: {
                gold: 350,
                manpower: 100
            },
            upkeep: 20,
            stats: {
                health: 150,
                attack: 45,
                defense: 20,
                movement: 6,
                range: 3
            },
            bonuses: {
                vsShips: 2.5,
                vsBuildings: 2.0,
                greekFire: true,
                waterTraversal: true
            },
            icon: 'dromon_greekfire.png',
            symbol: '⛵🔥'
        },
        merchant_ship: {
            id: 'merchant_ship',
            name: 'Galé Mercante',
            type: 'naval',
            category: 'transport',
            description: 'Grande embarcação de carga para transporte de mercadorias e tropas',
            era: ['early', 'middle', 'late'],
            cost: {
                gold: 180,
                manpower: 50
            },
            upkeep: 6,
            stats: {
                health: 100,
                attack: 5,
                defense: 10,
                movement: 5,
                range: 1
            },
            bonuses: {
                transportCapacity: 3,
                tradeBoost: 1.2,
                waterTraversal: true
            },
            icon: 'merchant_ship.png',
            symbol: '🚢'
        }
    }
};

const UNIT_UPGRADE_PATHS = {
    skutatoi: ['varangian', 'mountain_infantry'],
    psilos: ['archers', 'explorer'],
    archers: ['horsearchers', 'mangonel'],
    kavallarioi: ['cataphract', 'tagmata'],
    horsearchers: ['tagmata'],
    cataphract: ['klibanophoroi'],
    engineers: ['mangonel'],
    transport: ['merchant_ship'],
    dromon: ['dromon_greekfire'],
    priests: ['healer']
};

const UNIT_LEVEL_GROWTH = {
    infantry: { health: 8, attack: 2, defense: 3 },
    cavalry: { health: 10, attack: 3, defense: 2 },
    special: { health: 6, attack: 2, defense: 2 },
    naval: { health: 12, attack: 3, defense: 3 },
    default: { health: 8, attack: 2, defense: 2 }
};

/**
 * Get all units available for a specific era
 */
function getUnitsByEra(era) {
    const units = [];

    for (const category in UNIT_TYPES) {
        for (const unitId in UNIT_TYPES[category]) {
            const unit = UNIT_TYPES[category][unitId];
            if (unit.era.includes(era)) {
                units.push(unit);
            }
        }
    }

    return units;
}

/**
 * Get a specific unit by ID
 */
function getUnitById(id) {
    for (const category in UNIT_TYPES) {
        if (UNIT_TYPES[category][id]) {
            return UNIT_TYPES[category][id];
        }
    }
    return null;
}

function getUnitGrowthProfile(unitTypeId) {
    const unit = getUnitById(unitTypeId);
    if (!unit) return UNIT_LEVEL_GROWTH.default;
    return UNIT_LEVEL_GROWTH[unit.type] || UNIT_LEVEL_GROWTH.default;
}

function getUnitUpgradePath(unitTypeId) {
    return [...(UNIT_UPGRADE_PATHS[unitTypeId] || [])];
}

function getUnitUpgradeOptions(unit, options = {}) {
    if (!unit) return [];
    const path = getUnitUpgradePath(unit.typeId);
    if (path.length === 0) return [];
    const availableUnits = options.availableUnits instanceof Set ? options.availableUnits : null;
    return path.filter((targetId) => !availableUnits || availableUnits.has(targetId));
}

function getUnitTrainingTurns(unitTypeId, context = {}) {
    const unit = getUnitById(unitTypeId);
    if (!unit) return 0;
    const baseByType = {
        infantry: 0,
        cavalry: 1,
        special: 1,
        naval: 2
    };
    const baseByCategory = {
        // basic infantry categories: immediate recruit
        light: 0,
        heavy: 0,
        ranged: 0,
        // advanced
        elite: 2,
        superheavy: 2,
        siege: 2,
        support: 1,
        scout: 1,
        economic: 1,
        transport: 1,
        warship: 2
    };
    const base = Number.isFinite(unit.trainingTurns)
        ? unit.trainingTurns
        : (baseByCategory[unit.category] ?? baseByType[unit.type] ?? 2);
    const barracksLevel = Math.max(0, Number(context.barracksLevel || 0));
    const recruitmentSpeed = Math.max(1, Number(context.recruitmentSpeed || 1));
    const barracksReduction = Math.min(0.35, barracksLevel * 0.12);
    const leaderReduction = Math.min(0.4, (recruitmentSpeed - 1) * 0.35);
    return Math.max(0, Math.round(base * (1 - barracksReduction - leaderReduction)));
}

function applyUnitPromotion(unit, targetTypeId) {
    const target = getUnitById(targetTypeId);
    if (!unit || !target) return false;

    const maxHealthBefore = Math.max(1, Number(unit.stats?.health || 1));
    const healthRatio = Math.max(0, Math.min(1, Number(unit.currentHealth || 0) / maxHealthBefore));
    const levelBonus = 1 + Math.max(0, Number(unit.level || 1) - 1) * 0.04;

    unit.promotedFrom = unit.typeId;
    unit.typeId = target.id;
    unit.name = target.name;
    unit.type = target.type;
    unit.category = target.category;
    unit.symbol = target.symbol || unit.symbol || '⚔️';
    unit.bonuses = { ...target.bonuses };
    unit.stats = {
        health: Math.max(1, Math.floor((target.stats?.health || 1) * levelBonus)),
        attack: Math.max(1, Math.floor((target.stats?.attack || 1) * levelBonus)),
        defense: Math.max(1, Math.floor((target.stats?.defense || 1) * levelBonus)),
        movement: Math.max(1, Math.floor(target.stats?.movement || 1)),
        range: Math.max(1, Math.floor(target.stats?.range || 1))
    };
    unit.currentHealth = Math.max(1, Math.floor(unit.stats.health * healthRatio));
    unit.currentMovement = unit.stats.movement;
    unit.upgradeHistory = [...(Array.isArray(unit.upgradeHistory) ? unit.upgradeHistory : []), target.id];
    if (typeof gameState?.applyFactionUnitNaming === 'function') {
        gameState.applyFactionUnitNaming(unit, unit.faction);
    }
    return true;
}

function promoteUnitByExperience(unit, options = {}) {
    if (!unit || Number(unit.level || 1) < 3) return false;
    const optionsForUnit = getUnitUpgradeOptions(unit, options);
    if (optionsForUnit.length === 0) return false;
    return applyUnitPromotion(unit, optionsForUnit[0]);
}

/**
 * Get all units of a specific type (infantry, cavalry, special)
 */
function getUnitsByType(type) {
    return UNIT_TYPES[type] ? Object.values(UNIT_TYPES[type]) : [];
}

/**
 * Calculate unit combat effectiveness
 */
function calculateCombatPower(unit, target, terrain = 'plains') {
    let power = unit.stats.attack;

    // Apply bonuses based on target type
    if (target.type === 'infantry' && unit.bonuses.vsInfantry) {
        power *= unit.bonuses.vsInfantry;
    } else if (target.type === 'cavalry' && unit.bonuses.vsCavalry) {
        power *= unit.bonuses.vsCavalry;
    }

    // Apply terrain bonuses
    if (unit.bonuses.terrain && terrain !== 'plains') {
        power *= unit.bonuses.terrain;
    }

    // Apply charge bonus for cavalry
    if (unit.type === 'cavalry' && unit.bonuses.charge) {
        power *= unit.bonuses.charge;
    }

    return Math.floor(power);
}

/**
 * Create a unit instance
 */
function createUnit(unitTypeId, position, owner) {
    const unitType = getUnitById(unitTypeId);
    if (!unitType) return null;

    return {
        id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        typeId: unitTypeId,
        name: unitType.name,
        type: unitType.type,
        category: unitType.category,
        owner: owner,
        position: position,
        stats: { ...unitType.stats },
        currentHealth: unitType.stats.health,
        currentMovement: unitType.stats.movement,
        destination: null,
        automated: false,
        experience: 0,
        level: 1,
        morale: 100,
        symbol: unitType.symbol || '⚔️',
        bonuses: { ...unitType.bonuses },
        promotedFrom: null,
        upgradeHistory: []
    };
}
