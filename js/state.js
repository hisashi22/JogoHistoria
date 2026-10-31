/**
 * Game State Management
 * Centralized state for the Byzantine strategy game
 */

const SCENARIOS = {
    building: 'building_civilization',
    empire: 'managing_empire',
};

const CIVILIZATION_ALIASES = {
    byzantine: 'byzantine',
    arab: 'arab',
    bulgar: 'bulgar',
    frank: 'frank',
    sassanid: 'sassanid',
    enemies: 'byzantine',
    contestants: 'byzantine'
};

function stableSerializeForComparison(value) {
    if (Array.isArray(value)) {
        return `[${value.map(stableSerializeForComparison).join(',')}]`;
    }
    if (value && typeof value === 'object') {
        const keys = Object.keys(value).sort();
        return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerializeForComparison(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
}

function isUnsafeStateObjectKey(key) {
    if (typeof isUnsafeObjectKey === 'function') {
        return isUnsafeObjectKey(key);
    }
    return key === '__proto__' || key === 'prototype' || key === 'constructor';
}

const HISTORICAL_TOWN_CONTROL = {
    constantinople: { tribe: 'Romanos Bizantinos', civilization: 'byzantine', stance: 'core' },
    thessalonica: { tribe: 'Gregos Bizantinos', civilization: 'byzantine', stance: 'core' },
    athens: { tribe: 'Gregos Bizantinos', civilization: 'byzantine', stance: 'neutral' },
    preslav: { tribe: 'Búlgaros', civilization: 'bulgar', stance: 'hostile' },
    belgrade: { tribe: 'Eslavos do Sul', civilization: 'bulgar', stance: 'hostile' },
    serdica: { tribe: 'Trácios', civilization: 'byzantine', stance: 'neutral' },
    skopje: { tribe: 'Dardânios', civilization: 'byzantine', stance: 'neutral' },
    nicaea: { tribe: 'Anatólios Bizantinos', civilization: 'byzantine', stance: 'core' },
    antioch: { tribe: 'Cristãos Siríacos', civilization: 'byzantine', stance: 'hostile' },
    iconium: { tribe: 'Gregos Anatólios', civilization: 'byzantine', stance: 'neutral' },
    trebizond: { tribe: 'Gregos Pônticos', civilization: 'byzantine', stance: 'neutral' },
    tbilisi: { tribe: 'Georgianos', civilization: 'sassanid', stance: 'hostile' },
    ancyra: { tribe: 'Anatólios Galácios', civilization: 'byzantine', stance: 'neutral' },
    caesarea: { tribe: 'Capadócios', civilization: 'byzantine', stance: 'neutral' },
    edessa: { tribe: 'Arameus', civilization: 'byzantine', stance: 'hostile' },
    jerusalem: { tribe: 'Comunidades Levantinas', civilization: 'arab', stance: 'neutral' },
    damascus: { tribe: 'Árabes Levantinos', civilization: 'arab', stance: 'hostile' },
    aleppo: { tribe: 'Árabes do Norte da Síria', civilization: 'arab', stance: 'hostile' },
    baghdad: { tribe: 'Abássidas', civilization: 'arab', stance: 'core' },
    ctesiphon: { tribe: 'Persas', civilization: 'sassanid', stance: 'core' },
    mosul: { tribe: 'Assírios', civilization: 'arab', stance: 'hostile' },
    basra: { tribe: 'Árabes Iraquianos', civilization: 'arab', stance: 'core' },
    isfahan: { tribe: 'Persas', civilization: 'sassanid', stance: 'core' },
    rayy: { tribe: 'Daylamitas', civilization: 'sassanid', stance: 'hostile' },
    merv: { tribe: 'Corasânios', civilization: 'sassanid', stance: 'hostile' },
    samarkand: { tribe: 'Sogdianos', civilization: 'sassanid', stance: 'hostile' },
    bukhara: { tribe: 'Sogdianos', civilization: 'sassanid', stance: 'hostile' },
    herat: { tribe: 'Arianos', civilization: 'sassanid', stance: 'hostile' },
    balkh: { tribe: 'Bactrianos', civilization: 'sassanid', stance: 'hostile' },
    kabul: { tribe: 'Xais de Cabul', civilization: 'sassanid', stance: 'hostile' },
    kandahar: { tribe: 'Aracósios', civilization: 'sassanid', stance: 'hostile' },
    multan: { tribe: 'Indo-iranianos Sindi', civilization: 'sassanid', stance: 'neutral' },
    lahore: { tribe: 'Indo-iranianos Panjabi', civilization: 'sassanid', stance: 'neutral' },
    medina: { tribe: 'Árabes do Hejaz', civilization: 'arab', stance: 'core' },
    mecca: { tribe: 'Árabes do Hejaz', civilization: 'arab', stance: 'core' },
    sanaa: { tribe: 'Árabes Iemenitas', civilization: 'arab', stance: 'neutral' },
    aden: { tribe: 'Árabes Iemenitas', civilization: 'arab', stance: 'neutral' },
    alexandria: { tribe: 'Egípcios', civilization: 'byzantine', stance: 'neutral' },
    fustat: { tribe: 'Árabes Egípcios', civilization: 'arab', stance: 'hostile' },
    carthage: { tribe: 'Berberes', civilization: 'frank', stance: 'hostile' },
    leptis_magna: { tribe: 'Líbios', civilization: 'arab', stance: 'neutral' },
    tripoli: { tribe: 'Líbios', civilization: 'arab', stance: 'neutral' },
    cyrene: { tribe: 'Líbios', civilization: 'arab', stance: 'neutral' },
    axum: { tribe: 'Axumitas', civilization: 'byzantine', stance: 'neutral' },
    adulis: { tribe: 'Axumitas', civilization: 'byzantine', stance: 'neutral' },
    dongola: { tribe: 'Núbios', civilization: 'byzantine', stance: 'neutral' },
    rome: { tribe: 'Italo-Romanos', civilization: 'frank', stance: 'hostile' },
    ravenna: { tribe: 'Romanos do Exarcado', civilization: 'byzantine', stance: 'neutral' },
    venice: { tribe: 'Venezianos', civilization: 'frank', stance: 'neutral' },
    milan: { tribe: 'Lombardos', civilization: 'frank', stance: 'hostile' },
    naples: { tribe: 'Italo-Romanos', civilization: 'frank', stance: 'neutral' },
   cartagena: { tribe: 'Visigodos', civilization: 'frank', stance: 'hostile' },
    cordoba: { tribe: 'Romanos Ibéricos', civilization: 'frank', stance: 'hostile' },
    toledo: { tribe: 'Visigodos', civilization: 'frank', stance: 'hostile' },
    massilia: { tribe: 'Galo-Romanos', civilization: 'frank', stance: 'neutral' },
    aachen: { tribe: 'Francos', civilization: 'frank', stance: 'core' },
    paris: { tribe: 'Francos', civilization: 'frank', stance: 'core' },
    london: { tribe: 'Anglo-Saxões', civilization: 'frank', stance: 'neutral' },
    kiev: { tribe: 'Eslavos de Kiev', civilization: 'bulgar', stance: 'neutral' },
    prague: { tribe: 'Boêmios', civilization: 'frank', stance: 'neutral' },
    vienna: { tribe: 'Ávaros', civilization: 'bulgar', stance: 'hostile' }
};

const EMPIRE_CORE_TOWNS = {
    byzantine: ['constantinople', 'thessalonica', 'nicaea', 'iconium', 'antioch', 'ravenna', 'alexandria', 'ancyra', 'caesarea', 'serdica'],
    arab: ['baghdad', 'damascus', 'jerusalem', 'mecca', 'medina', 'fustat', 'sanaa', 'basra', 'aleppo'],
    bulgar: ['preslav', 'kiev', 'belgrade', 'vienna'],
    frank: ['aachen', 'paris', 'rome', 'venice', 'london', 'milan', 'toledo', 'cordoba'],
    sassanid: ['ctesiphon', 'tbilisi', 'isfahan', 'rayy', 'merv', 'samarkand', 'bukhara', 'herat', 'balkh', 'kabul']
};

const CENTURY_EMPIRE_CORE_TOWNS = {
    '6': {
        byzantine: [
            'constantinople', 'thessalonica', 'nicaea', 'ancyra', 'caesarea', 'antioch',
            'alexandria', 'jerusalem', 'ravenna', 'naples', 'carthage', 'cartagena'
        ],
        frank: ['rome', 'milan', 'aachen', 'paris', 'toledo', 'cordoba'],
        bulgar: ['belgrade', 'vienna'],
        arab: ['mecca', 'medina', 'sanaa', 'aden'],
        sassanid: ['ctesiphon', 'isfahan', 'rayy', 'merv', 'herat', 'balkh', 'kabul', 'tbilisi']
    },
    '7': {
        byzantine: ['constantinople', 'thessalonica', 'nicaea', 'ancyra', 'caesarea', 'alexandria', 'ravenna'],
        frank: ['aachen', 'paris', 'rome', 'milan', 'toledo', 'cordoba'],
        bulgar: ['preslav', 'belgrade'],
        arab: ['damascus', 'aleppo', 'fustat', 'mecca', 'medina', 'basra'],
        sassanid: ['ctesiphon', 'isfahan', 'rayy', 'merv', 'herat']
    },
    '10': {
        byzantine: ['constantinople', 'thessalonica', 'nicaea', 'ancyra', 'caesarea', 'iconium', 'antioch', 'trebizond'],
        frank: ['aachen', 'paris', 'rome', 'venice', 'milan', 'massilia'],
        bulgar: ['preslav', 'belgrade', 'serdica', 'skopje', 'kiev'],
        arab: ['baghdad', 'damascus', 'aleppo', 'basra', 'fustat', 'mecca', 'medina'],
        sassanid: ['isfahan', 'rayy', 'merv', 'herat', 'balkh', 'samarkand', 'bukhara']
    },
    '11': {
        byzantine: ['constantinople', 'thessalonica', 'nicaea', 'trebizond', 'athens', 'serdica'],
        frank: ['aachen', 'paris', 'rome', 'venice', 'milan', 'london', 'prague'],
        bulgar: ['preslav', 'belgrade', 'skopje'],
        arab: ['iconium', 'caesarea', 'edessa', 'antioch', 'aleppo', 'damascus', 'baghdad', 'isfahan', 'rayy'],
        sassanid: ['isfahan', 'rayy', 'merv', 'herat', 'samarkand', 'bukhara']
    }
};

const LEADER_START_PROFILES = {
    justinian: {
        startTownId: 'constantinople',
        empireCoreTowns: [
            'constantinople', 'thessalonica', 'nicaea', 'ancyra', 'caesarea', 'antioch',
            'alexandria', 'jerusalem', 'ravenna', 'rome', 'naples', 'carthage', 'cartagena'
        ]
    },
    belisarius: {
        startTownId: 'constantinople',
        empireCoreTowns: [
            'constantinople', 'thessalonica', 'nicaea', 'ancyra', 'caesarea', 'antioch', 'alexandria'
        ]
    },
    totila: {
        startTownId: 'ravenna',
        empireCoreTowns: ['ravenna', 'rome', 'milan', 'naples', 'venice']
    },
    khosrow1: {
        startTownId: 'ctesiphon',
        empireCoreTowns: ['ctesiphon', 'isfahan', 'rayy', 'tbilisi', 'merv', 'herat']
    },
    heraclius: {
        startTownId: 'constantinople',
        empireCoreTowns: ['constantinople', 'thessalonica', 'nicaea', 'ancyra', 'caesarea', 'antioch', 'alexandria', 'ravenna']
    },
    khalid: {
        startTownId: 'damascus',
        empireCoreTowns: ['damascus', 'aleppo', 'jerusalem', 'medina', 'mecca', 'fustat'],
        nomadicBuildStart: true
    },
    basil2: {
        startTownId: 'constantinople',
        empireCoreTowns: ['constantinople', 'thessalonica', 'nicaea', 'ancyra', 'caesarea', 'iconium', 'antioch', 'trebizond', 'serdica']
    },
    samuel: {
        startTownId: 'preslav',
        empireCoreTowns: ['preslav', 'belgrade', 'serdica', 'skopje', 'kiev']
    },
    alexios1: {
        startTownId: 'constantinople',
        empireCoreTowns: ['constantinople', 'thessalonica', 'nicaea', 'trebizond', 'athens']
    },
    alp_arslan: {
        startTownId: 'caesarea',
        empireCoreTowns: ['caesarea', 'iconium', 'edessa', 'aleppo', 'rayy', 'isfahan'],
        nomadicBuildStart: true
    },
    bardas_skleros: {
        startTownId: 'caesarea',
        empireCoreTowns: ['caesarea', 'ancyra', 'iconium', 'edessa', 'trebizond']
    }
};

const CIVILIZATION_CAPITAL_SEATS = {
    byzantine: ['constantinople', 'nicaea', 'thessalonica', 'ravenna', 'rome'],
    arab: ['damascus', 'baghdad', 'jerusalem', 'fustat'],
    bulgar: ['preslav', 'serdica', 'skopje', 'belgrade'],
    frank: ['rome', 'aachen', 'paris', 'milan', 'venice'],
    sassanid: ['ctesiphon', 'isfahan', 'rayy', 'merv']
};

const CENTURY_TOWN_CONTROL_OVERRIDES = {
    '6': {
        ravenna: { civilization: 'frank', stance: 'hostile', tribe: 'Ostrogoths' },
        rome: { civilization: 'frank', stance: 'hostile', tribe: 'Ostrogoths' },
        milan: { civilization: 'frank', stance: 'hostile', tribe: 'Ostrogoths' },
        naples: { civilization: 'byzantine', stance: 'neutral', tribe: 'Italo-Romans' }
    },
    '7': {
        baghdad: { civilization: 'sassanid', stance: 'neutral', tribe: 'Mesopotamians' },
        damascus: { civilization: 'arab', stance: 'core', tribe: 'Levantine Arabs' },
        aleppo: { civilization: 'arab', stance: 'core', tribe: 'North Syrian Arabs' },
        jerusalem: { civilization: 'byzantine', stance: 'neutral', tribe: 'Levantine Communities' },
        fustat: { civilization: 'arab', stance: 'core', tribe: 'Egyptian Arabs' }
    },
    '10': {
        serdica: { civilization: 'bulgar', stance: 'hostile', tribe: 'Bulgars' },
        skopje: { civilization: 'bulgar', stance: 'hostile', tribe: 'South Slavs' },
        thessalonica: { civilization: 'byzantine', stance: 'hostile', tribe: 'Byzantine Greeks' },
        kiev: { civilization: 'bulgar', stance: 'core', tribe: 'Kievan Slavs' }
    },
    '11': {
        iconium: { civilization: 'arab', stance: 'hostile', tribe: 'Turkic settlers' },
        caesarea: { civilization: 'arab', stance: 'hostile', tribe: 'Turkic frontier clans' },
        edessa: { civilization: 'arab', stance: 'hostile', tribe: 'Turkic frontier clans' },
        ancyra: { civilization: 'byzantine', stance: 'hostile', tribe: 'Anatolian Greeks' },
        antioch: { civilization: 'arab', stance: 'hostile', tribe: 'Syrians' }
    }
};

function resolveAppVersion() {
    const raw = (typeof window !== 'undefined') ? window.APP_VERSION : '';
    const version = typeof raw === 'string' ? raw.trim() : '';
    if (/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(version)) {
        return version;
    }
    console.warn('window.APP_VERSION está ausente ou inválida; retornando ao valor padrão 0.0.0');
    return '0.0.0';
}

const SAVE_VERSION = resolveAppVersion();
const EXPLORATION_REGION_IDS = {
    northwest: 'Fronteira Anatólia-Balcânica',
    northeast: 'Marcas Pôntico-Caucásicas',
    southwest: 'Litoral Mediterrâneo-Africano',
    southeast: 'Corredor Levantino-Persa'
};

const TECHNOLOGY_TREE = {
   military_logistics: {
        name: 'Logística Militar',
        description: 'Melhora o suprimento e a movimentação de tropas pelas estradas.',
        cost: { gold: 220, prestige: 30 },
        researchTurns: 2,
        requires: [],
        effects: { movement: 1, manpowerMultiplier: 1.08 },
        unlocks: {
            buildings: ['barracks'],
            buildActions: ['build_fort']
        }
    },
    siegecraft: {
        name: 'Engenharia de Cerco',
        description: 'Doutrina organizada de cerco para assaltos a cidades.',
        cost: { gold: 280, prestige: 35 },
        researchTurns: 3,
        requires: ['military_logistics'],
        effects: { siegeAttackMultiplier: 1.2 },
        unlocks: {
            buildings: ['walls']
        }
    },
    naval_architecture: {
        name: 'Arquitetura Naval',
        description: 'Casco mais forte e movimento naval mais rápido.',
        cost: { gold: 260, prestige: 30 },
        researchTurns: 2,
        requires: [],
        effects: { navalAttackMultiplier: 1.15, navalMovement: 1 },
        unlocks: {
            buildActions: ['build_port'],
            units: ['dromon', 'dromon_greekfire', 'greekfire']
        }
    },
    cavalry_tactics: {
        name: 'Táticas de Cavalaria',
        description: 'Melhora o flanqueio e o impulso de choque.',
        cost: { gold: 240, prestige: 28 },
        researchTurns: 2,
        requires: [],
        effects: { cavalryAttackMultiplier: 1.12 },
        unlocks: {
            units: ['war_elephants']
        }
    },
    irrigation_systems: {
        name: 'Sistemas de Irrigação',
        description: 'Irrigação avançada alimentada por canais para maiores colheitas.',
        cost: { gold: 260, prestige: 28 },
        researchTurns: 2,
        requires: [],
        effects: { foodMultiplier: 1.15 },
        unlocks: {
            buildActions: ['irrigate']
        }
    },
    monastic_scholarship: {
        name: 'Erudição Monástica',
        description: 'Bibliotecas, scriptoria e codificação jurídica.',
        cost: { gold: 320, prestige: 40 },
        researchTurns: 3,
        requires: ['irrigation_systems'],
        effects: { researchDiscount: 0.1, prestigePerTurn: 2, diplomacyAcceptanceBonus: 0.05 },
        unlocks: {
            buildings: ['temple']
        }
    },
    caravan_routes: {
        name: 'Rotas de Caravanas',
        description: 'Corredores comerciais formalizados através do continente.',
        cost: { gold: 300, prestige: 35 },
        researchTurns: 3,
        requires: ['military_logistics'],
        effects: { goldMultiplier: 1.12, tradePostBonus: 2, tradeIncomeMultiplier: 1.15 },
        unlocks: {
            buildings: ['workshop'],
            buildActions: ['build_caravan_camp', 'build_canal']
        }
    }
};

const BUILD_ACTIONS = {
    establish_town: { name: 'Fundar Cidade', gold: 240, manpower: 120, prestige: 12 },
    build_fort: { name: 'Construir Forte', gold: 150, manpower: 90, prestige: 4, requiresTech: 'military_logistics' },
    build_road: { name: 'Construir Estrada', gold: 70, manpower: 40, prestige: 0 },
    establish_monastery: { name: 'Estabelecer Mosteiro / Mesquita', gold: 180, manpower: 60, prestige: 8 },
    build_caravan_camp: { name: 'Construir Acampamento de Caravanas', gold: 130, manpower: 55, prestige: 2, requiresTech: 'caravan_routes' },
    build_port: { name: 'Construir Porto', gold: 170, manpower: 80, prestige: 3, requiresTech: 'naval_architecture' },
    build_farm: { name: 'Construir Fazenda', gold: 75, manpower: 45, prestige: 0 },
    irrigate: { name: 'Irrigar', gold: 90, manpower: 50, prestige: 0, requiresTech: 'irrigation_systems' },
    plant_forest: { name: 'Plantar Floresta', gold: 60, manpower: 35, prestige: 0 },
    build_canal: { name: 'Construir Canal', gold: 210, manpower: 110, prestige: 6, requiresTech: 'caravan_routes' }
};

const CITY_BUILDING_TREE = {
    farm: {
        name: 'Fazendas',
        maxLevel: 3,
        baseCost: { gold: 95, manpower: 50, prestige: 0 },
        buildTurns: 2,
        requires: {}
    },
    barracks: {
        name: 'Quartel',
        maxLevel: 3,
        baseCost: { gold: 130, manpower: 80, prestige: 1 },
        buildTurns: 2,
        requires: { tech: 'military_logistics' }
    },
    mine: {
        name: 'Minas',
        maxLevel: 3,
        baseCost: { gold: 120, manpower: 85, prestige: 1 },
        buildTurns: 2,
        requires: { buildings: { farm: 1 } }
    },
    workshop: {
        name: 'Oficinas',
        maxLevel: 3,
        baseCost: { gold: 150, manpower: 95, prestige: 2 },
        buildTurns: 3,
        requires: { tech: 'caravan_routes', buildings: { mine: 1, barracks: 1 } }
    },
    temple: {
        name: 'Templo',
        maxLevel: 2,
        baseCost: { gold: 165, manpower: 90, prestige: 4 },
        buildTurns: 3,
        requires: { tech: 'monastic_scholarship', buildings: { farm: 1 } }
    },
    walls: {
        name: 'Muralhas',
        maxLevel: 3,
        baseCost: { gold: 185, manpower: 120, prestige: 3 },
        buildTurns: 3,
        requires: { tech: 'siegecraft', buildings: { barracks: 1 } }
    }
};

const RECRUITMENT_UNIT_CATALOG = [
    'skutatoi',
    'archers',
    'kavallarioi',
    'civil_engineers',
    'engineers',
    'mangonel',
    'camel_riders',
    'explorer',
    'spy',
    'caravan',
    'war_elephants',
    'transport',
    'merchant_ship',
    'dromon',
    'dromon_greekfire',
    'greekfire',
    'mountain_infantry',
    'priests',
    'healer'
];

const STRATEGIC_RESOURCE_KEYS = ['food', 'wood', 'stone', 'iron', 'rare'];
const TUTORIAL_MAX_STEP_INDEX = 5;
const CITY_BUILDING_BALANCE = {
    workshopRecruitGoldDiscountPerLevel: 0.06,
    workshopRecruitGoldDiscountCap: 0.24,
    barracksRecruitManpowerDiscountPerLevel: 0.05,
    barracksRecruitManpowerDiscountCap: 0.20,
    barracksRecruitXpPerLevel: 8,
    templeResearchDiscountPerLevel: 0.02,
    templeResearchDiscountCap: 0.18
};
// Global safeguard so stacked discount sources cannot trivialize research costs.
const RESEARCH_DISCOUNT_CAP = 0.55;
const CITY_PRODUCTION_BALANCE = {
    farmFoodBonusPerLevel: 2,
    workshopGoldBonusPerLevel: 2,
    templeGoldBonusPerLevel: 1,
    barracksManpowerBonusPerLevel: 2,
    workshopManpowerBonusPerLevel: 1,
    caravanCampGoldBonusBase: 2,
    portGoldBonus: 2,
    roadsGoldYield: 0.8,
    populationGoldYield: 0.35,
    foodToManpowerYield: 0.35,
    industryToManpowerYield: 0.7,
    infrastructureIndustryManpowerYield: 0.6,
    strategicFoodExtractionMultiplier: 0.6,
    infrastructureTier3ExtractionBonus: 0.25,
    fortificationStoneExtractionBonus: 0.1,
    mineStoneExtractionBonusPerLevel: 0.12,
    wallStoneExtractionBonusPerLevel: 0.05,
    mineIronExtractionBonusPerLevel: 0.12,
    caravanRareExtractionBonus: 0.3
};

function createDefaultTechnologyEffects() {
    return {
        movement: 0,
        foodMultiplier: 1,
        goldMultiplier: 1,
        manpowerMultiplier: 1,
        cavalryAttackMultiplier: 1,
        navalAttackMultiplier: 1,
        siegeAttackMultiplier: 1,
        researchDiscount: 0,
        prestigePerTurn: 0,
        tradePostBonus: 0,
        navalMovement: 0,
        tradeIncomeMultiplier: 1,
        diplomacyAcceptanceBonus: 0
    };
}

function extractStrategicYield(base, multiplier) {
    const safeBase = Math.max(0, Math.floor(Number(base) || 0));
    if (safeBase <= 0) return 0;
    const safeMultiplier = Number(multiplier) || 0;
    const scaled = Math.floor(safeBase * safeMultiplier);
    if (safeMultiplier > 1) {
        // Intentional: any positive multiplier bonus should yield at least +1 net output.
        return Math.max(safeBase + 1, scaled);
    }
    return Math.max(0, scaled);
}

function parseSemver(version) {
    const raw = String(version || '').trim();
    const parts = raw.split('.');
    if (parts.length !== 3) return null;
    const [majorStr, minorStr, patchStr] = parts;
    const major = Number.parseInt(majorStr, 10);
    const minor = Number.parseInt(minorStr, 10);
    const patch = Number.parseInt(patchStr, 10);
    // Enforce canonical numeric components so values like "01" are rejected.
    if (
        !Number.isInteger(major) || String(major) !== majorStr
        || !Number.isInteger(minor) || String(minor) !== minorStr
        || !Number.isInteger(patch) || String(patch) !== patchStr
    ) {
        return null;
    }
    return { major, minor, patch };
}

function isSupportedSaveVersion(version) {
    const parsed = parseSemver(version);
    const current = parseSemver(SAVE_VERSION);
    if (!parsed || !current) return false;
    if (parsed.major !== current.major) return false;
    if (parsed.minor > current.minor) return false;
    if (parsed.minor === current.minor && parsed.patch > current.patch) {
        console.warn(
            `Carregando arquivo de salvamento de uma versão de patch mais recente ${version} (atual ${SAVE_VERSION}); a compatibilidade não é garantida.`
        );
    }
    return true;
}

class GameState {
    constructor() {
        this.initialized = false;
        this.currentScreen = 'loading';
        this.selectedLeader = null;
        this.player = null;
        this.turn = 1;
        this.gameMode = 'campaign'; // campaign, skirmish, tutorial
        this.units = [];
        this.buildings = [];
        this.territories = [];
        this.selectedUnit = null;
        this.isPaused = false;
        this.selectedScenario = SCENARIOS.empire;
        this.aiFactions = {};
        this.aiEvents = [];
        this.gameOverState = null;
        this.diplomacyState = { reputation: 0, factions: {}, tradeRoutes: [] };
        this.exploration = this.createDefaultExplorationState();
        this.tutorialState = this.createDefaultTutorialState();
        this.initializeDynamicNarrativeState();
    }

    createDefaultExplorationState() {
        return {
            totalTilesDiscovered: 0,
            discoveredRegions: {},
            discoveredLandmarks: {}
        };
    }

    createDefaultTutorialState() {
        return {
            active: true,
            skipped: false,
            completed: false,
            stepIndex: 0,
            progress: {
                move: false,
                combat: false,
                build: false,
                diplomacy: false,
                endTurn: false
            }
        };
    }

    ensureTutorialState() {
        if (!this.tutorialState || typeof this.tutorialState !== 'object') {
            this.tutorialState = this.createDefaultTutorialState();
        }
        this.tutorialState.active = Boolean(this.tutorialState.active);
        this.tutorialState.skipped = Boolean(this.tutorialState.skipped);
        this.tutorialState.completed = Boolean(this.tutorialState.completed);
        const rawStepValue = Number(this.tutorialState.stepIndex);
        const rawStep = Number.isFinite(rawStepValue) ? Math.floor(rawStepValue) : 0;
        this.tutorialState.stepIndex = Math.min(this.getTutorialMaxStepIndex(), Math.max(0, rawStep));
        if (!this.tutorialState.progress || typeof this.tutorialState.progress !== 'object') {
            this.tutorialState.progress = {};
        }
        const keys = ['move', 'combat', 'build', 'diplomacy', 'endTurn'];
        keys.forEach((key) => {
            this.tutorialState.progress[key] = Boolean(this.tutorialState.progress[key]);
        });
        return this.tutorialState;
    }

    getTutorialMaxStepIndex() {
        // UI tutorial definitions are the authoritative source when available.
        const steps = (typeof window !== 'undefined'
            && window.uiManager
            && typeof window.uiManager.getTutorialSteps === 'function')
            ? window.uiManager.getTutorialSteps()
            : null;
        if (Array.isArray(steps) && steps.length > 0) {
            return steps.length - 1;
        }
        return TUTORIAL_MAX_STEP_INDEX;
    }

    ensureExplorationState() {
        if (!this.exploration || typeof this.exploration !== 'object') {
            this.exploration = this.createDefaultExplorationState();
        }
        if (!Number.isFinite(this.exploration.totalTilesDiscovered)) this.exploration.totalTilesDiscovered = 0;
        if (!this.exploration.discoveredRegions || typeof this.exploration.discoveredRegions !== 'object') {
            this.exploration.discoveredRegions = {};
        }
        if (!this.exploration.discoveredLandmarks || typeof this.exploration.discoveredLandmarks !== 'object') {
            this.exploration.discoveredLandmarks = {};
        }
        return this.exploration;
    }

    getRegionIdForTile(tile) {
        if (!tile || !gameMap) return null;
        const xBand = tile.x < gameMap.width / 2 ? 'west' : 'east';
        const yBand = tile.y < gameMap.height / 2 ? 'north' : 'south';
        if (xBand === 'west' && yBand === 'north') return 'northwest';
        if (xBand === 'east' && yBand === 'north') return 'northeast';
        if (xBand === 'west' && yBand === 'south') return 'southwest';
        return 'southeast';
    }

    processExplorationDiscoveries(newlyExploredTiles = [], options = {}) {
        const grantRewards = options.grantRewards !== false;
        if (!Array.isArray(newlyExploredTiles) || newlyExploredTiles.length === 0) return null;
        if (!gameMap) return null;

        const exploration = this.ensureExplorationState();
        const uniqueKeys = new Set();
        const uniqueTiles = [];
        newlyExploredTiles.forEach((entry) => {
            if (!Number.isInteger(entry?.x) || !Number.isInteger(entry?.y)) return;
            const key = `${entry.x}_${entry.y}`;
            if (uniqueKeys.has(key)) return;
            uniqueKeys.add(key);
            uniqueTiles.push(entry);
        });
        if (uniqueTiles.length === 0) return null;

        exploration.totalTilesDiscovered += uniqueTiles.length;
        const discoveredRegions = [];
        const discoveredLandmarks = [];

        uniqueTiles.forEach(({ x, y }) => {
            const tile = gameMap.getTile(x, y);
            if (!tile) return;

            const regionId = this.getRegionIdForTile(tile);
            if (regionId && !exploration.discoveredRegions[regionId]) {
                exploration.discoveredRegions[regionId] = true;
                discoveredRegions.push(regionId);
            }

            if (tile.cityData && (tile.cityData.kind === 'capital' || (tile.importance || 0) >= 8 || Boolean(tile.cityData.wonder))) {
                const landmarkId = tile.cityData.id || `${x}_${y}`;
                if (!exploration.discoveredLandmarks[landmarkId]) {
                    exploration.discoveredLandmarks[landmarkId] = true;
                    discoveredLandmarks.push({
                        id: landmarkId,
                        name: tile.cityData.name || `Landmark ${x},${y}`
                    });
                }
            }
        });

        if (!grantRewards) {
            return {
                tiles: uniqueTiles.length,
                regions: discoveredRegions,
                landmarks: discoveredLandmarks
            };
        }

        const goldReward = (discoveredRegions.length * 40) + (discoveredLandmarks.length * 120);
        const manpowerReward = (discoveredRegions.length * 20) + (discoveredLandmarks.length * 50);
        const prestigeReward = (discoveredRegions.length * 2) + (discoveredLandmarks.length * 7);
        if (goldReward > 0 || manpowerReward > 0 || prestigeReward > 0) {
            this.addResources(goldReward, manpowerReward, prestigeReward);
        }

       if (window.uiManager) {
            discoveredRegions.forEach((regionId) => {
                const label = EXPLORATION_REGION_IDS[regionId] || regionId;
                uiManager.showNotification(`Região descoberta: ${label}`, 'info');
            });
            discoveredLandmarks.forEach((landmark) => {
                uiManager.showNotification(`Marco descoberto: ${landmark.name}`, 'success');
            });
            if (goldReward > 0 || manpowerReward > 0 || prestigeReward > 0) {
                uiManager.showNotification(
                    `Recompensas de exploração: +${goldReward} ouro, +${manpowerReward} mão de obra, +${prestigeReward} prestígio`,
                    'success'
                );
            }
        }

        return {
            tiles: uniqueTiles.length,
            regions: discoveredRegions,
            landmarks: discoveredLandmarks,
            rewards: { gold: goldReward, manpower: manpowerReward, prestige: prestigeReward }
        };
    }

    refreshPlayerVisibility(options = {}) {
        if (!gameMap || typeof gameMap.recalculatePlayerVision !== 'function') return null;
        const newlyExplored = gameMap.recalculatePlayerVision(this);
        const discovery = this.processExplorationDiscoveries(newlyExplored, options);
        if (!options.suppressRender) {
            gameMap.requestRender();
        }
        return discovery;
    }

    revealVisibilityFromUnitStep(unit, options = {}) {
        if (!gameMap || !unit || unit.owner !== 'player') return null;
        if (!Number.isFinite(unit.position?.x) || !Number.isFinite(unit.position?.y)) return null;
        const radius = typeof gameMap.getUnitVisionRadius === 'function'
            ? gameMap.getUnitVisionRadius(unit)
            : 3;
        const newlyExplored = (typeof gameMap.revealArea === 'function')
            ? gameMap.revealArea(unit.position.x, unit.position.y, radius, { markVisible: true })
            : [];
        const discovery = this.processExplorationDiscoveries(newlyExplored, options);
        if (!options.suppressRender) {
            gameMap.requestRender();
            if (typeof minimap !== 'undefined' && minimap && typeof minimap.render === 'function') {
                minimap.render();
            }
        }
        return discovery;
    }

    /**
     * Initialize a new game with selected leader, century, faction, and scenario
     */
    initializeGame(leaderId, century = '6', faction = 'byzantine', scenario = SCENARIOS.empire, historicalScenario = null) {
        const leader = getLeaderById(leaderId);
        if (!leader) {
            console.error('Líder não encontrado:', leaderId);
            return false;
        }
        if (!gameMap) {
            console.error('Mapa não inicializado antes de iniciar o jogo');
            return false;
        }

        const civilization = this.resolveCivilization(faction, leader);
        this.selectedLeader = leader;
        this.selectedCentury = century;
        this.selectedFaction = civilization;
        this.selectedScenario = scenario;

        this.player = {
            name: leader.name,
            leaderId: leaderId,
            faction: civilization,
            resources: { ...leader.startingResources },
            bonuses: { ...leader.bonuses },
            territories: [], // Populated during unit creation
            unitsOwned: [],
            buildingsOwned: [],
            techResearched: [],
            activeResearch: null,
            techEffects: createDefaultTechnologyEffects()
        };
        this.ensureStrategicResourceStockpile();

        this.turn = 1;
        this.gameOverState = null;
        this.units = [];
        this.buildings = [];
        this.aiFactions = {};
        this.aiEvents = [];
        this.diplomacyState = { reputation: 0, factions: {}, tradeRoutes: [] };
        this.exploration = this.createDefaultExplorationState();
        this.tutorialState = this.createDefaultTutorialState();
        this.initializeDynamicNarrativeState();
        this.initializeDiplomacyState();
        if (historicalScenario) {
            // Clear any stale scenario metadata from a previous run before applying the new one.
            this.activeScenario = null;
            // Historical battle — decorate map tiles with historical data but leave all towns neutral.
            // Forces are placed exclusively by ScenarioLoader.applyScenario() after init.
            this.setupScenarioTowns(civilization, SCENARIOS.building);
            // Revoke all city ownership so every town starts neutral regardless of setupScenarioTowns result.
            (gameMap?.getCityTiles() || []).forEach(tile => {
                tile.owner = 'neutral';
                tile.faction = tile.cityData?.historicalCivilization || null;
            });
            this.player.territories = [];
            // Reset fog so setupScenarioTowns reveal side-effects don't expose the map before units are placed.
            if (typeof gameMap?.initializeFogOfWar === 'function') gameMap.initializeFogOfWar();
        } else {
            this.activeScenario = null;
            this.setupScenarioTowns(civilization, scenario);
            if (scenario === SCENARIOS.empire) {
                const empireStartTechs = [
                    'military_logistics',
                    'naval_architecture',
                    'cavalry_tactics',
                    'irrigation_systems'
                ];
                empireStartTechs.forEach((techId) => {
                    if (!this.player.techResearched.includes(techId)) {
                        this.player.techResearched.push(techId);
                        this.applyTechnologyEffects(TECHNOLOGY_TREE[techId]?.effects || {});
                    }
                });
                this.seedAdvancedEmpireInfrastructure();
            }
            this.createStartingUnits(civilization, scenario);
            this.createEnemyUnits(scenario);
        }
        this.refreshAIFactionState();
        this.refreshPlayerVisibility({ grantRewards: false });
        gameMap.markTerritoryDirty();
        gameMap.requestRender();

        if (typeof achievementManager !== 'undefined') achievementManager.resetForNewCampaign(this.player.territories);

        this.initialized = true;
        return true;
    }

    initializeDiplomacyState() {
        this.diplomacyState = this.diplomacyState && typeof this.diplomacyState === 'object'
            ? this.diplomacyState
            : {};
        if (!Number.isFinite(this.diplomacyState.reputation)) this.diplomacyState.reputation = 0;
        if (!this.diplomacyState.factions || typeof this.diplomacyState.factions !== 'object') this.diplomacyState.factions = {};
        if (!Array.isArray(this.diplomacyState.tradeRoutes)) this.diplomacyState.tradeRoutes = [];
        this.diplomacyState.reputation = Math.max(-100, Math.min(100, Math.floor(this.diplomacyState.reputation)));
    }

    getPlayerFactionId() {
        const rawFaction = this.player?.faction || this.selectedFaction || 'byzantine';
        return CIVILIZATION_ALIASES[rawFaction] || rawFaction;
    }

    getKnownAIFactions() {
        const ids = new Set(Object.keys(this.aiFactions || {}));
        this.units.forEach((unit) => {
            if (unit?.owner === 'enemy') ids.add(unit.faction || 'tribal');
        });
        (gameMap?.getCityTiles('enemy') || []).forEach((tile) => {
            const factionId = this.resolveAIFactionForTile(tile, 'tribal');
            if (typeof factionId === 'string' && factionId) ids.add(factionId);
        });
        ids.delete('player');
        ids.delete('neutral');
        ids.delete('');
        return [...ids].filter((id) => typeof id === 'string' && id);
    }

    hasEnemyPresenceForFaction(factionId) {
        const id = factionId || 'tribal';
        const enemyUnits = Array.isArray(this.units)
            ? this.units.some((unit) => unit?.owner === 'enemy' && (unit.faction || 'tribal') === id)
            : false;
        if (enemyUnits) return true;
        return (gameMap?.getCityTiles('enemy') || []).some((tile) => this.resolveAIFactionForTile(tile, 'tribal') === id);
    }

    getDiplomacyFactionLabel(factionId, options = {}) {
        const id = factionId || 'tribal';
        const labels = {
            byzantine: 'Byzantine faction',
            arab: 'Arab faction',
            bulgar: 'Bulgar faction',
            frank: 'Frankish faction',
            sassanid: 'Sassanid faction'
        };
        if (options.sameCivilizationRival && labels[id]) return labels[id];
        return this.getFactionDisplayName(id);
    }

    ensureDiplomacyFactionState(factionId) {
        this.initializeDiplomacyState();
        const id = factionId || 'tribal';
        if (!this.diplomacyState.factions[id]) {
            this.diplomacyState.factions[id] = {
                status: 'war',
                trust: 35,
                tradeAgreement: false,
                lastChangedTurn: this.turn
            };
        }
        return this.diplomacyState.factions[id];
    }

    getFactionDiplomacyStatus(factionId) {
        return this.ensureDiplomacyFactionState(factionId).status || 'war';
    }

    isFactionHostileToPlayer(factionId) {
        const status = this.getFactionDiplomacyStatus(factionId);
        return status === 'war';
    }

    resolveUnitFactionForDiplomacy(unit) {
        if (!unit || typeof unit !== 'object') return 'tribal';
        if (unit.owner === 'player') return this.getPlayerFactionId();
        if (typeof unit.faction === 'string' && unit.faction) return unit.faction;
        if (unit.position && gameMap) {
            const tile = gameMap.getTile(unit.position.x, unit.position.y);
            if (tile) return this.resolveAIFactionForTile(tile, 'tribal');
        }
        return unit.owner === 'enemy' ? 'tribal' : 'neutral';
    }

    canUnitsEngage(attacker, defender) {
        if (!attacker || !defender) {
            return { allowed: false, reason: 'Invalid battle participants.' };
        }
        if (attacker.owner === defender.owner) {
            return { allowed: false, reason: 'Cannot attack allied forces.' };
        }
        const attackerIsPlayer = attacker.owner === 'player';
        const defenderIsPlayer = defender.owner === 'player';
        if (!attackerIsPlayer && !defenderIsPlayer) {
            return { allowed: true };
        }

        const enemyUnit = attackerIsPlayer ? defender : attacker;
        const enemyFactionId = this.resolveUnitFactionForDiplomacy(enemyUnit);
        if (!this.isFactionHostileToPlayer(enemyFactionId)) {
            const factionName = this.getFactionDisplayName(enemyFactionId);
            return {
                allowed: false,
                reason: `${factionName} não está em guerra com você. Declare guerra antes de atacar.`
            };
        }
        return { allowed: true };
    }

    canAssaultFort(attacker, tile) {
        if (!attacker || !tile?.fort || tile.fort.owner === attacker.owner) {
            return { allowed: true };
        }
        const attackerIsPlayer = attacker.owner === 'player';
        const defenderIsPlayer = tile.fort.owner === 'player';
        if (!attackerIsPlayer && !defenderIsPlayer) {
            return { allowed: true };
        }
        const enemyFactionId = this.resolveAIFactionForTile(tile, 'tribal');
        if (!this.isFactionHostileToPlayer(enemyFactionId)) {
            const factionName = this.getFactionDisplayName(enemyFactionId);
                return {
                    allowed: false,
                    reason: `${factionName} não está em guerra com você. Declare guerra antes de atacar fortificações.`
                };
        }
        return { allowed: true };
    }

    ensureCityBuildingState(cityTile) {
        if (!cityTile?.cityData) return null;
        const cityData = cityTile.cityData;
        if (!cityData.buildings || typeof cityData.buildings !== 'object') {
            cityData.buildings = {};
        }
        Object.keys(CITY_BUILDING_TREE).forEach((buildingId) => {
            const rawLevel = Number(cityData.buildings[buildingId] || 0);
            const maxLevel = CITY_BUILDING_TREE[buildingId]?.maxLevel ?? Number.POSITIVE_INFINITY;
            cityData.buildings[buildingId] = Math.min(maxLevel, Math.max(0, Math.floor(rawLevel)));
        });
        if (!cityData.construction || typeof cityData.construction !== 'object') {
            cityData.construction = null;
        }
        if (typeof cityData.autoBuildEnabled !== 'boolean') {
            cityData.autoBuildEnabled = false;
        }
        if (!Array.isArray(cityData.trainingQueue)) {
            cityData.trainingQueue = [];
        } else {
            const sanitizedQueue = [];
            for (const project of cityData.trainingQueue) {
                if (!project || typeof project !== 'object' || typeof project.unitTypeId !== 'string') {
                    continue;
                }
                if (typeof project.id !== 'string' || !project.id) {
                    project.id = `train_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                }

                const turnsRemainingRaw = Number(project.turnsRemaining);
                project.turnsRemaining = Math.max(0, Math.floor(Number.isFinite(turnsRemainingRaw) ? turnsRemainingRaw : 0));

                const totalTurnsRaw = Number(project.totalTurns ?? project.turnsRemaining ?? 1);
                project.totalTurns = Math.max(1, Math.floor(Number.isFinite(totalTurnsRaw) ? totalTurnsRaw : 1));

                const queuedTurnRaw = Number(project.queuedTurn ?? this.turn ?? 0);
                project.queuedTurn = Math.max(0, Math.floor(Number.isFinite(queuedTurnRaw) ? queuedTurnRaw : 0));

                sanitizedQueue.push(project);
            }
            cityData.trainingQueue = sanitizedQueue;
        }
        return cityData;
    }

    getCityBuildingLevel(cityTile, buildingId) {
        const cityData = this.ensureCityBuildingState(cityTile);
        if (!cityData || !buildingId) return 0;
        return Math.max(0, Number(cityData.buildings?.[buildingId] || 0));
    }

    getAllCityBuildingLevels(cityTile) {
        return {
            farm: this.getCityBuildingLevel(cityTile, 'farm'),
            barracks: this.getCityBuildingLevel(cityTile, 'barracks'),
            mine: this.getCityBuildingLevel(cityTile, 'mine'),
            workshop: this.getCityBuildingLevel(cityTile, 'workshop'),
            temple: this.getCityBuildingLevel(cityTile, 'temple'),
            walls: this.getCityBuildingLevel(cityTile, 'walls')
        };
    }

    getTotalCityBuildingLevel(buildingId, owner = 'player') {
        const cities = gameMap?.getCityTiles(owner) || [];
        return cities.reduce((sum, tile) => sum + this.getCityBuildingLevel(tile, buildingId), 0);
    }

    getCityBuildingUpgradeCost(buildingId, targetLevel) {
        const def = CITY_BUILDING_TREE[buildingId];
        if (!def) return null;
        const levelScale = 1 + ((Math.max(1, targetLevel) - 1) * 0.5);
        return {
            gold: Math.max(1, Math.floor((def.baseCost.gold || 0) * levelScale)),
            manpower: Math.max(1, Math.floor((def.baseCost.manpower || 0) * levelScale)),
            prestige: Math.max(0, Math.floor((def.baseCost.prestige || 0) * levelScale))
        };
    }

    getCityBuildingTurns(buildingId, targetLevel) {
        const def = CITY_BUILDING_TREE[buildingId];
        if (!def) return 0;
        const extra = Math.max(0, Math.floor(targetLevel) - 1);
        return Math.max(1, Math.floor((def.buildTurns || 1) + extra));
    }

    getCityBuildingOptions(cityTile) {
        if (!cityTile?.cityData) return [];
        const cityData = this.ensureCityBuildingState(cityTile);
        const researched = new Set(this.player?.techResearched || []);
        const activeConstruction = cityData?.construction || null;
        return Object.entries(CITY_BUILDING_TREE).map(([buildingId, def]) => {
            const currentLevel = this.getCityBuildingLevel(cityTile, buildingId);
            const nextLevel = currentLevel < def.maxLevel ? (currentLevel + 1) : null;
            const reasons = [];
            let available = true;

            if (currentLevel >= def.maxLevel) {
                available = false;
                reasons.push('Max level reached');
            }
            if (def.requires?.tech && !researched.has(def.requires.tech)) {
                available = false;
                const techName = TECHNOLOGY_TREE[def.requires.tech]?.name || def.requires.tech;
                reasons.push(`Requires ${techName}`);
            }
            if (def.requires?.buildings) {
                Object.entries(def.requires.buildings).forEach(([requiredId, minLevel]) => {
                    if (this.getCityBuildingLevel(cityTile, requiredId) < minLevel) {
                        available = false;
                        const requiredName = CITY_BUILDING_TREE[requiredId]?.name || requiredId;
                        reasons.push(`Requires ${requiredName} L${minLevel}`);
                    }
                });
            }
            if (activeConstruction) {
                available = false;
                reasons.push(`Construção ativa: ${activeConstruction.name} (${activeConstruction.turnsRemaining} turnos). Apenas um projeto de cidade pode ser executado por vez.`);
            }

            const cost = nextLevel ? this.getCityBuildingUpgradeCost(buildingId, nextLevel) : null;
            const turns = nextLevel ? this.getCityBuildingTurns(buildingId, nextLevel) : null;
            const resources = this.player?.resources || {};
            const missing = [];
            if (cost && (resources.gold || 0) < cost.gold) missing.push(`${cost.gold - (resources.gold || 0)} gold`);
            if (cost && (resources.manpower || 0) < cost.manpower) missing.push(`${cost.manpower - (resources.manpower || 0)} manpower`);
            if (cost && (resources.prestige || 0) < cost.prestige) missing.push(`${cost.prestige - (resources.prestige || 0)} prestige`);
            if (missing.length > 0) {
                available = false;
                reasons.push(`Missing ${missing.join(', ')}`);
            }

            return {
                id: buildingId,
                name: def.name,
                currentLevel,
                nextLevel,
                maxLevel: def.maxLevel,
                cost,
                turns,
                available,
                reasons
            };
        });
    }

    applyCityBuildingCompletion(cityTile, buildingId, level) {
        if (!cityTile?.cityData) return;
        const cityData = cityTile.cityData;
        const production = cityData.production || (cityData.production = { food: 0, industry: 0, gold: 0 });
        const infra = cityData.infrastructure || (cityData.infrastructure = { roads: 1, agriculture: 1, industry: 1 });

        if (buildingId === 'farm') {
            infra.agriculture = Math.min(10, (infra.agriculture || 0) + 1);
            production.food += 1;
        } else if (buildingId === 'barracks') {
            cityData.garrison = (cityData.garrison || 0) + 1;
            cityData.trainingGround = true;
            production.industry += 1;
        } else if (buildingId === 'mine') {
            infra.industry = Math.min(10, (infra.industry || 0) + 1);
            production.industry += 1;
        } else if (buildingId === 'workshop') {
            infra.industry = Math.min(10, (infra.industry || 0) + 1);
            production.gold += 1;
        } else if (buildingId === 'temple') {
            if (!cityData.monastery) {
                const prestigeGain = 2 + level;
                if (this.player && this.player.resources) {
                    this.player.resources.prestige = (this.player.resources.prestige || 0) + prestigeGain;
                }
            }
            cityData.monastery = true;
            production.gold += 1;
        } else if (buildingId === 'walls') {
            cityData.fortLevel = (cityData.fortLevel || 0) + 1;
            cityData.defenseBonus = (cityData.defenseBonus || 0) + 0.12;
            cityData.garrison = (cityData.garrison || 0) + 1;
        }
    }

    startCityBuildingProject(cityTile, buildingId) {
        const isPlayerControlled = cityTile && (
            cityTile.owner === 'player' ||
            gameMap?.getTerritoryOwnerAt(cityTile.x, cityTile.y) === 'player'
        );
        if (!cityTile?.cityData || !isPlayerControlled) {
            return { success: false, message: 'A construção na cidade requer uma cidade pertencente ao jogador.' };
        }
        const option = this.getCityBuildingOptions(cityTile).find((entry) => entry.id === buildingId);
        if (!option) return { success: false, message: 'Edificação de cidade desconhecida.' };
        if (!option.available) return { success: false, message: option.reasons.join('; ') || 'Construção indisponível.' };

        if (!option.nextLevel || !option.cost) {
            return { success: false, message: 'Nível de atualização não disponível para essa construção.' };
        }

        // Defensive re-check: costs were validated in options, but we validate again to avoid stale UI/race conditions.
        if (!this.spendResources(option.cost.gold, option.cost.manpower, option.cost.prestige || 0)) {
            return { success: false, message: `Precisa de ${option.cost.gold}g/${option.cost.manpower}m/${option.cost.prestige || 0}p` };
        }

        const cityData = this.ensureCityBuildingState(cityTile);
        if (cityTile.owner !== 'player') {
            cityTile.owner = 'player';
            gameMap?.markTerritoryDirty();
        }
        cityData.construction = {
            id: buildingId,
            name: option.name,
            targetLevel: option.nextLevel,
            turnsRemaining: option.turns,
            totalTurns: option.turns,
            startedTurn: this.turn
        };
        return {
            success: true,
            buildingId,
            buildingName: option.name,
            targetLevel: option.nextLevel,
            turns: option.turns
        };
    }

    processCityConstructionTurn() {
        const cities = gameMap?.getCityTiles('player') || [];
        const completed = [];
        cities.forEach((cityTile) => {
            const cityData = this.ensureCityBuildingState(cityTile);
            if (!cityData?.construction) return;
            const project = cityData.construction;
            const hasValidStartedTurn = Number.isFinite(project.startedTurn);
            // By design, construction does not tick down on the same turn it starts.
            if (hasValidStartedTurn && project.startedTurn >= this.turn) {
                project.turnsRemaining = Math.max(1, project.turnsRemaining || project.totalTurns || 1);
                return;
            }
            // For legacy/corrupted states, normalize invalid countdown values before ticking.
            if (!Number.isFinite(project.turnsRemaining) || project.turnsRemaining <= 0) {
                project.turnsRemaining = Math.max(1, project.totalTurns || 1);
            }
            cityData.construction.turnsRemaining = Math.max(0, (cityData.construction.turnsRemaining || 0) - 1);
            if (cityData.construction.turnsRemaining > 0) return;
            cityData.buildings[project.id] = Math.max(cityData.buildings[project.id] || 0, project.targetLevel || 1);
            this.applyCityBuildingCompletion(cityTile, project.id, project.targetLevel || 1);
            cityData.construction = null;
            completed.push({
                cityName: cityTile.cityData?.name || `${cityTile.x},${cityTile.y}`,
                buildingName: project.name,
                level: project.targetLevel || cityData.buildings[project.id]
            });
        });
        if (completed.length > 0 && window.uiManager) {
            completed.forEach((entry) => {
                uiManager.showNotification(
                    `${entry.cityName}: ${entry.buildingName} atualizado para N${entry.level}`,
                    'success'
                );
            });
        }
        return completed;
    }

    getRecruitmentCost(unitTypeId, cityTile = null) {
        const unitType = getUnitById(unitTypeId);
        if (!unitType) return null;
        const barracksLevel = this.getCityBuildingLevel(cityTile, 'barracks');
        const workshopLevel = this.getCityBuildingLevel(cityTile, 'workshop');
        const goldDiscount = Math.min(
            CITY_BUILDING_BALANCE.workshopRecruitGoldDiscountCap,
            workshopLevel * CITY_BUILDING_BALANCE.workshopRecruitGoldDiscountPerLevel
        );
        const manpowerDiscount = Math.min(
            CITY_BUILDING_BALANCE.barracksRecruitManpowerDiscountCap,
            barracksLevel * CITY_BUILDING_BALANCE.barracksRecruitManpowerDiscountPerLevel
        );
        return {
            gold: Math.max(1, Math.floor((unitType.cost.gold || 0) * (1 - goldDiscount))),
            manpower: Math.max(1, Math.floor((unitType.cost.manpower || 0) * (1 - manpowerDiscount)))
        };
    }

    getDiplomacyOverview() {
        const playerFactionId = this.getPlayerFactionId();
        const knownFactions = this.getKnownAIFactions();
        return knownFactions
            .filter((factionId) => factionId !== playerFactionId || this.hasEnemyPresenceForFaction(factionId))
            .map((factionId) => {
                const state = this.ensureDiplomacyFactionState(factionId);
                const aiState = this.ensureAIFactionState(factionId);
                const route = (this.diplomacyState.tradeRoutes || []).find((r) => r.factionId === factionId && r.active);
                const sameCivilizationRival = factionId === playerFactionId;
                return {
                    factionId,
                    displayName: this.getDiplomacyFactionLabel(factionId, { sameCivilizationRival }),
                    status: state.status,
                    tradeAgreement: Boolean(state.tradeAgreement),
                    trust: Math.max(0, Math.min(100, Math.floor(state.trust || 0))),
                    hostility: Math.max(-50, Math.min(100, Math.floor(aiState?.diplomacy?.player || 0))),
                    route: route ? { id: route.id, value: route.value, status: route.status } : null
                };
            });
    }

    getFactionDisplayName(factionId) {
        const labels = {
            byzantine: 'Byzantines',
            arab: 'Arabs',
            bulgar: 'Bulgars',
            frank: 'Franks',
            sassanid: 'Sassanids',
            tribal: 'Tribal Confederation',
            enemy: 'Enemy Army',
            neutral: 'Neutral'
        };
        if (labels[factionId]) return labels[factionId];
        return String(factionId || 'Unknown')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (m) => m.toUpperCase());
    }

    adjustReputation(delta) {
        this.initializeDiplomacyState();
        this.diplomacyState.reputation = Math.max(-100, Math.min(100, Math.floor((this.diplomacyState.reputation || 0) + delta)));
        return this.diplomacyState.reputation;
    }

    setDiplomacyStatus(factionId, status, meta = {}) {
        const state = this.ensureDiplomacyFactionState(factionId);
        const previous = state.status;
        if (previous === status) {
            return { changed: false, previous, current: status };
        }
        state.status = status;
        state.lastChangedTurn = this.turn;
        if (status === 'war') {
            state.tradeAgreement = false;
            (this.diplomacyState.tradeRoutes || []).forEach((route) => {
                if (route.factionId === factionId && route.active) {
                    route.active = false;
                    route.status = 'war-blocked';
                    route.lastDisruptedTurn = this.turn;
                }
            });
        }
        this.recordAIWorldEvent('diplomacy_status_changed', {
            factionId,
            previousStatus: previous,
            status,
            source: meta.source || 'system'
        });
        return { changed: true, previous, current: status };
    }

    createTradeRouteWithFaction(factionId) {
        if (this.getFactionDiplomacyStatus(factionId) === 'war') {
            return { success: false, message: 'Não é possível estabelecer rotas comerciais enquanto estiver em guerra.' };
        }
        const playerCities = gameMap?.getCityTiles('player') || [];
        const factionCities = this.getAIFactionCityTiles(factionId);
        if (!playerCities.length || !factionCities.length) {
            return { success: false, message: 'Rotas comerciais requerem que ambas as partes controlem pelo menos uma cidade.' };
        }
        const existing = (this.diplomacyState.tradeRoutes || []).find((route) => route.factionId === factionId && route.active);
        if (existing) {
            return { success: false, message: 'Já existe uma rota comercial com essa facção.' };
        }

        let best = null;
        playerCities.forEach((pc) => {
            factionCities.forEach((fc) => {
                const dist = Math.abs(pc.x - fc.x) + Math.abs(pc.y - fc.y);
                const score = (12 - Math.min(12, dist)) + (pc.cityData?.population || 4) * 0.4 + (fc.cityData?.population || 4) * 0.35;
                if (!best || score > best.score) best = { pc, fc, dist, score };
            });
        });
        if (!best) {
            return { success: false, message: 'Não foi possível determinar um caminho de rota comercial válida.' };
        }
        const trust = this.ensureDiplomacyFactionState(factionId).trust ?? 35;
        const value = Math.max(4, Math.floor(6 + trust * 0.06 + Math.max(0, 10 - Math.floor(best.dist / 3))));
        const previousRoute = (this.diplomacyState.tradeRoutes || []).find((route) => route.factionId === factionId);
        const route = previousRoute || {
            id: `trade_${factionId}_${this.turn}_${Date.now()}`,
            factionId
        };
        route.fromCityId = best.pc.cityData?.id || `${best.pc.x},${best.pc.y}`;
        route.toCityId = best.fc.cityData?.id || `${best.fc.x},${best.fc.y}`;
        route.value = value;
        route.status = 'active';
        route.active = true;
        route.establishedTurn = this.turn;
        route.lastIncomeTurn = null;
        route.lastDisruptedTurn = null;
        if (!previousRoute) {
            this.diplomacyState.tradeRoutes.push(route);
        }
        if (this.diplomacyState.tradeRoutes.length > 80) {
            const keep = [];
            const activeRoutes = this.diplomacyState.tradeRoutes.filter((entry) => entry?.active);
            const inactiveRoutes = this.diplomacyState.tradeRoutes
                .filter((entry) => entry && !entry.active)
                .sort((a, b) => (b.lastDisruptedTurn || 0) - (a.lastDisruptedTurn || 0));
            keep.push(...activeRoutes);
            keep.push(...inactiveRoutes.slice(0, Math.max(0, 80 - activeRoutes.length)));
            this.diplomacyState.tradeRoutes = keep;
        }
        this.recordAIWorldEvent('trade_route_established', {
            factionId,
            routeId: route.id,
            value
        });
        return { success: true, route };
    }

    applyDiplomacyAction(actionId, factionId) {
        const id = factionId || 'tribal';
        const factionName = this.getFactionDisplayName(id);
        const factionState = this.ensureDiplomacyFactionState(id);
        const aiState = this.ensureAIFactionState(id);
        const currentHostility = Math.max(-50, Math.min(100, aiState?.diplomacy?.player || 0));
        const reputation = this.diplomacyState.reputation || 0;
        const diplomacyBonus = this.player?.techEffects?.diplomacyAcceptanceBonus || 0;

        const acceptRoll = (threshold) => Math.random() < Math.max(0.05, Math.min(0.95, threshold + diplomacyBonus));
        if (actionId === 'declare_war') {
            const result = this.setDiplomacyStatus(id, 'war', { source: 'player' });
            factionState.tradeAgreement = false;
            this.adjustReputation(-6);
            if (aiState?.diplomacy) aiState.diplomacy.player = Math.min(100, (aiState.diplomacy.player || 0) + 18);
            return { success: true, message: result.changed ? 'A guerra foi declarada.' : 'Já em estado de guerra.' };
        }

        if (actionId === 'propose_truce') {
            if (factionState.status !== 'war') return { success: false, message: 'Uma trégua só pode ser proposta durante a guerra.' };
            const accepted = acceptRoll(0.55 + (reputation * 0.002) - (currentHostility * 0.003));
            if (!accepted) {
                this.adjustReputation(-2);
                if (aiState?.diplomacy) aiState.diplomacy.player = Math.min(100, (aiState.diplomacy.player || 0) + 4);
                return { success: false, message: `${factionName} rejeitou sua proposta de trégua.` };
            }
            this.setDiplomacyStatus(id, 'truce', { source: 'player' });
            this.adjustReputation(3);
            factionState.trust = Math.min(100, (factionState.trust ?? 35) + 10);
            if (aiState?.diplomacy) aiState.diplomacy.player = Math.max(-50, (aiState.diplomacy.player || 0) - 16);
            if (typeof achievementManager !== 'undefined') achievementManager.recordTruceEstablished();
            return { success: true, message: `${factionName} aceitou a trégua.` };
        }

        if (actionId === 'propose_alliance') {
            if (factionState.status === 'war') return { success: false, message: 'Termine a guerra antes de propor uma aliança.' };
            const accepted = acceptRoll(0.38 + (factionState.trust ?? 35) * 0.004 + (reputation * 0.003) - (currentHostility * 0.0035));
            if (!accepted) {
                this.adjustReputation(-1);
                factionState.trust = Math.max(0, (factionState.trust ?? 35) - 5);
                return { success: false, message: `${factionName} recusou a aliança por enquanto.` };
            }
            this.setDiplomacyStatus(id, 'alliance', { source: 'player' });
            factionState.trust = Math.min(100, (factionState.trust ?? 35) + 14);
            this.adjustReputation(6);
            if (aiState?.diplomacy) aiState.diplomacy.player = Math.max(-50, (aiState.diplomacy.player || 0) - 22);
            return { success: true, message: `Aliança formada com ${factionName}.` };
        }

        if (actionId === 'trade_agreement') {
            if (factionState.status === 'war') return { success: false, message: 'Não é possível assinar acordos comerciais durante a guerra.' };
            if (factionState.tradeAgreement) return { success: false, message: 'Acordo comercial já está ativo.' };
            const accepted = acceptRoll(0.5 + (factionState.trust ?? 35) * 0.003 + (reputation * 0.002));
            if (!accepted) {
                this.adjustReputation(-1);
                return { success: false, message: `${factionName} recusou os termos comerciais propostos.` };
            }
            factionState.tradeAgreement = true;
            const routeResult = this.createTradeRouteWithFaction(id);
            if (!routeResult.success) {
                factionState.tradeAgreement = false;
                return routeResult;
            }
            factionState.trust = Math.min(100, (factionState.trust ?? 35) + 8);
            this.adjustReputation(4);
            return { success: true, message: `Acordo comercial assinado com ${factionName}.`, route: routeResult.route };
        }

        return { success: false, message: 'Ação diplomática desconhecida.' };
    }

    processDiplomacyAndTradeTurn() {
        this.initializeDiplomacyState();
        let tradeGold = 0;
        let tradePrestige = 0;
        let disrupted = 0;
        let active = 0;

        (this.diplomacyState.tradeRoutes || []).forEach((route) => {
            if (!route || !route.active) return;
            const factionId = route.factionId || 'tribal';
            const factionState = this.ensureDiplomacyFactionState(factionId);
            const aiState = this.ensureAIFactionState(factionId);
            const hostility = Math.max(-50, Math.min(100, aiState?.diplomacy?.player || 0));
            if (factionState.status === 'war' || !factionState.tradeAgreement) {
                route.active = false;
                route.status = 'blocked';
                route.lastDisruptedTurn = this.turn;
                disrupted += 1;
                this.recordAIWorldEvent('trade_route_disrupted', { routeId: route.id, factionId, reason: 'war_or_no_treaty' });
                return;
            }
            const raidChance = Math.max(0.02, Math.min(0.55, 0.06 + Math.max(0, hostility) * 0.004));
            const raided = Math.random() < raidChance;
            if (raided) {
                const lost = Math.max(2, Math.floor((route.value || 5) * 0.45));
                tradeGold += Math.max(0, (route.value || 5) - lost);
                route.status = 'raided';
                route.lastDisruptedTurn = this.turn;
                disrupted += 1;
                this.adjustReputation(-1);
                this.recordAIWorldEvent('trade_route_raided', { routeId: route.id, factionId, lostGold: lost });
            } else {
                const allianceBonus = factionState.status === 'alliance' ? 1.2 : (factionState.status === 'truce' ? 1.08 : 1);
                const tradeTechMultiplier = this.player?.techEffects?.tradeIncomeMultiplier || 1;
                const income = Math.max(2, Math.floor((route.value || 5) * allianceBonus * tradeTechMultiplier));
                tradeGold += income;
                tradePrestige += factionState.status === 'alliance' ? 1 : 0;
                route.status = 'active';
                route.lastIncomeTurn = this.turn;
                active += 1;
            }
        });

        if (tradeGold > 0 || tradePrestige > 0) {
            this.addResources(tradeGold, 0, tradePrestige);
            this.recordAIWorldEvent('trade_income', {
                tradeGold,
                tradePrestige,
                routesActive: active,
                routesDisrupted: disrupted
            });
        }

        return { gold: tradeGold, prestige: tradePrestige, activeRoutes: active, disruptedRoutes: disrupted };
    }

    /**
     * Record an AI-world event. Payload shape varies by type (e.g. `city_captured`, `ai_expansion`);
     * canonical fields (`type`, `turn`, `timestamp`) are enforced here.
     */
    recordAIWorldEvent(type, payload = {}) {
        const entry = {
            ...payload,
            type,
            turn: this.turn,
            timestamp: Date.now()
        };
        this.aiEvents.push(entry);
        if (this.aiEvents.length > 40) {
            this.aiEvents.splice(0, this.aiEvents.length - 40);
        }
        return entry;
    }

    getRecentAIWorldEvents(limit = 12) {
        return this.aiEvents.slice(Math.max(0, this.aiEvents.length - limit));
    }

    initializeDynamicNarrativeState() {
        this.dynamicNarrativeState = {
            counter: 0,
            lastGeneratedTurn: 0,
            active: [],
            history: []
        };
    }

    restoreDynamicNarrativeState(state) {
        this.initializeDynamicNarrativeState();
        if (!state || typeof state !== 'object') return;
        const sanitizeChoice = (choice) => ({
            id: String(choice?.id || '').trim() || 'choice_unknown',
            title: String(choice?.title || 'Choose').trim(),
            subtitle: String(choice?.subtitle || '').trim(),
            summary: String(choice?.summary || '').trim(),
            effects: (choice?.effects && typeof choice.effects === 'object') ? choice.effects : {}
        });
        const sanitizeEntry = (entry) => {
            const status = ['pending', 'resolved', 'expired'].includes(entry?.status) ? entry.status : 'pending';
            let createdTurn = Number.isFinite(entry?.createdTurn) ? Math.floor(entry.createdTurn) : this.turn;
            createdTurn = Math.min(this.turn, Math.max(0, createdTurn));

            let resolvedTurn = Number.isFinite(entry?.resolvedTurn) ? Math.floor(entry.resolvedTurn) : null;
            if (Number.isFinite(resolvedTurn)) {
                resolvedTurn = Math.min(this.turn, Math.max(0, resolvedTurn));
                if ((status === 'resolved' || status === 'expired') && resolvedTurn < createdTurn) {
                    resolvedTurn = createdTurn;
                }
            } else {
                resolvedTurn = null;
            }

            return {
                id: String(entry?.id || '').trim(),
                templateId: String(entry?.templateId || '').trim(),
                type: entry?.type === 'event' ? 'event' : 'quest',
                status,
                title: String(entry?.title || 'Untitled').trim(),
                description: String(entry?.description || '').trim(),
                createdTurn,
                resolvedTurn,
                selectedChoiceId: entry?.selectedChoiceId ? String(entry.selectedChoiceId) : null,
                triggerTags: Array.isArray(entry?.triggerTags)
                    ? entry.triggerTags.map((tag) => String(tag || '').trim()).filter(Boolean).slice(0, 8)
                    : [],
                choices: Array.isArray(entry?.choices)
                    ? entry.choices.map(sanitizeChoice).filter((choice) => choice.id && choice.title)
                    : []
            };
        };

        this.dynamicNarrativeState.counter = Number.isFinite(state.counter) ? Math.max(0, state.counter) : 0;
        this.dynamicNarrativeState.lastGeneratedTurn = Number.isFinite(state.lastGeneratedTurn)
            ? Math.min(this.turn, Math.max(0, state.lastGeneratedTurn))
            : 0;
        this.dynamicNarrativeState.active = Array.isArray(state.active)
            ? state.active.map(sanitizeEntry).filter((entry) => entry.id && entry.status === 'pending')
            : [];
        this.dynamicNarrativeState.history = Array.isArray(state.history)
            ? state.history
                .map((entry) => sanitizeEntry(entry))
                .filter((entry) => entry.id && entry.status !== 'pending')
                .slice(-120)
            : [];
    }

    getDynamicNarrativeOverview() {
        if (!this.dynamicNarrativeState) this.initializeDynamicNarrativeState();
        const active = this.dynamicNarrativeState.active
            .filter((entry) => entry.status === 'pending')
            .sort((a, b) => b.createdTurn - a.createdTurn);
        const history = this.dynamicNarrativeState.history
            .filter((entry) => entry.status !== 'pending')
            .slice(-24)
            .sort((a, b) => (b.resolvedTurn || b.createdTurn) - (a.resolvedTurn || a.createdTurn));
        return { active, history };
    }

    isCityOnDynamicFrontline(tile, enemyUnitPositions = null) {
        if (!tile || !gameMap) return false;
        const enemyPositions = enemyUnitPositions || new Set(this.units
            .filter((unit) => unit?.owner === 'enemy')
            .map((unit) => `${unit.position?.x}_${unit.position?.y}`));
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = tile.x + dx;
                const ny = tile.y + dy;
                const nearby = gameMap.getTile(nx, ny);
                if (!nearby) continue;
                if (nearby.cityData && nearby.owner === 'enemy') return true;
                if (enemyPositions.has(`${nx}_${ny}`)) return true;
            }
        }
        return false;
    }

    buildDynamicNarrativeContext() {
        const resources = this.player?.resources || {};
        const playerCities = gameMap?.getCityTiles('player') || [];
        const enemyUnitPositions = new Set(this.units
            .filter((unit) => unit?.owner === 'enemy')
            .map((unit) => `${unit.position?.x}_${unit.position?.y}`));
        const frontierCities = playerCities.filter((tile) => this.isCityOnDynamicFrontline(tile, enemyUnitPositions));
        const lowResources = [];
        if ((resources.gold || 0) < 220) lowResources.push('gold');
        if ((resources.manpower || 0) < 130) lowResources.push('manpower');
        if ((resources.food || 0) < 40) lowResources.push('food');
        const knownFactions = this.getKnownAIFactions();
        const hostileFactions = knownFactions
            .filter((factionId) => this.getFactionDiplomacyStatus(factionId) === 'war');
        const recentCaptures = this.getRecentAIWorldEvents(14)
            .filter((entry) => entry?.type === 'city_captured' && entry?.capturer === 'player')
            .filter((entry) => Number.isFinite(entry.turn) && entry.turn >= this.turn - 3);

        return {
            resources,
            playerCities,
            frontierCities,
            lowResources,
            knownFactions,
            hostileFactions,
            primaryHostileFaction: hostileFactions[0] || knownFactions[0] || 'tribal',
            progress: {
                turn: this.turn,
                cities: playerCities.length,
                territories: Array.isArray(this.player?.territories) ? this.player.territories.length : 0,
                technologies: Array.isArray(this.player?.techResearched) ? this.player.techResearched.length : 0,
                militaryUnits: this.units.filter((unit) => unit?.owner === 'player').length
            },
            recentCaptures,
            reputation: this.diplomacyState?.reputation || 0
        };
    }

    isDynamicTemplateOnCooldown(templateId, cooldownTurns = 6) {
        if (!this.dynamicNarrativeState || !Array.isArray(this.dynamicNarrativeState.history)) return false;
        const activeHasTemplate = Array.isArray(this.dynamicNarrativeState.active)
            && this.dynamicNarrativeState.active.some((entry) => entry?.templateId === templateId && entry?.status === 'pending');
        if (activeHasTemplate) return true;
        for (let i = this.dynamicNarrativeState.history.length - 1; i >= 0; i--) {
            const entry = this.dynamicNarrativeState.history[i];
            if (entry?.templateId !== templateId) continue;
            const turn = Number.isFinite(entry?.resolvedTurn) ? entry.resolvedTurn : entry?.createdTurn;
            if (!Number.isFinite(turn)) return false;
            return (this.turn - turn) < cooldownTurns;
        }
        return false;
    }

    createDynamicNarrativeEntry(template) {
        if (!this.dynamicNarrativeState) this.initializeDynamicNarrativeState();
        this.dynamicNarrativeState.counter += 1;
        return {
            id: `dyn_${this.turn}_${this.dynamicNarrativeState.counter}`,
            templateId: template.id,
            type: template.type === 'event' ? 'event' : 'quest',
            status: 'pending',
            title: template.title,
            description: template.description,
            createdTurn: this.turn,
            resolvedTurn: null,
            selectedChoiceId: null,
            triggerTags: Array.isArray(template.triggerTags) ? template.triggerTags.slice(0, 8) : [],
            choices: Array.isArray(template.choices) ? template.choices.map((choice) => ({
                id: String(choice.id || ''),
                title: String(choice.title || 'Choose'),
                subtitle: String(choice.subtitle || ''),
                summary: String(choice.summary || ''),
                effects: (choice.effects && typeof choice.effects === 'object') ? choice.effects : {}
            })) : []
        };
    }

    selectDynamicNarrativeCandidates(context) {
        const candidates = [];
        const frontierName = context.frontierCities[0]?.cityData?.name || 'frontier provinces';
        const primaryFactionLabel = this.getFactionDisplayName(context.primaryHostileFaction || 'tribal');
        const primaryFactionKey = context.primaryHostileFaction || 'tribal';

        if (this.turn >= 3 && this.turn % 5 === 0 && !this.isDynamicTemplateOnCooldown('imperial_reforms', 7)) {
            candidates.push({
                priority: 30,
                id: 'imperial_reforms',
                type: 'quest',
                triggerTags: ['time', 'player_progress'],
                title: 'Debate de Reforma Imperial',
                description: 'Oficiais da corte exigem uma direção política de longo prazo para a próxima fase de expansão.',
                choices: [
                    {
                        id: 'reform_civil',
                        title: 'Financiar a administração civil',
                        subtitle: '-120 ouro, +2 prestígio, +15 comida',
                        summary: 'Seu tesouro está sobrecarregado, mas a logística e o prestígio melhoram.',
                        effects: { resources: { gold: -120, prestige: 2, food: 15 } }
                    },
                    {
                        id: 'reform_military',
                        title: 'Priorizar o treinamento militar',
                        subtitle: '-90 ouro, +80 mão de obra, -4 de confiança com facções hostis',
                        summary: 'A prontidão do exército aumenta enquanto as facções rivais desconfiam de suas intenções.',
                        effects: { resources: { gold: -90, manpower: 80 }, trust: { [primaryFactionKey]: -4 } }
                    },
                    {
                        id: 'reform_balance',
                        title: 'Pacote de compromisso',
                        subtitle: '-70 ouro, +1 prestígio, +35 mão de obra',
                        summary: 'Reformas equilibradas oferecem ganhos moderados com menor risco.',
                        effects: { resources: { gold: -70, prestige: 1, manpower: 35 } }
                    }
                ]
            });
        }

        if (context.frontierCities.length > 0 && context.hostileFactions.length > 0 && !this.isDynamicTemplateOnCooldown('frontier_flashpoint', 4)) {
           candidates.push({
                priority: 50,
                id: 'frontier_flashpoint',
                type: 'event',
                triggerTags: ['location', 'faction_relations'],
                title: `Ponto de Tensão na Fronteira Próximo a ${frontierName}`,
                description: `Batedores de ${primaryFactionLabel} estão sondando rotas perto de ${frontierName}. Os comandantes solicitam ordens imediatas.`,
                choices: [
                    {
                        id: 'flashpoint_fortify',
                        title: 'Fortalecer e manter posição',
                        subtitle: '-40 pedra, +40 mão de obra, +2 de pressão de confiança sobre o inimigo',
                        summary: 'As defesas são reforçadas e as reservas mobilizadas.',
                        effects: { resources: { stone: -40, manpower: 40 }, trust: { [primaryFactionKey]: -2 } }
                    },
                    {
                        id: 'flashpoint_patrol',
                        title: 'Enviar patrulhas móveis',
                        subtitle: '-55 ouro, +20 mão de obra, +1 de reputação',
                        summary: 'A resposta flexível protege as estradas e tranquiliza os governadores locais.',
                        effects: { resources: { gold: -55, manpower: 20 }, reputation: 1 }
                    },
                    {
                        id: 'flashpoint_ignore',
                        title: 'Não escalar o conflito',
                        subtitle: '+35 ouro, -2 de reputação, +3 de confiança para o inimigo',
                        summary: 'O tesouro é preservado, mas a fronteira percebe hesitação.',
                        effects: { resources: { gold: 35 }, reputation: -2, trust: { [primaryFactionKey]: 3 } }
                    }
                ]
            });
        }

        if (context.lowResources.length > 0 && !this.isDynamicTemplateOnCooldown('supply_crisis', 5)) {
           candidates.push({
                priority: 45,
                id: 'supply_crisis',
                type: 'quest',
                triggerTags: ['resource_levels', 'player_progress'],
                title: 'Crise de Suprimento',
                description: `Os quartermestres alertam que as reservas de ${context.lowResources.join(', ')} estão críticas.`,
                choices: [
                    {
                        id: 'supply_tax',
                        title: 'Aumentar impostos de emergência',
                        subtitle: '+140 ouro, -2 prestígio',
                        summary: 'A receita aumenta rapidamente, mas o prestígio da corte sofre.',
                        effects: { resources: { gold: 140, prestige: -2 } }
                    },
                    {
                        id: 'supply_trade',
                        title: 'Negociar contratos externos',
                        subtitle: '-70 ouro, +80 comida, +35 madeira, +1 reputação',
                        summary: 'Fornecedores externos estabilizam os estoques e melhoram a posição diplomática.',
                        effects: { resources: { gold: -70, food: 80, wood: 35 }, reputation: 1 }
                    },
                    {
                        id: 'supply_conserve',
                        title: 'Impor racionamento',
                        subtitle: '+45 comida, +20 madeira, -25 mão de obra',
                        summary: 'As reservas melhoram, mas a prontidão militar é reduzida.',
                        effects: { resources: { food: 45, wood: 20, manpower: -25 } }
                    }
                ]
            });
        }

        if (context.recentCaptures.length > 0 && !this.isDynamicTemplateOnCooldown('new_territory_integrate', 5)) {
            const cityName = context.recentCaptures[0]?.cityName || 'newly captured city';
            candidates.push({
                priority: 40,
                id: 'new_territory_integrate',
                type: 'event',
                triggerTags: ['location', 'player_progress', 'time'],
                title: `Consequências em ${cityName}`,
                description: `${cityName} está sob controle imperial, mas a política de integração precisa ser definida agora.`,
                choices: [
                    {
                        id: 'integrate_lenient',
                        title: 'Conceder autonomia local',
                        subtitle: '+2 reputação, +1 prestígio, -30 ouro',
                        summary: 'As elites locais cooperam, aliviando a pressão da ocupação.',
                        effects: { resources: { gold: -30, prestige: 1 }, reputation: 2 }
                    },
                    {
                        id: 'integrate_strict',
                        title: 'Impor governo direto',
                        subtitle: '+90 ouro, -1 reputação, +30 mão de obra',
                        summary: 'A arrecadação de impostos aumenta rapidamente enquanto o ressentimento cresce.',
                        effects: { resources: { gold: 90, manpower: 30 }, reputation: -1 }
                    }
                ]
            });
        }

        if (context.reputation <= -20 && context.hostileFactions.length > 0 && !this.isDynamicTemplateOnCooldown('diplomatic_fracture', 6)) {
           candidates.push({
                priority: 35,
                id: 'diplomatic_fracture',
                type: 'event',
                triggerTags: ['faction_relations', 'time'],
                title: 'Fratura Diplomática',
                description: `As relações com ${primaryFactionLabel} estão se deteriorando e os emissários exigem concessões.`,
                choices: [
                    {
                        id: 'fracture_concede',
                        title: 'Oferecer concessões',
                        subtitle: '-80 ouro, +6 de confiança, +2 de reputação',
                        summary: 'As tensões diminuem, mas a um custo financeiro.',
                        effects: { resources: { gold: -80 }, trust: { [primaryFactionKey]: 6 }, reputation: 2 }
                    },
                    {
                        id: 'fracture_reject',
                        title: 'Rejeitar exigências',
                        subtitle: '+1 prestígio, -6 de confiança, -1 de reputação',
                        summary: 'A autoridade imperial é afirmada enquanto a diplomacia piora.',
                        effects: { resources: { prestige: 1 }, trust: { [primaryFactionKey]: -6 }, reputation: -1 }
                    }
                ]
            });
        }

        // Modded narrative events
        if (typeof modManager !== 'undefined') {
            const modEvents = modManager.getEnabledEvents();
            for (const event of modEvents) {
                if (this.isDynamicTemplateOnCooldown(event.id, event.cooldown ?? 5)) {
                    continue;
                }
                if (event.triggerCondition) {
                    try {
                        if (!evaluateModCondition(event.triggerCondition, this)) continue;
                    } catch (e) {
                        console.error('Erro ao avaliar a condição para o evento de mod:', event.id, e);
                        continue;
                    }
                }
                candidates.push({
                    priority: event.priority ?? 10,
                    id: event.id,
                    type: event.type || 'quest',
                    triggerTags: event.triggerTags || ['mod'],
                    title: event.title,
                    description: event.description,
                    choices: event.choices || []
                });
            }
        }

        return candidates.sort((a, b) => b.priority - a.priority);
    }

    expireDynamicNarrativeEntries() {
        if (!this.dynamicNarrativeState) this.initializeDynamicNarrativeState();
        const expired = [];
        const stillActive = [];
        this.dynamicNarrativeState.active.forEach((entry) => {
            const createdTurn = Number.isFinite(entry?.createdTurn) ? entry.createdTurn : this.turn;
            const age = this.turn - createdTurn;
            if (entry.status === 'pending' && age >= 8) {
                entry.status = 'expired';
                entry.resolvedTurn = this.turn;
                expired.push(entry);
                this.dynamicNarrativeState.history.push({ ...entry });
                return;
            }
            stillActive.push(entry);
        });
        this.dynamicNarrativeState.active = stillActive;
        if (this.dynamicNarrativeState.history.length > 120) {
            this.dynamicNarrativeState.history.splice(0, this.dynamicNarrativeState.history.length - 120);
        }
        return expired;
    }

    processDynamicNarrativeTurn() {
        if (!this.dynamicNarrativeState) this.initializeDynamicNarrativeState();
        const expired = this.expireDynamicNarrativeEntries();
        if (!this.player || !gameMap || this.turn < 2) {
            return { generated: [], expired };
        }
        const pendingCount = this.dynamicNarrativeState.active.filter((entry) => entry.status === 'pending').length;
        if (pendingCount >= 3 || (this.turn - this.dynamicNarrativeState.lastGeneratedTurn) < 2) {
            return { generated: [], expired };
        }

        const context = this.buildDynamicNarrativeContext();
        const candidates = this.selectDynamicNarrativeCandidates(context);
        if (candidates.length === 0) {
            return { generated: [], expired };
        }
        const entry = this.createDynamicNarrativeEntry(candidates[0]);
        this.dynamicNarrativeState.active.push(entry);
        this.dynamicNarrativeState.lastGeneratedTurn = this.turn;
        this.recordAIWorldEvent('dynamic_narrative_generated', {
            narrativeId: entry.id,
            templateId: entry.templateId,
            narrativeType: entry.type
        });
        return { generated: [entry], expired };
    }

    applyDynamicNarrativeChoiceEffects(effects = {}, entry = null) {
        const summary = [];
        const resources = (effects && typeof effects.resources === 'object') ? effects.resources : {};
        const signed = (key) => Number.isFinite(resources[key]) ? Math.floor(resources[key]) : 0;
        const goldDelta = signed('gold');
        const manpowerDelta = signed('manpower');
        const prestigeDelta = signed('prestige');
        const strategicKeys = ['food', 'wood', 'stone', 'iron', 'rare'];
        const costGold = Math.max(0, -goldDelta);
        const costManpower = Math.max(0, -manpowerDelta);
        const costPrestige = Math.max(0, -prestigeDelta);
        const strategicCosts = {};

        strategicKeys.forEach((key) => {
            const delta = signed(key);
            if (delta < 0) strategicCosts[key] = -delta;
        });

        if ((costGold || costManpower || costPrestige) && !this.canAfford(costGold, costManpower, costPrestige)) {
            return { success: false, message: 'Não há ouro, homem de guerra ou prestígio suficientes para esta escolha.', summary };
        }
        const missingStrategic = Object.entries(strategicCosts).find(([key, cost]) => {
            const current = Number.isFinite(this.player?.resources?.[key]) ? this.player.resources[key] : 0;
            return current < cost;
        });
        if (missingStrategic) {
            const [missingKey] = missingStrategic;
            return { success: false, message: `Não há ${missingKey} suficientes para esta escolha.`, summary };
        }

        if (goldDelta >= 0 && manpowerDelta >= 0 && prestigeDelta >= 0) {
            if (goldDelta || manpowerDelta || prestigeDelta) {
                this.addResources(goldDelta, manpowerDelta, prestigeDelta);
            }
        } else {
            const positiveGold = Math.max(0, goldDelta);
            const positiveManpower = Math.max(0, manpowerDelta);
            const positivePrestige = Math.max(0, prestigeDelta);
            if (positiveGold || positiveManpower || positivePrestige) {
                this.addResources(positiveGold, positiveManpower, positivePrestige);
            }
            if (costGold || costManpower || costPrestige) {
                if (!this.spendResources(costGold, costManpower, costPrestige)) {
                    return { success: false, message: 'Não há ouro, homem de guerra ou prestígio suficientes para esta escolha.', summary };
                }
            }
        }

        strategicKeys.forEach((key) => {
            const delta = signed(key);
            if (!delta) return;
            if (delta > 0) {
                this.addStrategicResources({ [key]: delta });
            } else {
                const current = Number.isFinite(this.player?.resources?.[key]) ? this.player.resources[key] : 0;
                const cost = -delta;
                this.player.resources[key] = Math.max(0, current - cost);
            }
        });

        const trust = (effects && typeof effects.trust === 'object') ? effects.trust : {};
        Object.entries(trust).forEach(([factionId, delta]) => {
            if (isUnsafeStateObjectKey(factionId)) return;
            if (!Number.isFinite(delta)) return;
            const resolvedFactionId = factionId || 'tribal';
            const state = this.ensureDiplomacyFactionState(resolvedFactionId);
            state.trust = Math.max(0, Math.min(100, Math.floor((state.trust || 0) + delta)));
            summary.push(`${this.getFactionDisplayName(resolvedFactionId)} trust ${delta > 0 ? '+' : ''}${Math.floor(delta)}`);
        });

        const repDelta = Number.isFinite(effects?.reputation) ? Math.floor(effects.reputation) : 0;
        if (repDelta !== 0) {
            this.adjustReputation(repDelta);
            summary.push(`Reputation ${repDelta > 0 ? '+' : ''}${repDelta}`);
        }

        const resourceSummary = [];
        ['gold', 'manpower', 'prestige', ...strategicKeys].forEach((key) => {
            const delta = signed(key);
            if (!delta) return;
            resourceSummary.push(`${key} ${delta > 0 ? '+' : ''}${delta}`);
        });
        if (resourceSummary.length > 0) summary.push(resourceSummary.join(', '));

        this.recordAIWorldEvent('dynamic_narrative_choice', {
            narrativeId: entry?.id || null,
            templateId: entry?.templateId || null,
            choiceEffects: effects
        });
        return { success: true, summary };
    }

    resolveDynamicNarrativeChoice(entryId, choiceId) {
        if (!this.dynamicNarrativeState) this.initializeDynamicNarrativeState();
        const index = this.dynamicNarrativeState.active.findIndex((entry) => entry?.id === entryId && entry.status === 'pending');
       if (index === -1) {
            return { success: false, message: 'Missão/evento não está mais disponível.' };
        }
        const entry = this.dynamicNarrativeState.active[index];
        const choice = entry.choices.find((item) => item.id === choiceId);
        if (!choice) {
            return { success: false, message: 'Escolha inválida.' };
        }

        const effectResult = this.applyDynamicNarrativeChoiceEffects(choice.effects, entry);
        if (!effectResult?.success) {
            return {
                success: false,
                message: effectResult?.message || 'Não é possível resolver esta escolha no momento.'
            };
        }
        const outcomeSummary = effectResult.summary || [];
        entry.status = 'resolved';
        entry.resolvedTurn = this.turn;
        entry.selectedChoiceId = choice.id;
        this.dynamicNarrativeState.active.splice(index, 1);

        const historyEntry = {
            ...entry,
            choices: entry.choices,
            choiceTitle: choice.title,
            choiceSummary: choice.summary,
            outcomeSummary
        };
        this.dynamicNarrativeState.history.push(historyEntry);
        if (this.dynamicNarrativeState.history.length > 120) {
            this.dynamicNarrativeState.history.splice(0, this.dynamicNarrativeState.history.length - 120);
        }

        this.checkWinLossConditions();
        return {
            success: true,
            message: choice.summary || `${entry.title}: ${choice.title}`,
            entry: historyEntry
        };
    }

    getAIFactionPersonalityType(factionId) {
        const defaults = {
            arab: 'aggressive',
            bulgar: 'opportunistic',
            frank: 'diplomatic',
            sassanid: 'defensive',
            tribal: 'opportunistic'
        };
        return defaults[factionId] || 'defensive';
    }

    resolveAIFactionForTile(tile, fallback = 'tribal') {
        return tile?.faction || tile?.cityData?.historicalCivilization || fallback;
    }

    determineCapturerFaction(tile, unit, oldFaction) {
        if (tile?.owner === 'enemy') {
            return this.resolveAIFactionForTile(tile) || unit?.faction || oldFaction || 'tribal';
        }
        if (tile?.owner === 'player') {
            return unit?.faction || this.player?.faction || this.selectedFaction || 'byzantine';
        }
        return this.resolveAIFactionForTile(tile) || unit?.faction || oldFaction || this.player?.faction || this.selectedFaction || 'byzantine';
    }

    getAIFactionCityTiles(factionId) {
        if (!gameMap) return [];
        const resolvedFactionId = factionId || 'tribal';
        if (!this._aiCityTilesCache || this._aiCityTilesCache.turn !== this.turn) {
            this._aiCityTilesCache = {
                turn: this.turn,
                tiles: gameMap.getCityTiles() || []
            };
        }
        return this._aiCityTilesCache.tiles
            .filter((tile) => {
                if (!tile || tile.owner !== 'enemy') return false;
                return this.resolveAIFactionForTile(tile) === resolvedFactionId;
            });
    }

    ensureAIFactionState(factionId) {
        const resolvedFactionId = factionId || 'tribal';
        if (!this.aiFactions) this.aiFactions = {};
        const existing = this.aiFactions[resolvedFactionId] || {};
        const personality = existing.personality || this.getAIFactionPersonalityType(resolvedFactionId);
        const behaviorDefaultsFn = (typeof window !== 'undefined' && typeof window.getAIPersonalityBehaviorDefaults === 'function')
            ? window.getAIPersonalityBehaviorDefaults
            : null;
        const behaviorDefaults = behaviorDefaultsFn
            ? behaviorDefaultsFn(personality)
            : (existing.behavior || this.getPersonalityBehaviorFallback(personality));
        if (!behaviorDefaultsFn && !this._aiBehaviorDefaultsFallbackWarned) {
            this._aiBehaviorDefaultsFallbackWarned = true;
            console.warn('Auxiliar de comportamentos padrão de personalidade da IA indisponível; usando valores de comportamento padrão neutros (fallback).');
        }
        const defaults = {
            factionId: resolvedFactionId,
            personality,
            behavior: { ...behaviorDefaults },
            diplomacy: {
                player: personality === 'diplomatic' ? -5 : (personality === 'aggressive' ? 18 : 6)
            },
            intel: {
                playerThreat: 0,
                playerPressure: 0,
                lastKnownPlayerCities: 0,
                lastUpdatedTurn: 0
            },
            stockpile: { gold: 120, manpower: 70 },
            lastPlans: [],
            lastActionTurn: 0,
            lastExpansionTurn: -1,
            inactiveSinceTurn: null
        };
        this.aiFactions[resolvedFactionId] = {
            ...defaults,
            ...existing,
            behavior: { ...defaults.behavior, ...(existing.behavior || {}) },
            diplomacy: { ...defaults.diplomacy, ...(existing.diplomacy || {}) },
            intel: { ...defaults.intel, ...(existing.intel || {}) },
            stockpile: { ...defaults.stockpile, ...(existing.stockpile || {}) },
            lastPlans: Array.isArray(existing.lastPlans) ? existing.lastPlans.slice(-8) : [],
            lastExpansionTurn: Number.isFinite(existing.lastExpansionTurn) ? existing.lastExpansionTurn : -1,
            inactiveSinceTurn: existing.inactiveSinceTurn ?? null
        };
        return this.aiFactions[resolvedFactionId];
    }

    getPersonalityBehaviorFallback(personality) {
        const fallbackByPersonality = {
            aggressive: { aggression: 0.9, expansion: 0.75, defense: 0.35, diplomacy: 0.2, resourceFocus: 0.45 },
            defensive: { aggression: 0.42, expansion: 0.38, defense: 0.92, diplomacy: 0.45, resourceFocus: 0.7 },
            opportunistic: { aggression: 0.65, expansion: 0.88, defense: 0.55, diplomacy: 0.35, resourceFocus: 0.6 },
            diplomatic: { aggression: 0.35, expansion: 0.5, defense: 0.55, diplomacy: 0.95, resourceFocus: 0.65 }
        };
        return fallbackByPersonality[personality] || fallbackByPersonality.defensive;
    }

    refreshAIFactionState() {
        if (!gameMap) return;
        this._aiCityTilesCache = null;
        const activeFactions = new Set();
        this.units.forEach((unit) => {
            if (unit?.owner !== 'enemy') return;
            activeFactions.add(unit.faction || 'tribal');
        });
        gameMap.getCityTiles().forEach((tile) => {
            if (tile?.owner !== 'enemy') return;
            activeFactions.add(this.resolveAIFactionForTile(tile));
        });
        activeFactions.forEach((factionId) => {
            const state = this.ensureAIFactionState(factionId);
            if (state) state.inactiveSinceTurn = null;
        });
        Object.keys(this.aiFactions || {}).forEach((factionId) => {
            if (!activeFactions.has(factionId)) {
                const state = this.aiFactions[factionId];
                if (state && state.inactiveSinceTurn == null) {
                    state.inactiveSinceTurn = this.turn;
                    return;
                }
                if (state && state.inactiveSinceTurn != null && (this.turn - state.inactiveSinceTurn) < 3) {
                    return;
                }
                delete this.aiFactions[factionId];
            }
        });
    }

    updateAIFactionIntelFromWorldState(options = {}) {
        const { skipRefresh = false, factionIds = null } = options || {};
        if (!skipRefresh) this.refreshAIFactionState();
        const playerCities = (gameMap?.getCityTiles('player') || []).length;
        const recentEvents = this.getRecentAIWorldEvents(12);
        const targetFactions = Array.isArray(factionIds) && factionIds.length
            ? [...new Set(factionIds)]
            : Object.keys(this.aiFactions || {});
        targetFactions.forEach((factionId) => {
            const state = this.ensureAIFactionState(factionId);
            if (!state) return;
            const factionCities = this.getAIFactionCityTiles(factionId).length;
            const hostileCaptures = recentEvents.filter((event) =>
                event.type === 'city_captured'
                && event.capturer === 'player'
                && event.cityFaction === factionId
            ).length;
            const neutralExpansion = recentEvents.filter((event) =>
                event.type === 'city_captured'
                && event.capturer === 'player'
                && (event.oldOwner === null || event.oldOwner === 'neutral')
            ).length;
            const citiesCapturedFromPlayer = recentEvents.filter((event) =>
                event.type === 'city_captured'
                && event.capturer === 'enemy'
                && event.capturerFaction === factionId
                && event.oldOwner === 'player'
            ).length;
            const diplomacyStatus = this.getFactionDiplomacyStatus(factionId);

            state.intel.playerThreat = Math.max(0, Math.min(100,
                (playerCities * 4)
                + (hostileCaptures * 16)
                + (neutralExpansion * 5)
                - (citiesCapturedFromPlayer * 8)
            ));
            state.intel.playerPressure = Math.max(0, Math.min(100, (hostileCaptures * 20) + (neutralExpansion * 8) + Math.max(0, 6 - factionCities) * 6));
            state.intel.lastKnownPlayerCities = playerCities;
            state.intel.lastUpdatedTurn = this.turn;

            // NOTE: state.diplomacy.player is a hostility score toward the player.
            // Higher values mean worse relations; lower values mean less hostility.
            const currentHostilityTowardPlayer = Math.max(-50, Math.min(100, state.diplomacy.player || 0));
            const hostilityDeltaFromRecentEvents =
                (hostileCaptures * 8)
                + (neutralExpansion * (state.personality === 'diplomatic' ? 4 : 2))
                - (citiesCapturedFromPlayer * 3);
            const treatyDelta = diplomacyStatus === 'alliance'
                ? -6
                : (diplomacyStatus === 'truce' ? -3 : (diplomacyStatus === 'war' ? 4 : 0));
            state.diplomacy.player = Math.max(-50, Math.min(100,
                currentHostilityTowardPlayer + hostilityDeltaFromRecentEvents + treatyDelta
            ));
        });
    }

    applyAIInfrastructureUpgrade(cityTile, upgradeType, factionState = null) {
        if (!cityTile?.cityData || !upgradeType) return false;
        const stockpile = factionState?.stockpile || null;
        if (!stockpile || (stockpile.gold || 0) < 40) return false;
        const infra = cityTile.cityData.infrastructure || (cityTile.cityData.infrastructure = { roads: 1, agriculture: 1, industry: 1 });
        infra[upgradeType] = Math.min(5, (infra[upgradeType] || 1) + 1);
        stockpile.gold = Math.max(0, (stockpile.gold || 0) - 40);
        return true;
    }

    ensureAICityFortification(cityTile) {
        if (!cityTile?.cityData) return false;
        if (cityTile.terrain === 'water') return false;
        cityTile.fort = cityTile.fort || {
            id: `fort_${cityTile.x}_${cityTile.y}`,
            owner: 'enemy',
            health: 90,
            maxHealth: 90,
            defenseBonus: 0.18,
            attack: 8,
            garrisonBonus: 0.1,
            builtTurn: this.turn
        };
        cityTile.fort.owner = 'enemy';
        if (cityTile.fort.lastReinforcedTurn !== this.turn) {
            cityTile.fort.defenseBonus = Math.min(0.35, (cityTile.fort.defenseBonus || 0.18) + 0.02);
            cityTile.fort.lastReinforcedTurn = this.turn;
        }
        cityTile.cityData.fortLevel = Math.max(cityTile.cityData.fortLevel || 0, 1);
        return true;
    }

    resolveCivilization(faction, leader = null) {
        if (leader?.civilization && CIVILIZATION_ALIASES[leader.civilization]) {
            return CIVILIZATION_ALIASES[leader.civilization];
        }
        if (faction === 'enemies') {
            const inferred = this.inferCivilizationFromLeader(leader);
            if (inferred) return inferred;
        }
        const normalizedFaction = CIVILIZATION_ALIASES[faction] || faction;
        return normalizedFaction;
    }

    inferCivilizationFromLeader(leader) {
        if (!leader) return null;
        const text = `${leader.faction || ''} ${leader.title || ''} ${leader.name || ''}`.toLowerCase();

        if (text.includes('sassanid') || text.includes('persian')) return 'sassanid';
        if (text.includes('bulgar')) return 'bulgar';
        if (text.includes('seljuk') || text.includes('rashidun') || text.includes('caliph')) return 'arab';
        if (
            text.includes('ostrogoth') ||
            text.includes('goth') ||
            text.includes('frank') ||
            text.includes('lombard') ||
            text.includes('visigoth')
        ) return 'frank';

        return null;
    }

    applyFactionUnitNaming(unit, faction) {
        if (!unit) return;
        unit.faction = faction || unit.faction;
        if (unit.faction && unit.faction !== 'byzantine' && typeof unit.name === 'string') {
            unit.name = unit.name.replace(/^Byzantine\s+/i, '');
        }
    }

    seedAdvancedEmpireInfrastructure() {
        const playerCities = gameMap?.getCityTiles('player') || [];
        playerCities.forEach((tile, index) => {
            if (!tile?.cityData) return;
            const infra = tile.cityData.infrastructure || (tile.cityData.infrastructure = {});
            infra.roads = Math.max(infra.roads || 1, 3);
            infra.agriculture = Math.max(infra.agriculture || 1, 3);
            infra.industry = Math.max(infra.industry || 1, 3);
            if (index === 0) tile.cityData.monastery = true;

            const nearWater = [
                { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
                { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }
            ].some((offset) => gameMap?.getTile(tile.x + offset.x, tile.y + offset.y)?.terrain === 'water');
            if (nearWater) {
                tile.cityData.port = true;
                tile.cityData.navalYard = true;
            }
        });
    }

    getStartingTownForFaction(faction) {
        const preferred = {
            byzantine: 'constantinople',
            arab: 'baghdad',
            bulgar: 'preslav',
            frank: 'aachen',
            sassanid: 'ctesiphon'
        };
        const preferredTown = HISTORIC_TOWNS.find(t => t.id === preferred[faction]);
        if (preferredTown) return preferredTown;
        const fallbackTown = HISTORIC_TOWNS.find(t => t.id === 'constantinople') || HISTORIC_TOWNS[0];
       if (!fallbackTown) {
            throw new Error('HISTORIC_TOWNS está vazio; não é possível determinar a vila inicial.');
        }
        return fallbackTown;
    }

    getEmpireCoreTownsForCentury(faction) {
        const selectedCentury = this.selectedCentury;
        if (selectedCentury == null) {
            return EMPIRE_CORE_TOWNS[faction] || [];
        }
        return CENTURY_EMPIRE_CORE_TOWNS[String(selectedCentury)]?.[faction] || EMPIRE_CORE_TOWNS[faction] || [];
    }

    getLeaderStartProfile(playerFaction) {
        const leaderId = this.selectedLeader?.id;
        const override = leaderId ? LEADER_START_PROFILES[leaderId] : null;
        const fallbackTown = this.getStartingTownForFaction(playerFaction);
        return {
            startTownId: override?.startTownId || fallbackTown.id,
            empireCoreTowns: override?.empireCoreTowns || this.getEmpireCoreTownsForCentury(playerFaction),
            nomadicBuildStart: Boolean(override?.nomadicBuildStart)
        };
    }

    getCapitalSeatPriority(playerFaction = null) {
        const faction = playerFaction || this.player?.faction || this.selectedFaction || 'byzantine';
        const leaderStartProfile = this.getLeaderStartProfile(faction);
        const priority = [];
        const pushUnique = (townId) => {
            if (!townId || priority.includes(townId)) return;
            priority.push(townId);
        };

        pushUnique(leaderStartProfile?.startTownId);
        (CIVILIZATION_CAPITAL_SEATS[faction] || []).forEach(pushUnique);

        return priority;
    }

    isCapitalSeatTile(tile, playerFaction = null) {
        if (!tile?.cityData) return false;
        const seatIds = new Set(this.getCapitalSeatPriority(playerFaction));
        return tile.cityData.kind === 'capital' || seatIds.has(tile.cityData.id);
    }

    refreshPlayerCapitalRoles(playerFaction = null) {
        if (!gameMap) return;
        const faction = playerFaction || this.player?.faction || this.selectedFaction || 'byzantine';
        const playerCities = gameMap.getCityTiles('player');
        const capitalPriority = this.getCapitalSeatPriority(faction);
        const capitalSeats = playerCities.filter((tile) => this.isCapitalSeatTile(tile, faction));

        (gameMap.getCityTiles() || []).forEach((tile) => {
            if (tile?.cityData) tile.cityData.capitalRole = null;
        });

        if (capitalSeats.length === 0) return;

        const primaryCapital = capitalPriority
            .map((townId) => capitalSeats.find((tile) => tile.cityData?.id === townId))
            .find(Boolean)
            || capitalSeats[0];

        capitalSeats.forEach((tile) => {
            tile.cityData.capitalRole = (tile === primaryCapital) ? 'primary' : 'secondary';
        });
    }

    isNomadicBuildStart(profile, scenario) {
        return scenario === SCENARIOS.building && Boolean(profile?.nomadicBuildStart);
    }

    getHistoricalTownControlForCentury(townId) {
        const base = HISTORICAL_TOWN_CONTROL[townId] || {
            tribe: 'Local tribe',
            civilization: 'neutral',
            stance: 'neutral'
        };
        const selectedCentury = this.selectedCentury;
        if (selectedCentury == null) {
            return base;
        }
        const centuryOverrides = CENTURY_TOWN_CONTROL_OVERRIDES[String(selectedCentury)] || {};
        const override = centuryOverrides[townId];
        return override ? { ...base, ...override } : base;
    }

    setupScenarioTowns(playerFaction, scenario) {
        const leaderStartProfile = this.getLeaderStartProfile(playerFaction);
        const playerEmpireCore = new Set(leaderStartProfile.empireCoreTowns || []);
        const nomadicBuildStart = this.isNomadicBuildStart(leaderStartProfile, scenario);
        const startingTownId = nomadicBuildStart ? null : leaderStartProfile.startTownId;
        this.player.territories = [];

        HISTORIC_TOWNS.forEach((town) => {
            const tile = gameMap.getTile(town.x, town.y);
            if (!tile?.cityData) return;

            const historical = this.getHistoricalTownControlForCentury(town.id);
            tile.cityData.tribe = historical.tribe;
            tile.cityData.historicalCivilization = historical.civilization;
            tile.cityData.historicalStance = historical.stance;
            tile.faction = historical.civilization;
            tile.owner = null;
            const isPlayerCoreTown = (scenario === SCENARIOS.empire && playerEmpireCore.has(town.id))
                || (scenario === SCENARIOS.building && town.id === startingTownId);

            if (isPlayerCoreTown) {
                this.applyTownOwner(town, 'player', playerFaction);
                return;
            }

            if (scenario === SCENARIOS.building) {
                // In the build scenario, many towns remain neutral and may join or resist.
                // For nomadic starts, same-civilization core towns begin neutral until conquered/allied.
                if (nomadicBuildStart && historical.civilization === playerFaction) {
                    this.applyTownOwner(town, 'neutral', historical.civilization);
                } else if (historical.stance === 'hostile') {
                    this.applyTownOwner(town, 'enemy', historical.civilization);
                } else {
                    this.applyTownOwner(town, 'neutral', historical.civilization);
                }
            } else {
                // In the empire scenario, historical rivals start with firm control.
                if (historical.civilization === playerFaction && historical.stance !== 'hostile') {
                    this.applyTownOwner(town, 'player', playerFaction);
                } else if (historical.stance === 'neutral') {
                    this.applyTownOwner(town, 'neutral', historical.civilization);
                } else {
                    this.applyTownOwner(town, 'enemy', historical.civilization);
                }
            }
        });
        this.refreshPlayerCapitalRoles(playerFaction);

        if (scenario === SCENARIOS.empire) {
            this.player.resources.gold += 650;
            this.player.resources.manpower += 500;
            this.player.resources.prestige += 80;
        }

        // Rebuild territories from authoritative map ownership to keep state consistent.
        const playerCityTiles = gameMap?.getCityTiles('player') || [];
        this.player.territories = playerCityTiles
            .map(tile => tile.cityData?.id)
            .filter(Boolean);
        (gameMap?.getCityTiles() || []).forEach((cityTile) => this.expandRoadNetworkFromCity(cityTile));
    }

    applyTownOwner(town, owner, faction) {
        const tile = gameMap.getTile(town.x, town.y);
        if (!tile?.cityData) return;

        tile.owner = owner;
        tile.faction = faction || tile.faction;
        if (owner === 'player') {
            if (!this.player.territories.includes(town.id)) {
                this.player.territories.push(town.id);
            }
            gameMap.revealArea(town.x, town.y, 4);
        } else {
            const idx = this.player.territories.indexOf(town.id);
            if (idx !== -1) this.player.territories.splice(idx, 1);
        }
    }

    isWaterCapable(unit) {
        return unit.type === 'naval'
            || unit.category === 'transport'
            || Boolean(unit.bonuses?.waterTraversal);
    }

    isWaterOnlyUnit(unit) {
        return unit?.type === 'naval' || unit?.category === 'transport';
    }

    getBattleType(defenderTile, attacker, defender) {
        if (defenderTile?.cityData) return 'siege';
        if (defenderTile?.terrain === 'forest' || defenderTile?.terrain === 'hills' || defenderTile?.terrain === 'mountains') {
            if (defender.category === 'mountain' || defender.category === 'scout' || defender.category === 'intel') {
                return 'ambush';
            }
        }
        if (attacker.type === 'naval' || defender.type === 'naval') return 'naval';
        return 'field';
    }

    findRetreatTile(unit, threatPos) {
        const offsets = [
            { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }
        ];
        const ranked = offsets
            .map((offset) => ({ x: unit.position.x + offset.x, y: unit.position.y + offset.y }))
            .filter((pos) => {
                const tile = gameMap?.getTile(pos.x, pos.y);
                if (!tile) return false;
                if (tile.terrain === 'water' && !this.isWaterCapable(unit)) return false;
                if (this.units.some(u => u.id !== unit.id && u.position.x === pos.x && u.position.y === pos.y)) return false;
                return true;
            })
            .sort((a, b) => {
                const da = Math.abs(a.x - threatPos.x) + Math.abs(a.y - threatPos.y);
                const db = Math.abs(b.x - threatPos.x) + Math.abs(b.y - threatPos.y);
                return db - da;
            });
        return ranked[0] || null;
    }

    resolveBattleOnMove(attacker, defender, destination) {
        const tile = gameMap?.getTile(destination.x, destination.y);
        const battleType = this.getBattleType(tile, attacker, defender);
        const attemptRetreat = defender.owner === 'player' || defender.currentHealth < defender.stats.health * 0.55;
        const result = executeBattle(
            attacker.id,
            defender.id,
            tile?.terrain || 'plains',
            battleType,
            { attemptRetreat, retreatSide: 'defender' }
        );
        if (!result.success) return false;

        if (result.retreat?.success && result.retreat.side === 'defender') {
            const retreatingDefender = this.units.find(u => u.id === defender.id);
            if (retreatingDefender) {
                const retreatPos = this.findRetreatTile(retreatingDefender, attacker.position);
                if (retreatPos) {
                    retreatingDefender.position = retreatPos;
                }
            }
        }

        if (window.uiManager) {
            uiManager.showCombatResult(result);
        }

        const attackerAlive = this.units.some(u => u.id === attacker.id);
        const defenderAlive = this.units.some(u => u.id === defender.id);
        if (attackerAlive && !defenderAlive) {
            attacker.position = destination;
            if (tile?.fort && tile.fort.owner !== attacker.owner) {
                tile.fort.owner = attacker.owner;
                tile.fort.health = Math.max(20, Math.floor((tile.fort.maxHealth || 90) * 0.45));
            }
            this.captureTerritory(attacker, destination);
        }

        return attackerAlive;
    }

    isSpawnTileAvailable(x, y) {
        if (!gameMap || x < 0 || x >= gameMap.width || y < 0 || y >= gameMap.height) {
            return false;
        }
        const tile = gameMap.getTile(x, y);
        if (!tile || tile.terrain === 'water' || tile.terrain === 'city') return false;
        const occupied = this.units.some(u => u.position.x === x && u.position.y === y);
        return !occupied;
    }

    findAvailableSpawnPosition(originX, originY, preferredOffsets = [], maxRadius = 3) {
        for (const offset of preferredOffsets) {
            const x = originX + offset.x;
            const y = originY + offset.y;
            if (this.isSpawnTileAvailable(x, y)) {
                return { x, y };
            }
        }

        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const remaining = radius - Math.abs(dy);
                for (let dx = -remaining; dx <= remaining; dx++) {
                    const x = originX + dx;
                    const y = originY + dy;
                    if (this.isSpawnTileAvailable(x, y)) {
                        return { x, y };
                    }
                }
            }
        }

        return null;
    }

    expandRoadNetworkFromCity(cityTile) {
        if (!cityTile) return;
        const infra = cityTile.cityData?.infrastructure || {};
        const radius = Math.max(1, Math.min(4, Math.floor((infra.roads || 1) / 2) + 1));
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist > radius) continue;
                const tile = gameMap?.getTile(cityTile.x + dx, cityTile.y + dy);
                if (!tile || tile.terrain === 'water') continue;
                tile.road = true;
            }
        }
    }

    getTerrainMoveCost(unit, fromTile, toTile) {
        if (!toTile) return Infinity;
        if (toTile.terrain === 'water') {
            return this.isWaterCapable(unit) ? 1 : Infinity;
        }
        const base = TERRAIN_TYPES[toTile.terrain]?.moveCost || 1;
        let cost = base;
        const terrainEffects = gameMap?.getTerrainEffects?.(toTile.terrain, { unit, fromTile, toTile }) || {};
        cost *= terrainEffects.moveCostMultiplier || 1;
        const biomeEffects = gameMap?.getBiomeEffects?.(toTile, unit) || {};
        cost *= biomeEffects.moveCostMultiplier || 1;

        if (toTile.road && fromTile?.road && toTile.terrain !== 'water') {
            cost *= 0.45;
        } else if (toTile.road && toTile.terrain !== 'water') {
            cost *= 0.65;
        }

        return Math.max(0.35, cost);
    }

    estimateTravelCost(unit, start, end) {
        if (!gameMap) return Infinity;
        let cx = start.x;
        let cy = start.y;
        let total = 0;
        let safety = 0;

        while ((cx !== end.x || cy !== end.y) && safety < 2048) {
            safety++;
            const dx = end.x - cx;
            const dy = end.y - cy;
            const candidates = [];

            if (dx !== 0) candidates.push({ x: cx + Math.sign(dx), y: cy });
            if (dy !== 0) candidates.push({ x: cx, y: cy + Math.sign(dy) });

            const ranked = candidates
                .filter((pos) => {
                    const t = gameMap.getTile(pos.x, pos.y);
                    if (!t) return false;
                    const occupied = this.units.some(u => u.position.x === pos.x && u.position.y === pos.y && !(u.position.x === end.x && u.position.y === end.y));
                    return !occupied;
                })
                .map((pos) => {
                    const fromTile = gameMap.getTile(cx, cy);
                    const toTile = gameMap.getTile(pos.x, pos.y);
                    const stepCost = this.getTerrainMoveCost(unit, fromTile, toTile);
                    const remain = Math.abs(end.x - pos.x) + Math.abs(end.y - pos.y);
                    return { ...pos, stepCost, remain };
                })
                .sort((a, b) => (a.stepCost - b.stepCost) || (a.remain - b.remain));

            const next = ranked[0];
            if (!next || !Number.isFinite(next.stepCost)) return Infinity;
            total += next.stepCost;
            cx = next.x;
            cy = next.y;
        }

        if (safety >= 2048) return Infinity;
        return total;
    }

    fortifyUnit(unitId) {
        const unit = this.units.find(u => u.id === unitId);
        if (!unit) return { success: false, message: 'Unidade não encontrada' };

        const tile = gameMap?.getTile(unit.position.x, unit.position.y);
        if (!tile) return { success: false, message: 'Tile inválido' };
        if (tile.terrain === 'water') return { success: false, message: 'Não é possível fortificar no mar' };

        unit.fortified = true;
        unit.currentMovement = 0;
        unit.morale = Math.min(100, unit.morale + 10);

        let created = false;
        if (!tile.fort) {
            tile.fort = {
                id: `fort_${tile.x}_${tile.y}`,
                owner: unit.owner,
                health: 90,
                maxHealth: 90,
                defenseBonus: 0.22,
                attack: 10,
                garrisonBonus: 0.12,
                builtTurn: this.turn
            };
            created = true;
        } else if (tile.fort.owner === unit.owner) {
            tile.fort.health = Math.min(tile.fort.maxHealth || 90, (tile.fort.health || 0) + 12);
        }

       return {
            success: true,
            created,
            message: created ? `${unit.name} estabeleceu uma fortificação` : `${unit.name} fortificou a posição`
        };
    }

    resolveFortAssault(attacker, destinationTile) {
        const fort = destinationTile?.fort;
        if (!fort) return { success: true, destroyed: false };

        const attackerIsSiege = attacker.category === 'siege';
        const attackerPower = attacker.stats.attack * (attackerIsSiege ? 1.45 : 1);
        const defenderPower = (fort.attack || 8) + Math.floor((fort.health || 50) * 0.05);
        const damageToFort = Math.max(6, Math.floor(attackerPower * (0.55 + Math.random() * 0.35)));
        const damageToUnit = Math.max(3, Math.floor(defenderPower * (0.65 + Math.random() * 0.35)));

        fort.health -= damageToFort;
        attacker.currentHealth -= damageToUnit;
        attacker.currentMovement = 0;
        attacker.fortified = false;

        let attackerDied = false;
        if (attacker.currentHealth <= 0) {
            attackerDied = true;
            removeUnit(attacker.id);
        }

        let destroyed = false;
        if (fort.health <= 0) {
            destroyed = true;
            destinationTile.fort = null;
            if (!destinationTile.cityData) {
                destinationTile.owner = null;
            }
        }

        return {
            success: !attackerDied,
            destroyed,
            attackerDied,
            damageToFort,
            damageToUnit,
            fortOwner: fort.owner
        };
    }

    getAdjacentSupportHealing(unit) {
        const nearbyAllies = this.units.filter(other =>
            other.id !== unit.id &&
            other.owner === unit.owner &&
            Math.abs(other.position.x - unit.position.x) <= 1 &&
            Math.abs(other.position.y - unit.position.y) <= 1
        );

        let healing = 0;
        nearbyAllies.forEach((ally) => {
            const healingRate = ally.bonuses?.healingRate || 0;
            if (healingRate <= 0) return;
            healing += Math.max(2, Math.floor(healingRate * 0.65));
        });

        return healing;
    }

    processUnitHealing() {
        this.units.forEach((unit) => {
            if (unit.currentHealth <= 0) return;
            // Carried units are off-map while embarked and do not heal independently.
            if (unit.isCarried) return;

            const tile = gameMap?.getTile(unit.position.x, unit.position.y);
            if (!tile) return;

            let healAmount = 0;
            const onFriendlyTown = Boolean(tile.cityData) && tile.owner === unit.owner;
            if (onFriendlyTown) healAmount += 12;
            if (unit.fortified) healAmount += 8;
            healAmount += this.getAdjacentSupportHealing(unit);

            if (healAmount <= 0) return;
            unit.currentHealth = Math.min(unit.stats.health, unit.currentHealth + healAmount);

            if (unit.owner === 'player') {
                const fort = tile.fort;
                if (fort && fort.owner === 'player') {
                    fort.health = Math.min(fort.maxHealth || 90, (fort.health || 0) + 5);
                }
            }
        });
    }

    processAutomatedUnits() {
        const hostileEnemyUnitsNearCities = this.getHostileEnemyUnitsNearPlayerCities(8);
        this.units.forEach(unit => {
            if (unit.owner === 'player' && !unit.isCarried && (unit.destination || unit.automated)) {
                this.processUnitDestination(unit);
                if (unit.automated) {
                    this.processUnitAutomation(unit, hostileEnemyUnitsNearCities);
                }
            }
        });
    }

    revealCarriedUnitVision() {
        if (!gameMap) return;
        this.units.forEach((transport) => {
            if (transport.owner !== 'player' || !Array.isArray(transport.carryingUnits) || transport.carryingUnits.length === 0) return;
            if (!Number.isFinite(transport.position?.x) || !Number.isFinite(transport.position?.y)) return;
            transport.carryingUnits.forEach((entry) => {
                const carriedId = (entry && typeof entry === 'object') ? entry.id : entry;
                const carriedUnit = this.units.find(u => u.id === carriedId);
                if (!carriedUnit || !carriedUnit.isCarried) return;
                gameMap.revealArea(transport.position.x, transport.position.y, 3);
            });
        });
    }

    processUnitDestination(unit, options = {}) {
        if (!unit.destination) return;
        const suppressVisibilityRefresh = options?.suppressVisibilityRefresh === true;
        const suppressRender = options?.suppressRender === true;

        let safety = 0;
        let movedAny = false;
        // Keep moving as long as we have movement and haven't reached destination
        while (unit.currentMovement > 0.3 && unit.destination && safety < 12) {
            safety++;
            const dx = unit.destination.x - unit.position.x;
            const dy = unit.destination.y - unit.position.y;

            if (Math.abs(dx) <= 0 && Math.abs(dy) <= 0) {
                unit.destination = null;
                break;
            }

            // Find best next step (Manhattan-ish but checking multiple options)
            const candidates = [];
            if (dx !== 0) candidates.push({ x: unit.position.x + Math.sign(dx), y: unit.position.y });
            if (dy !== 0) candidates.push({ x: unit.position.x, y: unit.position.y + Math.sign(dy) });

            const fromTile = gameMap.getTile(unit.position.x, unit.position.y);
            const ranked = candidates
                .map(pos => {
                    const toTile = gameMap.getTile(pos.x, pos.y);
                    const cost = this.getTerrainMoveCost(unit, fromTile, toTile);
                    const dist = Math.abs(unit.destination.x - pos.x) + Math.abs(unit.destination.y - pos.y);
                    return { ...pos, cost, dist };
                })
                .filter(c => c.cost <= unit.currentMovement && c.cost < 99)
                .sort((a, b) => a.dist - b.dist || a.cost - b.cost);

            if (ranked.length > 0) {
                const next = ranked[0];
                const prevPos = { ...unit.position };
                const moved = this.moveUnit(unit.id, { x: next.x, y: next.y }, {
                    suppressVisibilityRefresh: true,
                    suppressRender: true
                });
                if (!moved || (unit.position.x === prevPos.x && unit.position.y === prevPos.y)) {
                    // Blocked by enemy or something
                    break;
                }
                movedAny = true;
            } else {
                // Not enough movement left for any step
                break;
            }
        }

        if (movedAny && unit.owner === 'player' && !suppressVisibilityRefresh) {
            this.refreshPlayerVisibility({ suppressRender });
        }
    }

    processUnitAutomation(unit, hostileEnemyUnits = null) {
        if (!gameMap) return;
        if (unit.typeId === 'civil_engineers') {
            const tile = gameMap.getTile(unit.position.x, unit.position.y);
            const nearbyHostileEnemies = Array.isArray(hostileEnemyUnits)
                ? hostileEnemyUnits
                : this.getHostileEnemyUnitsNearPlayerCities(8);
            if (tile?.cityData && tile.owner === 'player' && unit.currentMovement >= 0.5) {
                const improvedCity = this.processEngineerCityInfrastructure(unit, tile, nearbyHostileEnemies);
                if (improvedCity) return;
            }
            // If on a tile without road, build one
            if (tile && !tile.road && tile.terrain !== 'water' && tile.terrain !== 'mountains' && !tile.cityData) {
                if (unit.currentMovement >= 0.5) {
                    this.applyUnitBuildAction(unit, 'build_road');
                }
            } else if (unit.currentMovement >= 1) {
                // If not building, or finished building, find next target
                if (!unit.destination) {
                    const target = this.findNearestUnroadedTile(unit.position);
                    if (target) {
                        unit.destination = target;
                        this.processUnitDestination(unit);
                    }
                }
            }
        } else if (unit.typeId === 'explorer' || unit.typeId === 'merchant_ship') {
            this.processAutoScoutAutomation(unit);
        }
    }

    processAutoScoutAutomation(unit) {
        if (!unit || !gameMap) return;
        if (unit.typeId !== 'explorer' && unit.typeId !== 'merchant_ship') return;
        if (!Number.isFinite(unit.position?.x) || !Number.isFinite(unit.position?.y)) return;

        let safety = 0;
        let movedAny = false;
        while (unit.currentMovement > 0.3 && safety < 8) {
            safety++;
            const nextStep = this.pickExplorerAutoStep(unit);
            if (!nextStep) break;
            const moved = this.moveUnit(unit.id, nextStep, {
                suppressVisibilityRefresh: true,
                suppressRender: true
            });
            if (!moved) break;
            movedAny = true;
        }

        if (movedAny && unit.owner === 'player') {
            this.refreshPlayerVisibility();
        }

        if (unit.currentMovement <= 0.3 || unit.destination) return;
        const fallbackTarget = this.findNearestUnexploredTile(unit.position, 28, unit);
        if (fallbackTarget) {
            unit.destination = fallbackTarget;
            this.processUnitDestination(unit, { suppressVisibilityRefresh: false });
        }
    }

    pickExplorerAutoStep(unit) {
        if (!unit || !gameMap) return null;
        const fromTile = gameMap.getTile(unit.position.x, unit.position.y);
        if (!fromTile) return null;
        const visionRadius = typeof gameMap.getUnitVisionRadius === 'function'
            ? gameMap.getUnitVisionRadius(unit)
            : 3;

        const offsets = [
            { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
        ];

        const scored = offsets
            .map((offset) => {
                const nx = unit.position.x + offset.x;
                const ny = unit.position.y + offset.y;
                const toTile = gameMap.getTile(nx, ny);
                if (!toTile) return null;
                if (toTile.terrain === 'water' && !this.isWaterCapable(unit)) return null;
                if (toTile.terrain !== 'water' && this.isWaterOnlyUnit(unit)) return null;
                if (toTile.fort && toTile.fort.owner !== unit.owner) return null;
                const occupiedByEnemy = this.units.some((other) =>
                    other?.id !== unit.id
                    && other?.owner === 'enemy'
                    && other.position?.x === nx
                    && other.position?.y === ny
                );
                if (occupiedByEnemy) return null;
                const travelCost = this.getTerrainMoveCost(unit, fromTile, toTile);
                if (!Number.isFinite(travelCost) || travelCost > unit.currentMovement || travelCost >= 99) return null;

                let fogScore = 0;
                for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                    for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                        const tx = nx + dx;
                        const ty = ny + dy;
                        if (tx < 0 || tx >= gameMap.width || ty < 0 || ty >= gameMap.height) continue;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > visionRadius) continue;
                        if (gameMap.isFoggedTile(tx, ty)) fogScore += 3;
                        else if (!gameMap.isTileVisible(tx, ty)) fogScore += 1;
                    }
                }

                return {
                    x: nx,
                    y: ny,
                    score: fogScore - (travelCost * 0.4) + (Math.random() * 0.05)
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score);

        if (scored.length === 0) return null;
        return { x: scored[0].x, y: scored[0].y };
    }

    findNearestUnexploredTile(origin, maxRadius = 24, unit = null) {
        if (!origin || !gameMap) return null;
        for (let r = 1; r <= maxRadius; r++) {
            for (let dy = -r; dy <= r; dy++) {
                const remaining = r - Math.abs(dy);
                for (let dx = -remaining; dx <= remaining; dx++) {
                    const x = origin.x + dx;
                    const y = origin.y + dy;
                    const tile = gameMap.getTile(x, y);
                    if (!tile || !gameMap.isFoggedTile(x, y)) continue;
                    if (unit && tile.terrain === 'water' && !this.isWaterCapable(unit)) continue;
                    if (unit && tile.terrain !== 'water' && this.isWaterOnlyUnit(unit)) continue;
                    return { x, y };
                }
            }
        }
        return null;
    }

    getHostileEnemyUnitsNearPlayerCities(maxDistance = 7) {
        if (!gameMap) return [];
        const playerCities = gameMap.getCityTiles('player') || [];
        if (playerCities.length === 0) return [];
        return this.units.filter((unit) => {
            if (!unit || unit.owner !== 'enemy' || !unit.position) return false;
            const factionId = this.resolveUnitFactionForDiplomacy(unit);
            if (!this.isFactionHostileToPlayer(factionId)) return false;
            return playerCities.some((city) =>
                Math.abs(city.x - unit.position.x) + Math.abs(city.y - unit.position.y) <= maxDistance
            );
        });
    }

    isCityUnderHostileThreat(cityTile, hostileEnemyUnits = [], maxDistance = 6) {
        if (!cityTile || !Array.isArray(hostileEnemyUnits) || hostileEnemyUnits.length === 0) return false;
        return hostileEnemyUnits.some((enemy) =>
            Math.abs(cityTile.x - enemy.position.x) + Math.abs(cityTile.y - enemy.position.y) <= maxDistance
        );
    }

    pickAutoBuildingOption(cityTile, prioritizeDefense = false) {
        const options = this.getCityBuildingOptions(cityTile).filter((entry) => entry.available);
        if (options.length === 0) return null;
        const priority = prioritizeDefense
            ? ['walls', 'barracks', 'mine', 'workshop', 'farm', 'temple']
            : ['farm', 'mine', 'workshop', 'temple', 'barracks', 'walls'];
        for (const buildingId of priority) {
            const match = options.find((entry) => entry.id === buildingId);
            if (match) return match;
        }
        return options[0];
    }

    getEngineerInfrastructurePriorityActions(cityTile, prioritizeDefense = false) {
        if (!cityTile?.cityData) return [];
        const cityData = cityTile.cityData;
        const infra = cityData.infrastructure || {};
        const actions = prioritizeDefense
            ? ['build_fort', 'build_road', 'establish_monastery', 'build_port', 'build_farm', 'irrigate']
            : ['build_farm', 'irrigate', 'plant_forest', 'build_caravan_camp', 'build_road', 'build_port', 'build_canal', 'establish_monastery', 'build_fort'];
        return actions.filter((actionId) => {
            if (!BUILD_ACTIONS[actionId]) return false;
            const requiredTech = this.getTechnologyIdUnlockingBuildAction(actionId);
            if (requiredTech && !this.player?.techResearched?.includes(requiredTech)) return false;
            if (actionId === 'build_port' && cityData.port) return false;
            if (actionId === 'build_caravan_camp' && cityData.caravanCamp) return false;
            if (actionId === 'build_canal' && cityData.canal) return false;
            if (actionId === 'establish_monastery' && cityData.monastery) return false;
            if (actionId === 'build_road' && (infra.roads || 0) >= 8) return false;
            if (actionId === 'build_farm' && (infra.agriculture || 0) >= 8) return false;
            if (actionId === 'build_fort' && (cityData.fortLevel || 0) >= 6) return false;
            return true;
        });
    }

    processEngineerCityInfrastructure(unit, cityTile, hostileEnemyUnits = []) {
        if (!unit || unit.typeId !== 'civil_engineers' || !cityTile?.cityData || cityTile.owner !== 'player') return false;
        const prioritizeDefense = this.isCityUnderHostileThreat(cityTile, hostileEnemyUnits, 7);
        const priorityActions = this.getEngineerInfrastructurePriorityActions(cityTile, prioritizeDefense);
        for (const actionId of priorityActions) {
            const result = this.applyCityBuildAction(cityTile, actionId);
            if (result?.success) {
                unit.currentMovement = 0;
                if (window.uiManager) {
                    uiManager.showNotification(
                `${cityTile.cityData?.name || `Cidade ${cityTile.x},${cityTile.y}`}: Engenheiros melhoraram a infraestrutura (${result.actionName})`,
                'info'
            );
                }
                return true;
            }
        }
        return false;
    }

    processCityAutoBuildTurn() {
        if (!gameMap) return [];
        const hostileEnemyUnits = this.getHostileEnemyUnitsNearPlayerCities(8);
        const started = [];
        (gameMap.getCityTiles('player') || []).forEach((cityTile) => {
            const cityData = this.ensureCityBuildingState(cityTile);
            if (!cityData?.autoBuildEnabled || cityData.construction) return;
            const prioritizeDefense = this.isCityUnderHostileThreat(cityTile, hostileEnemyUnits, 7);
            const option = this.pickAutoBuildingOption(cityTile, prioritizeDefense);
            if (!option) return;
            const result = this.startCityBuildingProject(cityTile, option.id);
            if (!result.success) return;
            started.push({
                cityName: cityTile.cityData?.name || `${cityTile.x},${cityTile.y}`,
                buildingName: result.buildingName,
                level: result.targetLevel,
                turns: result.turns
            });
        });
        if (started.length > 0 && window.uiManager) {
            started.forEach((entry) => {
                uiManager.showNotification(
                    `${entry.cityName}: Automático ON iniciou ${entry.buildingName} N${entry.level} (${entry.turns} turnos)`,
                    'info'
                );
            });
        }
        return started;
    }

    findNearestUnroadedTile(pos) {
        if (!gameMap) return null;
        for (let r = 1; r < 15; r++) {
            for (let dy = -r; dy <= r; dy++) {
                const remaining = r - Math.abs(dy);
                for (let dx = -remaining; dx <= remaining; dx++) {
                    const x = pos.x + dx;
                    const y = pos.y + dy;
                    const tile = gameMap.getTile(x, y);
                    if (tile && !tile.road && tile.terrain !== 'water' && tile.terrain !== 'mountains' && !tile.cityData) {
                        return { x, y };
                    }
                }
            }
        }
        return null;
    }

    applyUnitBuildAction(unit, actionId) {
        const tile = gameMap.getTile(unit.position.x, unit.position.y);
        if (!tile) return { success: false, message: 'Invalido tile' };

        const action = BUILD_ACTIONS[actionId];
        if (!action) return { success: false, message: 'Ação invalida' };
        const requiredTech = this.getTechnologyIdUnlockingBuildAction(actionId);
        if (requiredTech && !this.player.techResearched.includes(requiredTech)) {
            const techName = TECHNOLOGY_TREE[requiredTech]?.name || requiredTech;
            return { success: false, message: `${action.name} requer ${techName}` };
        }

        if (!this.spendResources(action.gold, action.manpower, action.prestige || 0)) {
            return { success: false, message: `Precisa de ${action.gold}g/${action.manpower}m/${action.prestige || 0}p` };
        }

        if (actionId === 'build_road') {
            tile.road = 'dirt';
            if (tile.cityData) {
                const infra = tile.cityData.infrastructure || (tile.cityData.infrastructure = {});
                infra.roads = Math.min((infra.roads || 0) + 1, 8);
                this.expandRoadNetworkFromCity(tile);
            }
            if (unit.owner === 'player' && typeof achievementManager !== 'undefined') {
                achievementManager.recordRoadBuilt();
            }
        }

        unit.currentMovement = 0;
        gameMap?.requestRender();
        return { success: true, actionName: action.name };
    }


    createStartingUnits(faction, scenario) {
        const leaderStartProfile = this.getLeaderStartProfile(faction);
        const nomadicBuildStart = this.isNomadicBuildStart(leaderStartProfile, scenario);
        const playerCities = gameMap.getCityTiles('player');
        if (playerCities.length === 0 && !nomadicBuildStart) return;

        let startPos = null;
        let anchorCity = null;
        if (playerCities.length > 0) {
            anchorCity = playerCities.find((tile) => tile.cityData?.capitalRole === 'primary')
                || playerCities.find((tile) => tile.cityData?.id === leaderStartProfile.startTownId)
                || playerCities.find(t => t.cityData?.kind === 'capital')
                || playerCities[0];
            startPos = { x: anchorCity.x, y: anchorCity.y };
        } else if (nomadicBuildStart) {
            const anchorTown = HISTORIC_TOWNS.find(t => t.id === leaderStartProfile.startTownId);
            if (anchorTown) startPos = { x: anchorTown.x, y: anchorTown.y };
        }
        if (!startPos) return;

        const baseUnits = scenario === SCENARIOS.empire
            ? [
                { type: 'skutatoi', count: 5 },
                { type: 'kavallarioi', count: 4 },
                { type: 'archers', count: 3 },
                { type: 'civil_engineers', count: 1 }
            ]
            : [
                { type: 'skutatoi', count: 2 },
                { type: 'kavallarioi', count: 1 },
                { type: 'archers', count: 2 },
                { type: 'civil_engineers', count: 1 }
            ];

        const nomadicUnits = [
            { type: 'kavallarioi', count: 3 },
            { type: 'archers', count: 2 },
            { type: 'horsearchers', count: 2 },
            { type: 'explorer', count: 1 }
        ];
        const unitPlan = nomadicBuildStart ? nomadicUnits : baseUnits;

        unitPlan.forEach(({ type, count }) => {
            for (let i = 0; i < count; i++) {
                const preferredOffset = { x: i % 3 - 1, y: Math.floor(i / 3) - 1 };
                const spawnPos = this.findAvailableSpawnPosition(startPos.x, startPos.y, [preferredOffset], 4);
                if (!spawnPos) continue;
                const unit = createUnit(type, spawnPos, 'player');
                if (!unit) continue;
                this.applyFactionUnitNaming(unit, faction);
                this.units.push(unit);
                this.player.unitsOwned.push(unit.id);
                gameMap.revealArea(unit.position.x, unit.position.y, 3);
            }
        });

        // Empire scenario starts with distributed garrisons.
        if (scenario === SCENARIOS.empire) {
            playerCities.forEach((city, idx) => {
                if (city === anchorCity) return;
                const garrisonType = idx % 2 === 0 ? 'skutatoi' : 'archers';
                const spawnPos = this.findAvailableSpawnPosition(
                    city.x,
                    city.y,
                    [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }],
                    3
                );
                if (!spawnPos) return;
                const garrison = createUnit(garrisonType, spawnPos, 'player');
                if (!garrison) return;
                this.applyFactionUnitNaming(garrison, faction);
                this.units.push(garrison);
                this.player.unitsOwned.push(garrison.id);
                gameMap.revealArea(garrison.position.x, garrison.position.y, 2);
            });
        }

        if (nomadicBuildStart && window.uiManager) {
            uiManager.showNotification(
                `${this.selectedLeader?.name || 'Este líder'} começa como um exército de campo e deve dominar uma cidade para estabelecer uma base`,
                'info'
            );
        }
    }

    spawnFactionArmyAtTown(town, owner, faction, unitCount = 2) {
        const roster = this.getFactionArmyRoster(town, owner, faction);
        if (roster.length === 0) return false;
        let spawnedAny = false;
        for (let i = 0; i < unitCount; i++) {
            const preferredOffset = { x: i % 2, y: 1 + Math.floor(i / 2) };
            const spawnPos = this.findAvailableSpawnPosition(town.x, town.y, [preferredOffset], 3);
            if (!spawnPos) continue;
            // Defensive guard: never allow spawning on the town tile itself.
            if (spawnPos.x === town.x && spawnPos.y === town.y) continue;
            const unitType = roster[(this.turn + i) % roster.length];
            const unit = createUnit(unitType, spawnPos, owner);
            if (!unit) continue;
            this.applyFactionUnitNaming(unit, faction);
            this.applySpawnProgression(unit, owner);
            this.units.push(unit);
            spawnedAny = true;
        }
        return spawnedAny;
    }

    getCurrentEraTag() {
        const century = Number(this.selectedCentury || 6);
        if (century <= 7) return 'early';
        if (century <= 10) return 'middle';
        return 'late';
    }

    getFactionArmyRoster(town, owner, faction) {
        const era = this.getCurrentEraTag();
        const eligible = getUnitsByEra(era).filter((u) => this.isCombatRosterUnit(u));
        const factionBias = {
            byzantine: ['skutatoi', 'archers', 'kavallarioi', 'cataphract', 'mangonel'],
            arab: ['horsearchers', 'camel_riders', 'archers', 'kavallarioi'],
            bulgar: ['mountain_infantry', 'skutatoi', 'archers', 'kavallarioi'],
            frank: ['skutatoi', 'kavallarioi', 'cataphract', 'engineers'],
            sassanid: ['horsearchers', 'camel_riders', 'kavallarioi', 'archers'],
            tribal: ['skutatoi', 'archers', 'kavallarioi', 'psilos']
        };
        const biasPool = factionBias[faction] || factionBias.tribal;
        const cityTerrain = gameMap?.getTile(town.x, town.y)?.terrain || 'plains';
        const roster = [];

        const pushIfValid = (unitId, weight = 1) => {
            const unit = getUnitById(unitId);
            if (!unit || !unit.era?.includes(era)) return;
            if (!this.isCombatRosterUnit(unit)) return;
            if (unit.category === 'desert' && cityTerrain === 'water') return;
            const repeats = Math.max(1, Math.floor(weight));
            for (let i = 0; i < repeats; i++) roster.push(unitId);
        };

        biasPool.forEach((unitId) => pushIfValid(unitId, 2));
        eligible.forEach((unit) => {
            let weight = 1;
            if (unit.type === 'infantry') weight += 1;
            if (unit.type === 'cavalry') weight += 1;
            if (unit.category === 'elite' || unit.category === 'superheavy') weight = Math.max(1, weight - 1);
            pushIfValid(unit.id, weight);
        });

        if (owner === 'player') return roster;

        // AI factions can field advanced units in later turns to reflect progression.
        if (this.turn > 20) {
            ['varangian', 'tagmata', 'mangonel'].forEach((unitId) => pushIfValid(unitId, 1));
        }
        if (this.turn > 35) {
            ['klibanophoroi', 'war_elephants'].forEach((unitId) => pushIfValid(unitId, 1));
        }

        return roster.length > 0 ? roster : ['skutatoi', 'archers', 'kavallarioi'];
    }

    applySpawnProgression(unit, owner = 'enemy') {
        if (!unit || owner !== 'enemy') return;
        const baseXP = Math.max(0, Math.floor(this.turn * 1.8));
        unit.experience = baseXP;
        // Spawned veteran armies may level and promote as the campaign matures.
        checkLevelUp(unit);
    }

    isCombatRosterUnit(unit) {
        if (!unit || unit.type === 'naval') return false;
        const nonCombatCategories = new Set(['support', 'economic', 'scout', 'intel', 'infrastructure', 'transport']);
        if (nonCombatCategories.has(unit.category)) return false;
        return unit.type === 'infantry' || unit.type === 'cavalry' || unit.category === 'siege' || unit.category === 'shock';
    }

    createEnemyUnits(scenario) {
        const enemyCities = gameMap.getCityTiles('enemy');
        const neutralCities = gameMap.getCityTiles('neutral');

        enemyCities.forEach((cityTile) => {
            const town = HISTORIC_TOWNS.find(t => t.x === cityTile.x && t.y === cityTile.y);
            if (!town) return;
            const count = scenario === SCENARIOS.empire ? 3 : 2;
            this.spawnFactionArmyAtTown(town, 'enemy', cityTile.faction || 'tribal', count);
        });

        // In build scenario, some neutral towns have only light tribal defense.
        if (scenario === SCENARIOS.building) {
            neutralCities.forEach((cityTile, index) => {
                if (index % 3 !== 0) return;
                const town = HISTORIC_TOWNS.find(t => t.x === cityTile.x && t.y === cityTile.y);
                if (!town) return;
                this.spawnFactionArmyAtTown(town, 'enemy', cityTile.faction || 'tribal', 1);
            });
        }
    }

    /**
     * Add resources to player
     */
    addResources(gold = 0, manpower = 0, prestige = 0) {
        this.ensureStrategicResourceStockpile();
        this.player.resources.gold += gold;
        this.player.resources.manpower += manpower;
        this.player.resources.prestige += prestige;

        // Ensure resources don't go negative
        this.player.resources.gold = Math.max(0, this.player.resources.gold);
        this.player.resources.manpower = Math.max(0, this.player.resources.manpower);
        this.player.resources.prestige = Math.max(0, this.player.resources.prestige);

        if (gold > 0 && typeof achievementManager !== 'undefined') achievementManager.syncResourcePeak();
    }

    ensureStrategicResourceStockpile() {
        if (!this.player) return;
        if (!this.player.resources) this.player.resources = {};
        const normalizeResourceValue = (value) => {
            const num = Number(value);
            if (!Number.isFinite(num) || num <= 0) return 0;
            return Math.floor(num);
        };
        this.player.resources.gold = normalizeResourceValue(this.player.resources.gold);
        this.player.resources.manpower = normalizeResourceValue(this.player.resources.manpower);
        this.player.resources.prestige = normalizeResourceValue(this.player.resources.prestige);
        STRATEGIC_RESOURCE_KEYS.forEach((key) => {
            this.player.resources[key] = normalizeResourceValue(this.player.resources[key]);
        });
    }

    addStrategicResources(resourceDeltas = {}) {
        if (!this.player) return;
        this.ensureStrategicResourceStockpile();
        let foodAdded = false;
        STRATEGIC_RESOURCE_KEYS.forEach((key) => {
            const delta = Number(resourceDeltas[key] || 0);
            if (!Number.isFinite(delta) || delta === 0) return;
            this.player.resources[key] = Math.max(0, Math.floor(this.player.resources[key] + delta));
            if (key === 'food' && delta > 0) foodAdded = true;
        });
        if (foodAdded && typeof achievementManager !== 'undefined') achievementManager.syncResourcePeak();
    }

    getCityTerrainAccess(cityTile) {
        if (!gameMap || !cityTile) {
            return {
                fertile: false,
                river: false,
                coast: false,
                nearbyResources: { food: 0, wood: 0, stone: 0, iron: 0, rare: 0 }
            };
        }
        const neighborhood = gameMap.getTileNeighborhood(cityTile.x, cityTile.y, 1);
        return {
            fertile: gameMap.isFertileTile(cityTile.x, cityTile.y) || neighborhood.some((t) => gameMap.isFertileTile(t.x, t.y)),
            river: gameMap.isRiverTile(cityTile.x, cityTile.y) || neighborhood.some((t) => gameMap.isRiverTile(t.x, t.y)),
            coast: gameMap.isCoastalTile(cityTile.x, cityTile.y) || neighborhood.some((t) => gameMap.isCoastalTile(t.x, t.y)),
            nearbyResources: gameMap.getNearbyResourceYields(cityTile.x, cityTile.y, 2)
        };
    }

    /**
     * Spend resources
     */
    spendResources(gold = 0, manpower = 0, prestige = 0) {
        if (this.canAfford(gold, manpower, prestige)) {
            this.addResources(-gold, -manpower, -prestige);
            return true;
        }
        return false;
    }

    /**
     * Check if player can afford costs
     */
    canAfford(gold = 0, manpower = 0, prestige = 0) {
        return this.player.resources.gold >= gold &&
            this.player.resources.manpower >= manpower &&
            this.player.resources.prestige >= prestige;
    }

    /**
     * Recruit a new unit
     */
    recruitUnit(unitTypeId, position, options = {}) {
        const unitType = getUnitById(unitTypeId);
        if (!unitType) return null;
        const tile = gameMap?.getTile(position?.x, position?.y);
        if (!tile) return null;
        const occupied = this.units.some(u => u.position.x === position.x && u.position.y === position.y);
        if (occupied) return null;

        const waterCapable = unitType.type === 'naval' || unitType.category === 'transport' || unitType.bonuses?.waterTraversal;
        const waterOnly = unitType.type === 'naval' || unitType.category === 'transport';
        if (tile.terrain === 'water' && !waterCapable) return null;
        if (tile.terrain !== 'water' && waterOnly) return null;

        const sourceCity = options.cityTile || null;
        if (!options.skipCost) {
            const recruitCost = this.getRecruitmentCost(unitTypeId, sourceCity);
            if (!recruitCost) return null;
            if (!this.canAfford(recruitCost.gold, recruitCost.manpower)) return null;
            this.spendResources(recruitCost.gold, recruitCost.manpower);
        }

        // Create unit
        const unit = createUnit(unitTypeId, position, options.owner || 'player');
        if (unit) {
            const faction = options.faction || this.player?.faction || this.selectedFaction || 'byzantine';
            this.applyFactionUnitNaming(unit, faction);
            const barracksLevel = this.getCityBuildingLevel(sourceCity, 'barracks');
            if (barracksLevel > 0) {
                // Each barracks level grants a fixed onboarding XP bonus (+8) so trained cities produce
                // units with a meaningful, but not veteran-level, head start.
                unit.experience = (unit.experience || 0) + (barracksLevel * CITY_BUILDING_BALANCE.barracksRecruitXpPerLevel);
            }
            this.units.push(unit);
            if (unit.owner === 'player' && Array.isArray(this.player?.unitsOwned)) {
                this.player.unitsOwned.push(unit.id);
            }
        }

        return unit;
    }

    queueUnitRecruitment(unitTypeId, cityTile) {
        const status = this.getRecruitmentOptionStatus(cityTile, unitTypeId);
        if (!status.available) {
            return {
                success: false,
                reasons: status.reasons || ['Requisitos de recrutamento não atendidos']
            };
        }

        const cost = status.finalCost || this.getRecruitmentCost(unitTypeId, cityTile);
        if (!cost || !this.canAfford(cost.gold, cost.manpower)) {
            return {
                success: false,
                reasons: ['Recursos insuficientes']
            };
        }

        const barracksLevel = this.getCityBuildingLevel(cityTile, 'barracks');
        const recruitmentSpeed = Number(this.player?.bonuses?.recruitmentSpeed || 1);
        const trainingTurns = getUnitTrainingTurns(unitTypeId, { barracksLevel, recruitmentSpeed });

        if (trainingTurns === 0) {
            const spawnTile = this.getRecruitSpawnTile(cityTile, unitTypeId);
            if (!spawnTile) {
                const unitType = getUnitById(unitTypeId);
                const isNaval = unitType?.type === 'naval' || unitType?.category === 'transport';
                return {
                    success: false,
                    reasons: [isNaval ? 'Nenhum piso de água livre por perto' : 'Nenhum piso de terra livre por perto']
                };
            }
            if (!this.spendResources(cost.gold, cost.manpower)) {
                return { success: false, reasons: ['Recursos insuficientes'] };
            }
            const unit = this.recruitUnit(unitTypeId, spawnTile, {
                cityTile,
                skipCost: true,
                owner: 'player',
                faction: this.player?.faction || this.selectedFaction || 'byzantine'
            });
            if (!unit) {
                this.addResources(cost.gold, cost.manpower);
                return { success: false, reasons: ['Falha no recrutamento'] };
            }
            return {
                success: true,
                instantSpawn: true,
                unit,
                project: { unitTypeId, turnsRemaining: 0, totalTurns: 0 }
            };
        }

        if (!this.spendResources(cost.gold, cost.manpower)) {
            return { success: false, reasons: ['Recursos insuficientes'] };
        }
        const queue = this.ensureCityTrainingQueue(cityTile);
        const project = {
            id: `train_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            unitTypeId,
            turnsRemaining: trainingTurns,
            totalTurns: trainingTurns,
            queuedTurn: this.turn
        };
        queue.push(project);
        return {
            success: true,
            project,
            queueLength: queue.length
        };
    }

    ensureCityTrainingQueue(cityTile) {
        if (!cityTile?.cityData) return [];
        if (!Array.isArray(cityTile.cityData.trainingQueue)) {
            cityTile.cityData.trainingQueue = [];
        }
        return cityTile.cityData.trainingQueue;
    }

    processUnitTrainingTurn() {
        if (!gameMap) return [];
        const completed = [];
        const playerCities = gameMap.getCityTiles('player');
        for (const cityTile of playerCities) {
            let queue = this.ensureCityTrainingQueue(cityTile);
            if (!queue.length) continue;
            // Barracks-centric pacing: each city progresses one training project per turn.
            const active = queue[0];
            const rawTurns = Number(active.turnsRemaining);
            const safeTurns = Number.isFinite(rawTurns) ? rawTurns : 0;
            active.turnsRemaining = Math.max(0, safeTurns - 1);
            if (active.turnsRemaining > 0) continue;

            const cityName = cityTile.cityData?.name || `${cityTile.x},${cityTile.y}`;
            const spawnTile = this.getRecruitSpawnTile(cityTile, active.unitTypeId);
            if (!spawnTile) {
                active.turnsRemaining = 0;
                const activeUnitType = getUnitById(active.unitTypeId);
                const isNaval = activeUnitType?.type === 'naval' || activeUnitType?.category === 'transport';
                active.blocked = isNaval ? 'Nenhum piso de água livre por perto' : 'Nenhum piso de terra livre por perto';
                const shouldNotifyBlocked = !active.blockedNotified || active.lastBlockedReason !== active.blocked;
                active.lastBlockedReason = active.blocked;
                active.blockedNotified = true;
                if (queue.length > 1) {
                    queue.push(queue.shift());
                }
                if (shouldNotifyBlocked) {
                    completed.push({
                        cityName,
                        blocked: true,
                        reason: active.blocked
                    });
                }
                continue;
            }

            const unit = this.recruitUnit(active.unitTypeId, spawnTile, {
                cityTile,
                skipCost: true,
                owner: 'player',
                faction: this.player?.faction || this.selectedFaction || 'byzantine'
            });
            // recruitUnit → getCityBuildingLevel → ensureCityBuildingState replaces
            // cityTile.cityData.trainingQueue with a new array. Re-fetch so structural
            // ops (shift/push) act on the live array, not the stale local reference.
            queue = this.ensureCityTrainingQueue(cityTile);
            if (!unit) {
                active.turnsRemaining = 0;
                if (!active.blocked) {
                    active.blocked = 'Falha no recrutamento';
                }
                const shouldNotifyBlocked = !active.blockedNotified || active.lastBlockedReason !== active.blocked;
                active.lastBlockedReason = active.blocked;
                active.blockedNotified = true;
                if (queue.length > 1) {
                    queue.push(queue.shift());
                }
                if (shouldNotifyBlocked) {
                    completed.push({
                        cityName,
                        blocked: true,
                        reason: active.blocked
                    });
                }
                continue;
            }

            queue.shift();
            completed.push({
                cityName,
                unit
            });
        }
        return completed;
    }

    getRecruitSpawnTile(cityTile, unitTypeId) {
        if (!cityTile || !Number.isFinite(cityTile.x) || !Number.isFinite(cityTile.y) || !gameMap) return null;
        const unitType = getUnitById(unitTypeId);
        if (!unitType) return null;

        const wantsWater = unitType.type === 'naval' || unitType.category === 'transport' || unitType.bonuses?.waterTraversal;

        // Build a one-shot Set of occupied "x,y" strings so each candidate-tile
        // check is O(1) instead of O(unitCount). Called from turn processing
        // and recruitment option evaluation, so the scan dominates otherwise.
        const occupied = new Set();
        for (const u of this.units) {
            const pos = u.position;
            if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
                occupied.add(`${pos.x},${pos.y}`);
            }
        }

        for (let radius = 1; radius <= 3; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
                    const x = cityTile.x + dx;
                    const y = cityTile.y + dy;
                    const mapTile = gameMap.getTile(x, y);
                    if (!mapTile) continue;
                    if (wantsWater && mapTile.terrain !== 'water') continue;
                    if (!wantsWater && mapTile.terrain === 'water') continue;
                    if (occupied.has(`${x},${y}`)) continue;
                    return { x, y };
                }
            }
        }

        return null;
    }

    getRecruitmentOptionStatus(cityTile, unitId) {
        const unit = getUnitById(unitId);
        if (!unit) {
            return { unitId, unit: null, available: false, reasons: ['Dados da unidade ausentes'], spawnTile: null };
        }

        const reasons = [];
        if (!cityTile?.cityData) {
            return { unitId, unit, available: false, reasons: ['Requer uma cidade'], spawnTile: null };
        }

        const infra = cityTile.cityData.infrastructure || {};
        const researched = new Set(this.player?.techResearched || []);
        const hasPort = Boolean(cityTile.cityData.port || cityTile.cityData.navalYard);
        const technologyLock = this.getTechnologyIdUnlockingUnit(unitId);
        const unitsWithAlternativeInfraOrTech = new Set(['mangonel', 'spy', 'caravan', 'priests']);
        const shouldApplyTechnologyLock = !unitsWithAlternativeInfraOrTech.has(unitId);
        if (shouldApplyTechnologyLock && technologyLock && !researched.has(technologyLock)) {
            reasons.push(`Requires ${TECHNOLOGY_TREE[technologyLock]?.name || technologyLock}`);
        }
        const requireTech = (techId, label) => {
            if (!researched.has(techId)) reasons.push(`Requires ${label}`);
        };
        const requireInfra = (key, min, label) => {
            if ((infra[key] || 0) < min) reasons.push(`Requires ${label} ${min}`);
        };

        switch (unitId) {
           case 'engineers':
                requireInfra('industry', 2, 'Industry');
                break;
            case 'mangonel':
                if ((infra.industry || 0) < 3 && !researched.has('siegecraft')) reasons.push('Requer Indústria 3 ou Arte de Cerco');
                if (this.getCityBuildingLevel(cityTile, 'barracks') < 2) reasons.push('Requer Quartel Nível 2');
                break;
            case 'camel_riders':
                requireInfra('agriculture', 2, 'Agriculture');
                break;
            case 'explorer':
                requireInfra('roads', 1, 'Roads');
                break;
            case 'spy':
                if ((infra.roads || 0) < 3 && !researched.has('monastic_scholarship')) reasons.push('Requer Estradas 3 ou Erudição Monástica');
                break;
            case 'caravan':
                if ((infra.roads || 0) < 3 && !researched.has('caravan_routes')) reasons.push('Requer Estradas 3 ou Rotas de Caravana');
                break;
            case 'war_elephants':
                requireInfra('industry', 3, 'Industry');
                requireInfra('agriculture', 3, 'Agriculture');
                requireTech('cavalry_tactics', 'Cavalry Tactics');
                if (this.getCityBuildingLevel(cityTile, 'barracks') < 3) reasons.push('Requer Quartel Nível 3');
                break;
            case 'transport':
            case 'merchant_ship':
                if (!hasPort) reasons.push('Requer Porto / Estaleiro');
                break;
            case 'dromon':
            case 'dromon_greekfire':
                if (!hasPort) reasons.push('Requer Porto / Estaleiro Naval');
                requireTech('naval_architecture', 'Naval Architecture');
                break;
            case 'greekfire':
                requireInfra('industry', 4, 'Industry');
                requireTech('naval_architecture', 'Naval Architecture');
                break;
            case 'mountain_infantry':
                requireInfra('agriculture', 3, 'Agriculture');
                break;
            case 'priests':
                if (!cityTile.cityData.monastery && !researched.has('monastic_scholarship') && (infra.industry || 0) < 4) {
                    reasons.push('Requer Monastério, Erudição Monástica ou Indústria 4');
                }
                break;
            case 'healer':
                if ((infra.agriculture || 0) < 2 && !cityTile.cityData.monastery) reasons.push('Requer Agricultura 2 ou Monastério');
                break;
            default:
                break;
        }

        const resources = this.player?.resources || {};
        const finalCost = this.getRecruitmentCost(unitId, cityTile) || { gold: unit.cost?.gold || 0, manpower: unit.cost?.manpower || 0 };
        const trainingTurns = getUnitTrainingTurns(unitId, {
            barracksLevel: this.getCityBuildingLevel(cityTile, 'barracks'),
            recruitmentSpeed: Number(this.player?.bonuses?.recruitmentSpeed || 1)
        });
        const missingGold = Math.max(0, (finalCost.gold || 0) - (resources.gold || 0));
        const missingManpower = Math.max(0, (finalCost.manpower || 0) - (resources.manpower || 0));
        if (missingGold > 0 || missingManpower > 0) {
            const missing = [];
            if (missingGold > 0) missing.push(`${missingGold} gold`);
            if (missingManpower > 0) missing.push(`${missingManpower} manpower`);
            reasons.push(`Missing ${missing.join(', ')}`);
        }

        const spawnTile = this.getRecruitSpawnTile(cityTile, unitId);
        if (!spawnTile) {
            const isNaval = unit.type === 'naval' || unit.category === 'transport';
            reasons.push(isNaval ? 'Nenhum piso de água livre por perto' : 'Nenhum piso de terra livre por perto');
        }

        return {
            unitId,
            unit,
            available: reasons.length === 0,
            reasons,
            spawnTile,
            finalCost,
            trainingTurns,
            upkeep: Number(unit.upkeep || 0),
            upgradePath: getUnitUpgradePath(unitId)
        };
    }

    getRecruitmentOptions(cityTile) {
        return RECRUITMENT_UNIT_CATALOG
            .filter((unitId) => Boolean(getUnitById(unitId)))
            .map((unitId) => this.getRecruitmentOptionStatus(cityTile, unitId));
    }

    getRecruitableUnitTypes(cityTile) {
        if (!cityTile?.cityData) return ['skutatoi'];
        return this.getRecruitmentOptions(cityTile)
            .filter((entry) => entry.available)
            .map((entry) => entry.unitId);
    }

    getTechnologyIdUnlockingUnit(unitId) {
        for (const [techId, tech] of Object.entries(TECHNOLOGY_TREE)) {
            if (tech?.unlocks?.units?.includes(unitId)) return techId;
        }
        return null;
    }

    getTechnologyIdUnlockingBuildAction(actionId) {
        const directRequirement = BUILD_ACTIONS[actionId]?.requiresTech;
        if (directRequirement) return directRequirement;
        for (const [techId, tech] of Object.entries(TECHNOLOGY_TREE)) {
            if (tech?.unlocks?.buildActions?.includes(actionId)) return techId;
        }
        return null;
    }

    getResearchCost(techId) {
        const tech = TECHNOLOGY_TREE[techId];
        if (!tech) return null;
        const templeDiscount = Math.min(
            CITY_BUILDING_BALANCE.templeResearchDiscountCap,
            this.getTotalCityBuildingLevel('temple') * CITY_BUILDING_BALANCE.templeResearchDiscountPerLevel
        );
        const discount = Math.min(RESEARCH_DISCOUNT_CAP, (this.player?.techEffects?.researchDiscount || 0) + templeDiscount);
        return {
            discount,
            gold: Math.max(1, Math.floor((tech.cost?.gold || 0) * (1 - discount))),
            prestige: Math.max(1, Math.floor((tech.cost?.prestige || 0) * (1 - discount)))
        };
    }

    getTechnologyStatus(techId) {
        const researched = new Set(this.player?.techResearched || []);
        if (researched.has(techId)) return 'researched';
        if (this.player?.activeResearch?.techId === techId) return 'researching';
        const tech = TECHNOLOGY_TREE[techId];
        if (!tech) return 'locked';
        const requirementsMet = (tech.requires || []).every((req) => researched.has(req));
        return requirementsMet ? 'available' : 'locked';
    }

    getAvailableTechnologies() {
        return this.getTechnologyTreeState().filter((entry) => entry.status === 'available');
    }

    getTechnologyTreeState() {
        const researched = new Set(this.player?.techResearched || []);
        return Object.entries(TECHNOLOGY_TREE).map(([techId, tech]) => {
            const status = this.getTechnologyStatus(techId);
            const cost = this.getResearchCost(techId);
            return {
                id: techId,
                ...tech,
                researchTurns: Math.max(1, Number.isFinite(tech.researchTurns) ? Math.floor(tech.researchTurns) : 1),
                status,
                cost,
                missingRequirements: (tech.requires || [])
                    .filter((req) => !researched.has(req))
                    .map((req) => TECHNOLOGY_TREE[req]?.name || req)
            };
        });
    }

    applyTechnologyEffects(effects = {}) {
        const current = this.player.techEffects;
        if (effects.movement) current.movement += effects.movement;
        if (effects.foodMultiplier) current.foodMultiplier *= effects.foodMultiplier;
        if (effects.goldMultiplier) current.goldMultiplier *= effects.goldMultiplier;
        if (effects.manpowerMultiplier) current.manpowerMultiplier *= effects.manpowerMultiplier;
        if (effects.cavalryAttackMultiplier) current.cavalryAttackMultiplier *= effects.cavalryAttackMultiplier;
        if (effects.navalAttackMultiplier) current.navalAttackMultiplier *= effects.navalAttackMultiplier;
        if (effects.siegeAttackMultiplier) current.siegeAttackMultiplier *= effects.siegeAttackMultiplier;
        if (effects.researchDiscount) current.researchDiscount = Math.max(current.researchDiscount, effects.researchDiscount);
        if (effects.prestigePerTurn) current.prestigePerTurn += effects.prestigePerTurn;
        if (effects.tradePostBonus) current.tradePostBonus += effects.tradePostBonus;
        if (effects.navalMovement) current.navalMovement += effects.navalMovement;
        if (effects.tradeIncomeMultiplier) current.tradeIncomeMultiplier *= effects.tradeIncomeMultiplier;
        if (effects.diplomacyAcceptanceBonus) current.diplomacyAcceptanceBonus += effects.diplomacyAcceptanceBonus;
    }

    processResearchTurn() {
        const active = this.player?.activeResearch;
        if (!active) return { active: null, completed: null };
        const tech = TECHNOLOGY_TREE[active.techId];
        if (!tech) {
            this.player.activeResearch = null;
            return { active: null, completed: null };
        }

        active.turnsRemaining = Math.max(0, (active.turnsRemaining || 1) - 1);
        const progress = {
            techId: active.techId,
            name: active.name || tech.name,
            turnsRemaining: active.turnsRemaining,
            totalTurns: active.totalTurns || 1
        };
        if (active.turnsRemaining > 0) {
            return { active: progress, completed: null };
        }

        if (!this.player.techResearched.includes(active.techId)) {
            this.player.techResearched.push(active.techId);
            this.applyTechnologyEffects(tech.effects || {});
        }
        this.player.activeResearch = null;
        return {
            active: null,
            completed: {
                techId: active.techId,
                name: tech.name
            }
        };
    }

    researchTechnology(techId) {
        const tech = TECHNOLOGY_TREE[techId];
        if (!tech) return { success: false, message: 'Tecnologia desconhecida' };
        if (this.player?.activeResearch?.techId) {
            const activeName = TECHNOLOGY_TREE[this.player.activeResearch.techId]?.name || this.player.activeResearch.techId;
            return { success: false, message: `Pesquisa já em andamento: ${activeName}` };
        }

        if (this.player.techResearched.includes(techId)) {
            return { success: false, message: `${tech.name} já foi pesquisada` };
        }

        const researched = new Set(this.player.techResearched);
        const requirementsMet = (tech.requires || []).every(req => researched.has(req));
        if (!requirementsMet) {
            return { success: false, message: 'Pré-requisitos não atendidos' };
        }

        const computedCost = this.getResearchCost(techId);
        const goldCost = computedCost?.gold ?? 0;
        const prestigeCost = computedCost?.prestige ?? 0;
        if (!this.spendResources(goldCost, 0, prestigeCost)) {
            return { success: false, message: `Precisa de ${goldCost} ouro e ${prestigeCost} prestígio` };
        }

        const turns = Math.max(1, Number.isFinite(tech.researchTurns) ? Math.floor(tech.researchTurns) : 1);
        this.player.activeResearch = {
            techId,
            name: tech.name,
            totalTurns: turns,
            turnsRemaining: turns,
            startedTurn: this.turn,
            goldCost,
            prestigeCost
        };
        return {
            success: true,
            techId,
            name: tech.name,
            goldCost,
            prestigeCost,
            turns
        };
    }

    getBuildActionValidation(cityTile, actionId, options = {}) {
        const includeResourceCheck = options.includeResourceCheck !== false;
        const action = BUILD_ACTIONS[actionId];
        if (!action) {
            return { actionId, action: null, available: false, reasons: ['Ação desconhecida'] };
        }

        const reasons = [];
        const researchGate = this.getTechnologyIdUnlockingBuildAction(actionId);
        if (researchGate && !this.player?.techResearched?.includes(researchGate)) {
            reasons.push(`Requer ${TECHNOLOGY_TREE[researchGate]?.name || researchGate}`);
        }
        if (includeResourceCheck) {
            const resources = this.player?.resources || {};
            if ((resources.gold || 0) < (action.gold || 0)) reasons.push(`Faltando ${(action.gold || 0) - (resources.gold || 0)} ouro`);
            if ((resources.manpower || 0) < (action.manpower || 0)) reasons.push(`Faltando ${(action.manpower || 0) - (resources.manpower || 0)} manpower`);
            if ((resources.prestige || 0) < (action.prestige || 0)) reasons.push(`Faltando ${(action.prestige || 0) - (resources.prestige || 0)} prestígio`);
        }

        if (!cityTile) {
            reasons.push('Selecione um piso do mapa primeiro');
            return { actionId, action, available: false, reasons };
        }

        const isPlayerControlled = cityTile.owner === 'player' || gameMap?.getTerritoryOwnerAt(cityTile.x, cityTile.y) === 'player';
        if (actionId === 'establish_town') {
            const colonizer = this.getColonizationUnitOnTile(cityTile);
            if (!colonizer) reasons.push('Requer uma unidade terrestre do jogador posicionada neste piso');
        } else if (!isPlayerControlled) {
            reasons.push('Requer um piso sob controle do jogador');
        }
        if (actionId === 'establish_town' && cityTile.terrain === 'water') reasons.push('Não é possível estabelecer uma cidade em água');
        if (actionId === 'establish_town' && cityTile.cityData) reasons.push('O piso já tem uma cidade');
        if (actionId === 'establish_town' && cityTile.terrain === 'city') reasons.push('O piso já está urbanizado');

        if (actionId !== 'establish_town' && !cityTile.cityData) {
            reasons.push('Selecione um piso de cidade para esta ação');
        }
        const cityData = cityTile.cityData || null;
        const infra = cityData?.infrastructure || {};
        if (cityData) {
            if (actionId === 'build_port' && (cityData.port || cityData.navalYard)) reasons.push('Porto já construído');
            if (actionId === 'build_caravan_camp' && cityData.caravanCamp) reasons.push('Acampamento de Caravanas já construído');
            if (actionId === 'build_canal' && cityData.canal) reasons.push('Canal já construído');
            if (actionId === 'establish_monastery' && cityData.monastery) reasons.push('Mosteiro já estabelecido');
            if (actionId === 'build_road' && (infra.roads || 0) >= 8) reasons.push('Infraestrutura de estradas já está no máximo');
            if (actionId === 'build_farm' && (infra.agriculture || 0) >= 8) reasons.push('Agricultura já está no máximo');
            if (actionId === 'build_fort' && (cityData.fortLevel || 0) >= 6) reasons.push('Nível de fortificação já está no máximo');
            if (actionId === 'irrigate' && cityData.irrigated) reasons.push('Piso já irrigado');
            if (actionId === 'plant_forest' && cityData.forestManaged) reasons.push('Manejo florestal já estabelecido');
        }

        if (actionId === 'build_port') {
            const nearWater = [
                { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
                { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }
            ].some((offset) => gameMap?.getTile(cityTile.x + offset.x, cityTile.y + offset.y)?.terrain === 'water');
            if (!nearWater) reasons.push('Requer água adjacente');
        }

        const terrainConstraint = gameMap?.terrainAllowsBuildAction?.(cityTile.x, cityTile.y, actionId);
        if (terrainConstraint && !terrainConstraint.allowed) {
            reasons.push(terrainConstraint.reason || 'O terreno não suporta esta ação');
        }

        return {
            actionId,
            action,
            available: reasons.length === 0,
            reasons
        };
    }

    getBuildActionOptionStatus(cityTile, actionId) {
        return this.getBuildActionValidation(cityTile, actionId, { includeResourceCheck: true });
    }

    getBuildActionOptions(cityTile) {
        return Object.entries(BUILD_ACTIONS).map(([actionId]) => this.getBuildActionOptionStatus(cityTile, actionId));
    }

    getColonizationUnitOnTile(tile) {
        if (!tile) return null;
        const occupant = this.units.find((unit) =>
            unit?.owner === 'player'
            && !unit.isCarried
            && unit.position?.x === tile.x
            && unit.position?.y === tile.y
        );
        if (!occupant) return null;
        if (occupant.type === 'naval' || occupant.category === 'transport') return null;
        return occupant;
    }

    applyCityBuildAction(cityTile, actionId) {
        const validation = this.getBuildActionValidation(cityTile, actionId, { includeResourceCheck: false });
        if (!validation.available) {
            return { success: false, message: validation.reasons[0] || 'Ação de construção indisponível' };
        }
        const action = validation.action;

        if (actionId === 'establish_town' && !cityTile.cityData) {
            const colonizer = this.getColonizationUnitOnTile(cityTile);
            if (!colonizer) {
                return { success: false, message: 'Requer uma unidade terrestre do jogador estacionada nesta tile' };
            }
            cityTile.terrain = 'city';
            cityTile.building = 'town';
            cityTile.owner = 'player';
            cityTile.cityData = {
                id: `founded_${cityTile.x}_${cityTile.y}_${this.turn}`,
                name: `New Settlement ${this.turn}`,
                kind: 'town',
                population: 4,
                production: { food: 2, industry: 1, gold: 1 },
                infrastructure: { roads: 1, agriculture: 1, industry: 1 },
                autoBuildEnabled: true
            };
            colonizer.currentMovement = 0;
            colonizer.fortified = false;
            if (!this.player.territories.includes(cityTile.cityData.id)) {
                this.player.territories.push(cityTile.cityData.id);
            }
        }

        if (!cityTile.cityData) {
            return { success: false, message: 'Selecione uma tile de cidade para essa ação de construção' };
        }

        if (!this.spendResources(action.gold, action.manpower, action.prestige || 0)) {
            return { success: false, message: `Precisa de ${action.gold}g/${action.manpower}m/${action.prestige || 0}p` };
        }

        if (cityTile.owner !== 'player') {
            cityTile.owner = 'player';
        }

        const infra = cityTile.cityData.infrastructure || (cityTile.cityData.infrastructure = {});
        const production = cityTile.cityData.production || (cityTile.cityData.production = { food: 0, industry: 0, gold: 0 });

        if (actionId === 'establish_town') {
            cityTile.cityData.kind = 'city';
            cityTile.building = 'town';
            cityTile.importance = Math.max(cityTile.importance || 5, 7);
            cityTile.cityData.population = Math.min((cityTile.cityData.population || 4) + 2, 14);
            production.food += 1;
            production.industry += 1;
            production.gold += 1;
            const foundation = gameMap?.getTownFoundationBonuses(cityTile.x, cityTile.y) || { food: 0, gold: 0, manpower: 0, notes: [] };
            production.food += foundation.food;
            production.gold += foundation.gold;
            if (foundation.manpower) {
                this.player.resources.manpower += foundation.manpower * 20;
            }
            if (foundation.notes.length > 0) {
                cityTile.cityData.foundationBonus = foundation.notes.join(', ');
            }
        } else if (actionId === 'build_fort') {
            cityTile.cityData.fortLevel = (cityTile.cityData.fortLevel || 0) + 1;
            cityTile.cityData.defenseBonus = (cityTile.cityData.defenseBonus || 0) + 0.15;
            cityTile.cityData.garrison = (cityTile.cityData.garrison || 0) + 1;
            const nearby = gameMap?.getNearbyResourceYields?.(cityTile.x, cityTile.y, 2) || {};
            if ((nearby.stone || 0) > 0) cityTile.cityData.defenseBonus += 0.03;
        } else if (actionId === 'build_road') {
            infra.roads = Math.min((infra.roads || 0) + 1, 8);
            production.gold += 1;
            this.expandRoadNetworkFromCity(cityTile);
            if (typeof achievementManager !== 'undefined') achievementManager.recordRoadBuilt();
        } else if (actionId === 'establish_monastery') {
            cityTile.cityData.monastery = true;
            this.player.resources.prestige += 6;
            production.gold += 1;
        } else if (actionId === 'build_caravan_camp') {
            cityTile.cityData.caravanCamp = true;
            production.gold += 2 + (this.player.techEffects.tradePostBonus || 0);
        } else if (actionId === 'build_port') {
            cityTile.cityData.port = true;
            cityTile.cityData.navalYard = true;
            production.gold += 2;
        } else if (actionId === 'build_farm') {
            infra.agriculture = Math.min((infra.agriculture || 0) + 1, 8);
            production.food += 2;
            const nearby = gameMap?.getNearbyResourceYields?.(cityTile.x, cityTile.y, 2) || {};
            if ((nearby.food || 0) >= 3) production.food += 1;
        } else if (actionId === 'irrigate') {
            cityTile.cityData.irrigated = true;
            production.food += 2;
            production.gold += 1;
            if (gameMap?.isRiverTile?.(cityTile.x, cityTile.y) || gameMap?.isCoastalTile?.(cityTile.x, cityTile.y)) {
                production.food += 1;
            }
        } else if (actionId === 'plant_forest') {
            cityTile.cityData.forestManaged = true;
            production.industry += 1;
            cityTile.cityData.defenseBonus = (cityTile.cityData.defenseBonus || 0) + 0.05;
            const nearby = gameMap?.getNearbyResourceYields?.(cityTile.x, cityTile.y, 2) || {};
            if ((nearby.wood || 0) >= 2) production.industry += 1;
        } else if (actionId === 'build_canal') {
            cityTile.cityData.canal = true;
            infra.roads = Math.min((infra.roads || 0) + 1, 8);
            production.gold += 2;
            this.expandRoadNetworkFromCity(cityTile);
        }

        gameMap?.markTerritoryDirty();
        return { success: true, actionId, actionName: action.name };
    }

    /**
     * Select a unit
     */
    selectUnit(unitId) {
        const unit = this.units.find(u => u.id === unitId);
        if (unit && unit.owner === 'player') {
            this.selectedUnit = unit;
            return unit;
        }
        return null;
    }

    /**
     * Move selected unit
     */
    moveUnit(unitId, newPosition, options = {}) {
        const unit = this.units.find(u => u.id === unitId);
        if (!unit) return false;
        const suppressVisibilityRefresh = options?.suppressVisibilityRefresh === true;
        const suppressRender = options?.suppressRender === true;

        // Check if unit has movement remaining
        if (unit.currentMovement <= 0) return false;

        const maxMovement = unit.currentMovement;

        const blockingUnit = this.units.find(u =>
            u.id !== unit.id &&
            u.position.x === newPosition.x &&
            u.position.y === newPosition.y
        );

        if (blockingUnit && blockingUnit.owner === unit.owner && blockingUnit.bonuses?.transportCapacity) {
            const carrying = blockingUnit.carryingUnits || (blockingUnit.carryingUnits = []);
            if (carrying.length < blockingUnit.bonuses.transportCapacity) {
                carrying.push(unit.id);
                // Remove unit from map but keep in units array marked as carried
                unit.isCarried = true;
                unit.carrierId = blockingUnit.id;
                unit.position = { x: -1, y: -1 };
                unit.currentMovement = 0;
                if (window.uiManager) uiManager.showNotification(`${unit.name} embarcou em ${blockingUnit.name}`, 'success');
                return true;
            }
        }

        // Terrain restrictions.
        const destination = gameMap?.getTile(newPosition.x, newPosition.y);
        if (!destination) return false;
        if (destination.terrain === 'water') {
            if (!this.isWaterCapable(unit)) return false;
        } else if (this.isWaterOnlyUnit(unit)) {
            return false;
        }

        if (destination.fort && destination.fort.owner !== unit.owner && !blockingUnit) {
            const fortEngagement = this.canAssaultFort(unit, destination);
            if (!fortEngagement.allowed) {
                if (window.uiManager) uiManager.showNotification(fortEngagement.reason, 'error');
                return false;
            }
            const fortAssault = this.resolveFortAssault(unit, destination);
            if (window.uiManager) {
                const outcome = fortAssault.destroyed
                    ? `${unit.name} rompeu a fortificação inimiga`
                    : `${unit.name} foi repelido pela fortificação inimiga`;
                uiManager.showNotification(outcome, fortAssault.destroyed ? 'success' : 'error');
            }
            if (fortAssault.success && fortAssault.destroyed) {
                unit.position = { x: newPosition.x, y: newPosition.y };
                this.captureTerritory(unit, newPosition);
            }
            return fortAssault.success;
        }

        const travelCost = this.estimateTravelCost(unit, unit.position, newPosition);
        if (travelCost <= maxMovement) {
            if (blockingUnit) {
                if (blockingUnit.owner === unit.owner) return false;
                const engagement = this.canUnitsEngage(unit, blockingUnit);
                if (!engagement.allowed) {
                    if (window.uiManager) uiManager.showNotification(engagement.reason, 'error');
                    return false;
                }
                unit.currentMovement = 0;
                return this.resolveBattleOnMove(unit, blockingUnit, newPosition);
            }

            unit.fortified = false;
            unit.position = { ...newPosition };
            unit.currentMovement = Math.max(0, unit.currentMovement - travelCost);

            // Reveal fog of war around new position for player units
            if (unit.owner === 'player' && gameMap) {
                if (suppressVisibilityRefresh) {
                    // During batched movement, reveal incrementally but defer full-map recomputation.
                    this.revealVisibilityFromUnitStep(unit, { suppressRender: true });
                } else {
                    this.refreshPlayerVisibility({ suppressRender });
                }
            }

            // Check for territory capture
            this.captureTerritory(unit, newPosition);

            return true;
        } else {
            // Set destination for future turns if it's too far
            unit.destination = { ...newPosition };
            if (window.uiManager) {
                uiManager.showNotification(`Destino de ${unit.name} definido para ${newPosition.x},${newPosition.y}`, 'info');
            }
            // Move as much as possible towards destination this turn
            this.processUnitDestination(unit, { suppressVisibilityRefresh, suppressRender });
            return true;
        }

    }

    /**
     * Unload units from a transport
     */
    unloadUnits(transportId) {
        const transport = this.units.find(u => u.id === transportId);
        if (!transport || !transport.carryingUnits || transport.carryingUnits.length === 0) return { success: false, message: 'Nenhuma unidade para desembarcar' };

        // Try to find a land tile adjacent to the transport
        const spawnPos = this.findAvailableSpawnPosition(
            transport.position.x,
            transport.position.y,
            [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }],
            1
        );

        if (!spawnPos) return { success: false, message: 'Nenhum local de pouso adequado adjacente' };

        const carried = transport.carryingUnits.pop();
        const unitId = (carried && typeof carried === 'object') ? carried.id : carried;
        const unit = this.units.find(u => u.id === unitId);
        if (!unit) {
            if (carried !== undefined) {
                transport.carryingUnits.push(carried);
            }
            return { success: false, message: 'Unidade carregada não encontrada no estado' };
        }

        unit.isCarried = false;
        unit.carrierId = null;
        unit.position = { ...spawnPos };
        unit.currentMovement = 0; // Unloading ends unit turn

        if (window.uiManager) {
            uiManager.showNotification(` ${unit.name} desembarcou em ${spawnPos.x},${spawnPos.y}`, 'success');
        }
        this.refreshPlayerVisibility();
        return { success: true };
    }

    /**
     * Capture territory at position
     */
    captureTerritory(unit, position) {
        if (!gameMap) return;

        const tile = gameMap.getTile(position.x, position.y);
        if (!tile) return;
        if (!tile.cityData) return;
        if (tile.owner === unit.owner) return;

        const oldOwner = tile.owner;
        const oldFaction = tile.faction || tile.cityData?.historicalCivilization || null;
        const cityId = tile.cityData.id || `${position.x}_${position.y}`;

        // Neutral towns can join peacefully or resist based on diplomacy.
        if ((oldOwner === 'neutral' || oldOwner === null) && unit.owner === 'player') {
            const diplomacy = this.selectedLeader?.stats?.diplomacy || 5;
            const joinChance = Math.max(0.38, Math.min(0.85, 0.38 + diplomacy * 0.05));
            if (Math.random() <= joinChance) {
                tile.owner = 'player';
                if (!this.player.territories.includes(cityId)) {
                    this.player.territories.push(cityId);
                }
                if (window.uiManager) {
                    uiManager.showNotification(
                        `${tile.cityData.name} (${tile.cityData.tribe || 'local tribe'}) juntou-se ao seu reino`,
                        'success'
                    );
                }
                // Peaceful join — track for recapture but don't count as a conquest
                if (typeof achievementManager !== 'undefined') {
                    achievementManager.recordCityJoined(tile);
                    achievementManager.syncFromGameState();
                }
            } else {
                tile.owner = 'enemy';
                tile.faction = tile.faction || 'tribal';
                this.spawnFactionArmyAtTown(
                    { x: tile.x, y: tile.y, id: cityId },
                    'enemy',
                    tile.faction || 'tribal',
                    2
                );
                if (window.uiManager) {
                    uiManager.showNotification(
                        `${tile.cityData.name} resistiu e formou uma colizão hostil`,
                        'error'
                    );
                }
            }
        } else {
            tile.owner = unit.owner;
            if (unit.owner === 'player') {
                if (!this.player.territories.includes(cityId)) {
                    this.player.territories.push(cityId);
                }
            } else if (oldOwner === 'player') {
                const index = this.player.territories.indexOf(cityId);
                if (index !== -1) {
                    this.player.territories.splice(index, 1);
                }
            }
            if (window.uiManager && unit.owner === 'player') {
                uiManager.showNotification(`Capturou ${tile.cityData.name}`, 'success');
            }
            // Military capture — count as conquest
            if (unit.owner === 'player' && tile.owner === 'player' && typeof achievementManager !== 'undefined') {
                achievementManager.recordCityCapture(tile, oldOwner);
                achievementManager.syncFromGameState();
            }
        }

        this.recordAIWorldEvent('city_captured', {
            cityId,
            cityName: tile.cityData?.name || cityId,
            cityFaction: oldFaction,
            // `oldFaction` is kept as a legacy alias for compatibility with older event consumers;
            // new code should prefer `cityFaction` for "who held this city before capture".
            oldFaction,
            // Use post-resolution ownership so neutral resistance outcomes log the actual capturer.
            capturer: tile.owner ?? unit.owner,
            capturerFaction: this.determineCapturerFaction(tile, unit, oldFaction),
            oldOwner: oldOwner ?? null
        });
        this._aiCityTilesCache = null;
        this.updateAIFactionIntelFromWorldState({
            skipRefresh: true,
            factionIds: [oldFaction, this.resolveAIFactionForTile(tile), unit?.faction]
        });

        gameMap.markTerritoryDirty();
        this.refreshPlayerVisibility({ grantRewards: false });
        this.refreshPlayerCapitalRoles(this.player?.faction || this.selectedFaction || 'byzantine');

        this.checkWinLossConditions();
    }

    /**
     * End current turn
     */
    async endTurn() {
        if (this.isPaused) {
            return { paused: true };
        }

        // If it was player's turn, now it's enemy's turn
        console.log(`Encerrar turno ${this.turn}`);

        // 1. Process Enemy Turn
        if (typeof aiManager !== 'undefined' && aiManager) {
            this.isPaused = true; // Pause player input
            try {
                await aiManager.processTurn();
            } catch (error) {
                console.error('Falha no turno da IA:', error);
            } finally {
                this.isPaused = false;
            }
        }

        // 2. Start New Turn for Player
        this.turn++;
        const completedConstruction = this.processCityConstructionTurn();
        const autoStartedConstruction = this.processCityAutoBuildTurn();
        const completedTraining = this.processUnitTrainingTurn();
        const researchProgress = this.processResearchTurn();

        // Generate resources
        const baseGold = 100;
        const baseManpower = 50;
        const basePrestige = 10;

        // Apply leader bonuses
        const goldBonus = this.player.bonuses.goldIncome || 1.0;
        const manpowerBonus = this.player.bonuses.manpowerRegen || 1.0;

        // Territory bonus
        const territoryBonus = this.player.territories.length * 20;

        const cityProduction = this.calculateCityProduction('player');

        this.addResources(
            Math.floor(baseGold * goldBonus) + territoryBonus,
            Math.floor(baseManpower * manpowerBonus) + cityProduction.manpower,
            basePrestige + (this.player.techEffects.prestigePerTurn || 0)
        );

        // City gold output
        this.addResources(cityProduction.gold, 0, 0);
        this.addStrategicResources({
            food: cityProduction.food + (cityProduction.strategic?.food || 0),
            wood: cityProduction.strategic?.wood || 0,
            stone: cityProduction.strategic?.stone || 0,
            iron: cityProduction.strategic?.iron || 0,
            rare: cityProduction.strategic?.rare || 0
        });
        const diplomacyTradeIncome = this.processDiplomacyAndTradeTurn();

        // Reset unit movement before any automated destination processing.
        this.units.forEach(unit => {
            const unitType = getUnitById(unit.typeId);
            if (unitType) {
                const navalBonus = unit.type === 'naval' ? (this.player.techEffects.navalMovement || 0) : 0;
                unit.currentMovement = unitType.stats.movement + (this.player.techEffects.movement || 0) + navalBonus;
            }
        });

        // Process units with destination or automation
        this.processAutomatedUnits();
        this.refreshPlayerVisibility();

        // Healing phase: towns, fortified positions, and nearby support units.
        this.processUnitHealing();

        // Pay unit upkeep
        let totalUpkeep = 0;
        this.units.forEach(unit => {
            if (unit.owner === 'player') {
                const unitType = getUnitById(unit.typeId);
                if (unitType) {
                    totalUpkeep += unitType.upkeep;
                }
            }
        });

        this.spendResources(totalUpkeep, 0, 0);

        const dynamicNarrative = this.processDynamicNarrativeTurn();

        // Check win/loss
        this.checkWinLossConditions();

        // Sync achievements at end of each turn
        if (typeof achievementManager !== 'undefined') {
            achievementManager.syncFromGameState();
        }

        return {
            turn: this.turn,
            income: {
                gold: Math.floor(baseGold * goldBonus) + territoryBonus + cityProduction.gold + (diplomacyTradeIncome.gold || 0),
                manpower: Math.floor(baseManpower * manpowerBonus) + cityProduction.manpower,
                prestige: basePrestige + (this.player.techEffects.prestigePerTurn || 0) + (diplomacyTradeIncome.prestige || 0),
                food: cityProduction.food + (cityProduction.strategic?.food || 0),
                strategic: { ...(cityProduction.strategic || {}) },
                diplomacyTrade: diplomacyTradeIncome
            },
            upkeep: totalUpkeep,
            cityProduction,
            completedConstruction,
            autoStartedConstruction,
            completedTraining,
            researchProgress,
            dynamicNarrative
        };
    }

    calculateCityProduction(owner = 'player') {
        if (!gameMap) {
            return { gold: 0, manpower: 0, food: 0, strategic: { food: 0, wood: 0, stone: 0, iron: 0, rare: 0 } };
        }

        const cityTiles = gameMap.getCityTiles(owner);
        const totals = {
            gold: 0,
            manpower: 0,
            food: 0,
            strategic: { food: 0, wood: 0, stone: 0, iron: 0, rare: 0 }
        };

        cityTiles.forEach(tile => {
            const p = tile.cityData?.production;
            const infra = tile.cityData?.infrastructure;
            const pop = tile.cityData?.population || 4;
            if (!p) return;
            const levels = this.getAllCityBuildingLevels(tile);
            const farmLevel = levels.farm;
            const barracksLevel = levels.barracks;
            const mineLevel = levels.mine;
            const workshopLevel = levels.workshop;
            const templeLevel = levels.temple;
            const wallsLevel = levels.walls;
            const foodMultiplier = this.player.techEffects.foodMultiplier || 1;
            const goldMultiplier = this.player.techEffects.goldMultiplier || 1;
            const manpowerMultiplier = this.player.techEffects.manpowerMultiplier || 1;
            const tradeBonus = tile.cityData?.caravanCamp
                ? CITY_PRODUCTION_BALANCE.caravanCampGoldBonusBase + (this.player.techEffects.tradePostBonus || 0)
                : 0;
            const portBonus = tile.cityData?.port ? CITY_PRODUCTION_BALANCE.portGoldBonus : 0;
            const terrainAccess = this.getCityTerrainAccess(tile);
            const terrainFoodBonus = terrainAccess.fertile ? 1 : 0;
            const terrainGoldBonus = terrainAccess.coast ? 1 : 0;
            const terrainManpowerBonus = terrainAccess.river ? 1 : 0;

            const buildingFoodBonus = farmLevel * CITY_PRODUCTION_BALANCE.farmFoodBonusPerLevel;
            const buildingGoldBonus = (workshopLevel * CITY_PRODUCTION_BALANCE.workshopGoldBonusPerLevel)
                + (templeLevel * CITY_PRODUCTION_BALANCE.templeGoldBonusPerLevel);
            const buildingManpowerBonus = (barracksLevel * CITY_PRODUCTION_BALANCE.barracksManpowerBonusPerLevel)
                + (workshopLevel * CITY_PRODUCTION_BALANCE.workshopManpowerBonusPerLevel);
            totals.food += Math.floor((p.food + terrainFoodBonus + buildingFoodBonus) * foodMultiplier);
            totals.gold += Math.floor(
                (
                    p.gold
                    + tradeBonus
                    + portBonus
                    + terrainGoldBonus
                    + buildingGoldBonus
                    + (infra?.roads || 0) * CITY_PRODUCTION_BALANCE.roadsGoldYield
                    + pop * CITY_PRODUCTION_BALANCE.populationGoldYield
                ) * goldMultiplier
            );
            totals.manpower += Math.floor(
                (
                    ((p.food + terrainManpowerBonus) * CITY_PRODUCTION_BALANCE.foodToManpowerYield)
                    + (p.industry * CITY_PRODUCTION_BALANCE.industryToManpowerYield)
                    + (infra?.industry || 0) * CITY_PRODUCTION_BALANCE.infrastructureIndustryManpowerYield
                    + buildingManpowerBonus
                ) * manpowerMultiplier
            );

            const resourceReach = 2 + Math.min(1, Math.floor((infra?.roads || 0) / 4));
            const nearby = gameMap.getNearbyResourceYields(tile.x, tile.y, resourceReach);
            const woodMultiplier = 1 + ((infra?.industry || 0) >= 3 ? CITY_PRODUCTION_BALANCE.infrastructureTier3ExtractionBonus : 0);
            const stoneMultiplier = 1
                + ((tile.cityData?.fortLevel || 0) > 0 ? CITY_PRODUCTION_BALANCE.fortificationStoneExtractionBonus : 0)
                + (mineLevel * CITY_PRODUCTION_BALANCE.mineStoneExtractionBonusPerLevel)
                + (wallsLevel * CITY_PRODUCTION_BALANCE.wallStoneExtractionBonusPerLevel);
            const ironMultiplier = 1
                + ((infra?.industry || 0) >= 4 ? CITY_PRODUCTION_BALANCE.infrastructureTier3ExtractionBonus : 0)
                + (mineLevel * CITY_PRODUCTION_BALANCE.mineIronExtractionBonusPerLevel);
            const rareMultiplier = 1 + (tile.cityData?.caravanCamp ? CITY_PRODUCTION_BALANCE.caravanRareExtractionBonus : 0);
            totals.strategic.food += extractStrategicYield(nearby.food || 0, CITY_PRODUCTION_BALANCE.strategicFoodExtractionMultiplier);
            totals.strategic.wood += extractStrategicYield(nearby.wood || 0, woodMultiplier);
            totals.strategic.stone += extractStrategicYield(nearby.stone || 0, stoneMultiplier);
            totals.strategic.iron += extractStrategicYield(nearby.iron || 0, ironMultiplier);
            totals.strategic.rare += extractStrategicYield(nearby.rare || 0, rareMultiplier);
        });

        return totals;
    }

    /**
     * Check Win/Loss conditions
     */
    checkWinLossConditions() {
        if (this.gameOverState) {
            return this.gameOverState;
        }

        const playerUnits = this.units.filter(u => u.owner === 'player');
        const enemyUnits = this.units.filter(u => u.owner === 'enemy');

        // Loss: No units left or no player-controlled cities.
        const playerCities = gameMap?.getCityTiles('player') || [];
        const playerFaction = this.player?.faction || this.selectedFaction || 'byzantine';
        const leaderStartProfile = this.getLeaderStartProfile(playerFaction);
        const allowNoCityStart = this.isNomadicBuildStart(leaderStartProfile, this.selectedScenario) || Boolean(this.activeScenario);
        const hasNoUnits = playerUnits.length === 0;
        const hasNoCities = playerCities.length === 0;
        const lostByCities = hasNoCities && !allowNoCityStart;
        if (hasNoUnits || lostByCities) {
            if (window.uiManager) {
                if (lostByCities) {
                    uiManager.showGameOver(false, 'Seu império perdeu sua última cidade.');
                } else {
                    uiManager.showGameOver(false);
                }
            }
            this.gameOverState = 'loss';
            return this.gameOverState;
        }

        // Win: All enemy units destroyed (simplified)
        if (enemyUnits.length === 0 && this.turn > 5) {
            // Only win after some turns to avoid immediate win if no enemies spawned yet
            if (window.uiManager) uiManager.showGameOver(true);
            if (typeof achievementManager !== 'undefined') achievementManager.recordCampaignWon();
            this.gameOverState = 'win';
            return this.gameOverState;
        }

        return null;
    }

    /**
     * Serialize game state for saving
     */
    serialize() {
        return {
            version: SAVE_VERSION,
            timestamp: Date.now(),
            worldGenerationConfig: gameMap?.getGenerationConfigSnapshot?.()
                || (typeof window !== 'undefined' && typeof window.getWorldGenerationConfig === 'function'
                    ? window.getWorldGenerationConfig()
                    : null),
            aiFactions: this.aiFactions,
            aiEvents: this.aiEvents,
            dynamicNarrativeState: this.dynamicNarrativeState,
            diplomacyState: this.diplomacyState,
            exploration: this.exploration,
            tutorialState: this.ensureTutorialState(),
            selectedLeader: this.selectedLeader,
            selectedCentury: this.selectedCentury,
            player: this.player,
            turn: this.turn,
            gameMode: this.gameMode,
            selectedScenario: this.selectedScenario,
            units: this.units,
            buildings: this.buildings,
            territories: this.territories,
            cityOwnership: this.captureCityOwnership(),
            fortifications: this.captureFortifications(),
            fogOfWar: gameMap?.exportFogState?.() || null
        };
    }

    captureCityOwnership() {
        if (!gameMap) return [];
        return gameMap.getCityTiles().map(tile => ({
            id: tile.cityData?.id || tile.cityId || `${tile.x}_${tile.y}`,
            x: tile.x,
            y: tile.y,
            owner: tile.owner || null,
            faction: tile.faction || null,
            trainingQueue: Array.isArray(tile.cityData?.trainingQueue)
                ? tile.cityData.trainingQueue.map((project) => ({ ...project }))
                : []
        }));
    }

    captureFortifications() {
        if (!gameMap) return [];
        const forts = [];
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                const tile = gameMap.getTile(x, y);
                if (!tile?.fort) continue;
                forts.push({
                    x,
                    y,
                    ...tile.fort
                });
            }
        }
        return forts;
    }

    restoreFortifications(fortifications = []) {
        if (!gameMap) return;
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                const tile = gameMap.getTile(x, y);
                if (tile) tile.fort = null;
            }
        }

        fortifications.forEach((fort) => {
            if (!Number.isInteger(fort?.x) || !Number.isInteger(fort?.y)) return;
            const tile = gameMap.getTile(fort.x, fort.y);
            if (!tile || tile.terrain === 'water') return;
            tile.fort = {
                id: fort.id || `fort_${fort.x}_${fort.y}`,
                owner: fort.owner || 'neutral',
                health: Number.isFinite(fort.health) ? fort.health : 90,
                maxHealth: Number.isFinite(fort.maxHealth) ? fort.maxHealth : 90,
                defenseBonus: Number.isFinite(fort.defenseBonus) ? fort.defenseBonus : 0.22,
                attack: Number.isFinite(fort.attack) ? fort.attack : 10,
                garrisonBonus: Number.isFinite(fort.garrisonBonus) ? fort.garrisonBonus : 0.12,
                builtTurn: Number.isFinite(fort.builtTurn) ? fort.builtTurn : this.turn
            };
        });
    }

    restoreCityOwnership(cityOwnership = []) {
        if (!gameMap) return;
        const scenario = this.selectedScenario || SCENARIOS.building;
        const playerFaction = this.player?.faction || this.selectedFaction || 'byzantine';
        const leaderStartProfile = this.getLeaderStartProfile(playerFaction);
        const playerEmpireCore = new Set(leaderStartProfile.empireCoreTowns || []);
        const nomadicBuildStart = this.isNomadicBuildStart(leaderStartProfile, scenario);
        const startingTownId = nomadicBuildStart ? null : leaderStartProfile.startTownId;
        const hasSavedOwnership = Array.isArray(cityOwnership) && cityOwnership.length > 0;

        if (!hasSavedOwnership) {
            console.warn('Dados de propriedade das cidades ausentes no salvamento; restaurando propriedade a partir dos padrões do cenário e territórios conhecidos do jogador.');
        }

        const byId = new Map(cityOwnership
            .filter(city => city?.id)
            .map(city => [city.id, city]));

        const byCoords = new Map(cityOwnership
            .filter(city => Number.isInteger(city?.x) && Number.isInteger(city?.y))
            .map(city => [`${city.x}_${city.y}`, city]));

        HISTORIC_TOWNS.forEach((town) => {
            const tile = gameMap.getTile(town.x, town.y);
            if (!tile?.cityData) return;
            const historical = this.getHistoricalTownControlForCentury(town.id);
            tile.cityData.tribe = historical.tribe;
            tile.cityData.historicalCivilization = historical.civilization;
            tile.cityData.historicalStance = historical.stance;
            if (!tile.faction) tile.faction = historical.civilization;

            const saved = byId.get(town.id) || byCoords.get(`${town.x}_${town.y}`);
            if (saved) {
                tile.owner = saved.owner || null;
                if (saved.faction) tile.faction = saved.faction;
                if (Array.isArray(saved.trainingQueue)) {
                    tile.cityData.trainingQueue = saved.trainingQueue.map((project) => ({ ...project }));
                    // Reuse queue sanitation to clamp numeric fields and remove malformed entries.
                    this.ensureCityBuildingState(tile);
                }

                // Mark consumed entries so we can detect stale/unmatched save data.
                if (saved.id && byId.get(saved.id) === saved) {
                    byId.delete(saved.id);
                }
                if (Number.isInteger(saved.x) && Number.isInteger(saved.y)) {
                    const coordKey = `${saved.x}_${saved.y}`;
                    if (byCoords.get(coordKey) === saved) {
                        byCoords.delete(coordKey);
                    }
                }
                return;
            }

            const territories = Array.isArray(this.player?.territories) ? this.player.territories : [];
            const coordKeyUnderscore = `${town.x}_${town.y}`;
            const coordKeyDash = `${town.x}-${town.y}`;
            const hasTerritory = territories.some((entry) => {
                if (entry === town.id) return true;
                if (typeof entry !== 'string') return false;
                return entry === coordKeyUnderscore || entry === coordKeyDash;
            });
            if (hasTerritory) {
                tile.owner = 'player';
                return;
            }

            if (scenario === SCENARIOS.empire) {
                if (playerEmpireCore.has(town.id) || (historical.civilization === playerFaction && historical.stance !== 'hostile')) {
                    tile.owner = 'player';
                } else if (historical.stance === 'neutral') {
                    tile.owner = 'neutral';
                } else {
                    tile.owner = 'enemy';
                }
            } else {
                if (startingTownId && town.id === startingTownId) {
                    tile.owner = 'player';
                } else if (nomadicBuildStart && historical.civilization === playerFaction) {
                    tile.owner = 'neutral';
                } else {
                    tile.owner = historical.stance === 'hostile' ? 'enemy' : 'neutral';
                }
            }
        });

        if (byId.size > 0 || byCoords.size > 0) {
            const unmatched = [];
            byId.forEach((city) => {
                if (city && !unmatched.includes(city)) unmatched.push(city);
            });
            byCoords.forEach((city) => {
                if (city && !unmatched.includes(city)) unmatched.push(city);
            });
            if (unmatched.length > 0) {
                console.warn(
                    'Alguns dados de propriedade das cidades salvos não puderam ser restaurados:',
                    unmatched.map(city => ({
                        id: city.id,
                        x: city.x,
                        y: city.y,
                        owner: city.owner,
                        faction: city.faction
                    }))
                );
            }
        }

        if (this.player) {
            this.player.territories = gameMap
                .getCityTiles('player')
                .map(tile => tile.cityData?.id)
                .filter(Boolean);
        }
        this.refreshPlayerCapitalRoles(playerFaction);

        (gameMap?.getCityTiles() || []).forEach((cityTile) => this.expandRoadNetworkFromCity(cityTile));

        gameMap.markTerritoryDirty();
    }

    /**
     * Load game state from saved data
     */
    deserialize(data) {
        if (!data || !isSupportedSaveVersion(data.version)) {
            console.error('Dados de salvamento inválidos');
            return false;
        }
        if (!gameMap) {
            console.error('O mapa deve ser inicializado antes de carregar os dados de salvamento');
            return false;
        }

        this.gameOverState = null;

        if (data.worldGenerationConfig && typeof window !== 'undefined' && typeof window.setWorldGenerationConfig === 'function') {
            const currentGenerationConfig = (gameMap?.getGenerationConfigSnapshot?.()
                || (typeof window.getWorldGenerationConfig === 'function' ? window.getWorldGenerationConfig() : null));
            const savedGenerationConfigKey = stableSerializeForComparison(data.worldGenerationConfig);
            const currentGenerationConfigKey = currentGenerationConfig ? stableSerializeForComparison(currentGenerationConfig) : null;
            if (savedGenerationConfigKey !== currentGenerationConfigKey) {
                // Controlled load flow: regenerate map to the saved generation config before restoring ownership/forts.
                // Save compatibility still depends on stable generation rules across versions.
                window.setWorldGenerationConfig(data.worldGenerationConfig, { allowActiveGameReset: true });
            }
        }

        this.selectedLeader = data.selectedLeader;
        this.selectedCentury = data.selectedCentury ?? this.selectedCentury ?? '6';
        this.player = data.player;
        this.turn = Math.max(1, Math.floor(Number.isFinite(data.turn) ? data.turn : (this.turn || 1)));
        this.aiFactions = (data.aiFactions && typeof data.aiFactions === 'object') ? data.aiFactions : {};
        this.aiEvents = Array.isArray(data.aiEvents) ? data.aiEvents.slice(-40) : [];
        this.restoreDynamicNarrativeState(data.dynamicNarrativeState);
        this.diplomacyState = (data.diplomacyState && typeof data.diplomacyState === 'object')
            ? data.diplomacyState
            : { reputation: 0, factions: {}, tradeRoutes: [] };
        this.exploration = (data.exploration && typeof data.exploration === 'object')
            ? data.exploration
            : this.createDefaultExplorationState();
        const hasTutorialState = Boolean(data.tutorialState && typeof data.tutorialState === 'object');
        this.tutorialState = hasTutorialState
            ? data.tutorialState
            : this.createDefaultTutorialState();
        this.initializeDiplomacyState();
        this.ensureExplorationState();
        this.ensureTutorialState();
        if (!hasTutorialState && this.turn > 3) {
            // Avoid forcing onboarding on legacy saves that already progressed beyond opening turns.
            this.tutorialState.active = false;
            this.tutorialState.completed = true;
            this.tutorialState.skipped = false;
        }
        this.ensureStrategicResourceStockpile();
        if (!Array.isArray(this.player.techResearched)) {
            this.player.techResearched = [];
        }
        this.player.techResearched = [...new Set(
            this.player.techResearched
                .map((techId) => String(techId || '').trim())
                .filter((techId) => Boolean(techId && TECHNOLOGY_TREE[techId]))
        )];
        if (!this.player.activeResearch || typeof this.player.activeResearch !== 'object') {
            this.player.activeResearch = null;
        } else {
            const activeId = String(this.player.activeResearch.techId || '').trim();
            const knownTech = TECHNOLOGY_TREE[activeId];
            if (!activeId || !knownTech || this.player.techResearched.includes(activeId)) {
                this.player.activeResearch = null;
            } else {
                const totalTurns = Math.max(1, Number.isFinite(this.player.activeResearch.totalTurns)
                    ? Math.floor(this.player.activeResearch.totalTurns)
                    : (knownTech.researchTurns || 1));
                const turnsRemaining = Math.max(1, Number.isFinite(this.player.activeResearch.turnsRemaining)
                    ? Math.floor(this.player.activeResearch.turnsRemaining)
                    : totalTurns);
                this.player.activeResearch = {
                    techId: activeId,
                    name: knownTech.name,
                    totalTurns,
                    turnsRemaining: Math.min(totalTurns, turnsRemaining),
                    startedTurn: Number.isFinite(this.player.activeResearch.startedTurn)
                        ? Math.max(1, Math.floor(this.player.activeResearch.startedTurn))
                        : this.turn
                };
            }
        }
        this.player.techEffects = createDefaultTechnologyEffects();
        this.player.techResearched.forEach((techId) => {
            this.applyTechnologyEffects(TECHNOLOGY_TREE[techId]?.effects || {});
        });
        this.gameMode = data.gameMode;
        this.selectedScenario = data.selectedScenario || SCENARIOS.building;
        this.units = data.units;
        this.normalizeTransportCargoReferences();
        this.buildings = data.buildings;
        this.territories = data.territories;
        this.restoreCityOwnership(data.cityOwnership || []);
        this.restoreFortifications(data.fortifications || []);
        if (data.fogOfWar && typeof gameMap.importFogState === 'function') {
            gameMap.importFogState(data.fogOfWar);
        } else if (typeof gameMap.initializeFogOfWar === 'function') {
            gameMap.initializeFogOfWar();
        }
        this.refreshAIFactionState();
        this.updateAIFactionIntelFromWorldState();
        this.refreshPlayerVisibility({ grantRewards: false });
        this.initialized = true;

        // Sync achievements from loaded save state
        if (typeof achievementManager !== 'undefined') {
            achievementManager.syncFromGameState();
        }

        return true;
    }

    normalizeTransportCargoReferences() {
        if (!Array.isArray(this.units)) return;
        const unitsById = new Map(this.units
            .filter(unit => unit?.id)
            .map(unit => [unit.id, unit]));

        this.units.forEach((unit) => {
            if (!unit || !Array.isArray(unit.carryingUnits)) return;
            unit.carryingUnits = unit.carryingUnits
                .map((entry) => (entry && typeof entry === 'object') ? entry.id : entry)
                .filter((id) => typeof id === 'string' && unitsById.has(id));

            unit.carryingUnits.forEach((carriedId) => {
                const carriedUnit = unitsById.get(carriedId);
                if (!carriedUnit) return;
                carriedUnit.isCarried = true;
                carriedUnit.carrierId = unit.id;
                carriedUnit.position = { x: -1, y: -1 };
            });
        });
    }

    /**
     * Get game statistics
     */
    getStats() {
        return {
            turn: this.turn,
            unitsCount: this.units.filter(u => u.owner === 'player').length,
            territoriesCount: this.player.territories.length,
            resources: { ...this.player.resources },
            leader: this.selectedLeader.name,
            scenario: this.selectedScenario
        };
    }
}

// Global game state instance
const gameState = new GameState();
