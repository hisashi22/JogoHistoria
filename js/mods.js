/**
 * Mod Manager System for 500 A.D.
 * Handles validation, loading, toggling, and merging of external JSON mods.
 */

const MOD_UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MOD_ID_REGEX = /^[a-z0-9_-]+$/;
// Must match the grammar accepted by evaluateModCondition() below.
const MOD_TRIGGER_CONDITION_REGEX = /^\s*(turn|gold|manpower|prestige)\s*(>=|<=|>|<|==)\s*(\d+)\s*$/;

function isModUnsafeKey(key) {
    return typeof key !== 'string' || MOD_UNSAFE_KEYS.has(key);
}

class ModManager {
    constructor() {
        this.mods = []; // Array of mod objects: { id, name, description, author, version, enabled, units, buildings, techs, events }
        this.originalData = null;
        this.storageKey = '500ad_mods';
    }

    /**
     * Backup core game template structures to allow clean resets when toggling mods
     */
    backupCoreData() {
        if (this.originalData) return; // Already backed up

        if (typeof UNIT_TYPES === 'undefined' || typeof CITY_BUILDING_TREE === 'undefined' || typeof TECHNOLOGY_TREE === 'undefined') {
            console.warn('ModManager: Estruturas principais do jogo ainda não carregadas para backup.');
            return;
        }

        this.originalData = {
            units: JSON.parse(JSON.stringify(UNIT_TYPES)),
            buildings: JSON.parse(JSON.stringify(CITY_BUILDING_TREE)),
            techs: JSON.parse(JSON.stringify(TECHNOLOGY_TREE)),
            recruitmentCatalog: (typeof RECRUITMENT_UNIT_CATALOG !== 'undefined')
                ? RECRUITMENT_UNIT_CATALOG.slice()
                : null
        };
        console.log('Dados principais do jogo salvos em backup com sucesso.');
    }

    /**
     * Initialize Mod Manager, load from localStorage, and apply active mods
     */
    initialize() {
        this.backupCoreData();
        this.loadFromStorage();
        this.applyMods();
    }

    /**
     * Load mods list from LocalStorage
     */
    loadFromStorage() {
        let hadStoredEntry = false;
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw !== null) {
                hadStoredEntry = true;
                const parsed = JSON.parse(raw);
                this.mods = Array.isArray(parsed)
                    ? parsed.filter((mod) => this.validateMod(mod).success)
                    : [];
            }
        } catch (e) {
            console.error('ModManager: falha ao carregar mods do armazenamento', e);
            this.mods = [];
            // Treat parse failure as "no usable stored entry" so a fresh seed runs.
            hadStoredEntry = false;
        }

        // Seed example mods only on first run (no storage key yet). An
        // intentionally-emptied list (stored value is `[]`) stays empty
        // across reloads — matches what the UI's empty-state text promises.
        if (!hadStoredEntry) {
            this.seedExampleMods();
        }
    }

    /**
     * Save mods list to LocalStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.mods));
        } catch (e) {
            console.error('ModManager: falha ao salvar mods no armazenamento', e);
        }
    }

    /**
     * Return the static catalog of seeded example mods. Used both for the
     * initial seed and for on-demand reinstall when the user has deleted a
     * seeded entry and clicks the corresponding example button.
     */
    getExampleModCatalog() {
        return [
            {
                id: 'greek_fire_refinery',
                name: 'Mod de Refinamento de Fogo Grego',
                description: 'Desbloqueia um aprimoramento de edifício de Laboratório de Alquimia de alto nível, uma opção de pesquisa de Refinamento de Fogo Grego (+5 de ataque) e uma unidade de cerco avançada de Sifão de Fogo Imperial.',
                author: 'Burocracia Imperial',
                version: '1.0.0',
                enabled: false,
                units: {
                    special: {
                        super_siphon: {
                            id: 'super_siphon',
                            name: 'Sifão de Fogo Imperial',
                            type: 'special',
                            category: 'siege',
                            description: 'Uma bateria de sifão defensiva pesada que expele Fogo Grego pressurizado a longas distâncias.',
                            era: ['early', 'middle', 'late'],
                            cost: { gold: 380, manpower: 160 },
                            upkeep: 22,
                            stats: { health: 90, attack: 55, defense: 10, movement: 1, range: 3 },
                            bonuses: { vsBuildings: 3.0, vsShips: 4.0, areaEffect: true },
                            icon: 'greekfire.png',
                            symbol: '🔥🔱'
                        }
                    }
                },
                buildings: {
                    alchemy_lab: {
                        id: 'alchemy_lab',
                        name: 'Laboratório de Alquimia Imperial',
                        description: 'Um laboratório fortificado dedicado à guerra química e experimentos metalúrgicos. Desbloqueia sifões avançados e impulsiona a produção local de ouro.',
                        maxLevel: 3,
                        baseCost: { gold: 120, manpower: 40, prestige: 1 },
                        buildTurns: 2,
                        requires: { tech: 'siegecraft' }
                    }
                },
                techs: {
                    fire_distillation: {
                        id: 'fire_distillation',
                        name: 'Destilação de Nafta',
                        description: 'A destilação aprimorada de misturas de petróleo bruto sustenta os cofres imperiais com contratos navais e concede prestígio constante.',
                        tier: 3,
                        researchTurns: 5,
                        cost: { gold: 320, prestige: 35 },
                        requires: ['siegecraft'],
                        effects: { siegeAttackMultiplier: 1.1, prestigePerTurn: 1 }
                    }
                },
                events: [
                    {
                        id: 'quest_naphtha_leak',
                        type: 'quest',
                        priority: 15,
                        triggerCondition: 'turn >= 3',
                        title: 'Incêndio no Armazém de Nafta',
                        description: 'Um armazém de armazenamento em Constantinopla pegou fogo, liberando fumaça preta tóxica. Como devemos lidar com isso?',
                        choices: [
                            {
                                id: 'leak_quarantine',
                                title: 'Quarentena no setor portuário',
                                subtitle: '-50 de ouro, +5 de prestígio',
                                summary: 'O fogo é isolado com sucesso, preservando a frota, mas custando as receitas do comércio portuário.',
                                effects: { resources: { gold: -50, prestige: 5 } }
                            },
                            {
                                id: 'leak_suppress',
                                title: 'Implantar engenheiros do exército imediatamente',
                                subtitle: '-40 de mão de obra, +15 de prestígio',
                                summary: 'Bravos engenheiros extinguem o incêndio, sofrendo baixas, mas conquistando a admiração dos cidadãos.',
                                effects: { resources: { manpower: -40, prestige: 15 } }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'barbarian_auxiliaries',
                name: 'Mod de Auxiliares Bárbaros',
                description: 'Permite o recrutamento de unidades de guerreiros tribais auxiliares e estabelece um edifício de Posto Avançado de Mercenários.',
                author: 'N Reljin',
                version: '1.1.0',
                enabled: false,
                units: {
                    infantry: {
                        auxiliary_warrior: {
                            id: 'auxiliary_warrior',
                            name: 'Espadachim Auxiliar',
                            type: 'infantry',
                            category: 'heavy',
                            description: 'Feroz espadachim tribal recrutado como auxiliar mercenário.',
                            era: ['early', 'middle'],
                            cost: { gold: 60, manpower: 45 },
                            upkeep: 4,
                            stats: { health: 110, attack: 14, defense: 12, movement: 2, range: 1 },
                            bonuses: { vsInfantry: 1.1 },
                            icon: 'skutatoi.png',
                            symbol: '⚔️🐺'
                        }
                    }
                },
                buildings: {
                    mercenary_camp: {
                        id: 'mercenary_camp',
                        name: 'Posto Avançado de Mercenários',
                        description: 'Um acampamento dedicado a contratar guerreiros tribais locais.',
                        maxLevel: 2,
                        baseCost: { gold: 100, manpower: 20, prestige: 0 },
                        buildTurns: 2,
                        requires: { tech: 'military_logistics' }
                    }
                },
                techs: {
                    foederati_treaties: {
                        id: 'foederati_treaties',
                        name: 'Tratados dos Foederati',
                        description: 'Formaliza tratados com chieftains locais, suavizando a diplomacia e aumentando o número de homens disponíveis para reunião.',
                        tier: 2,
                        researchTurns: 4,
                        cost: { gold: 240, prestige: 28 },
                        requires: ['military_logistics'],
                        effects: { manpowerMultiplier: 1.05, diplomacyAcceptanceBonus: 0.05 }
                    }
                },
                events: [
                    {
                        id: 'chieftain_demand',
                        type: 'event',
                        priority: 20,
                        triggerCondition: 'turn >= 4',
                        title: 'Chefe Tribal Exige Tributo',
                        description: 'Um chefe tribal auxiliar local exige ouro adicional para manter seus guerreiros sob comando imperial.',
                        choices: [
                            {
                                id: 'pay_chieftain',
                                title: 'Pagar o tributo',
                                subtitle: '-100 de ouro, +5 de confiança tribal',
                                summary: 'O chefe tribal permanece leal, garantindo a segurança das fronteiras.',
                                effects: { resources: { gold: -100 }, trust: { tribal: 5 } }
                            },
                            {
                                id: 'refuse_chieftain',
                                title: 'Recusar as exigências',
                                subtitle: '-10 de prestígio, -2 de confiança tribal',
                                summary: 'O moral dos auxiliares oscila e a confiança diplomática é afetada.',
                                effects: { resources: { prestige: -10 }, trust: { tribal: -2 } }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'imperial_roads_expansion',
                name: 'Mod de Expansão de Estradas Imperiais',
                description: 'Financia um programa de rodovias imperiais que atravessa o continente: um novo edifício de Depósito de Rodovias, uma unidade de Corpo de Engenheiros e uma tecnologia de Agrimensura Romana que impulsiona o movimento e o comércio.',
                author: 'Burocracia Imperial',
                version: '1.0.0',
                enabled: false,
                units: {
                    special: {
                        engineer_corps: {
                            id: 'engineer_corps',
                            name: 'Corpo de Engenheiros Imperiais',
                            type: 'special',
                            category: 'support',
                            description: 'Construtores de estradas disciplinados que aceleram o movimento através de províncias amigas.',
                            era: ['early', 'middle', 'late'],
                            cost: { gold: 120, manpower: 60 },
                            upkeep: 5,
                            stats: { health: 70, attack: 4, defense: 6, movement: 3, range: 1 },
                            bonuses: { roadBuildSpeed: 2.0 },
                            icon: 'engineers.png',
                            symbol: '🛠️🛣️'
                        }
                    }
                },
                buildings: {
                    highway_depot: {
                        id: 'highway_depot',
                        name: 'Depósito de Rodovias',
                        description: 'Um depósito provincial que armazena pedras de pavimentação, ferramentas e cavalos de posta para acelerar a construção de estradas.',
                        maxLevel: 3,
                        baseCost: { gold: 140, manpower: 70, prestige: 2 },
                        buildTurns: 3,
                        requires: { tech: 'military_logistics' }
                    }
                },
                techs: {
                    roman_surveying: {
                        id: 'roman_surveying',
                        name: 'Agrimensura Romana',
                        description: 'A agrimensura padronizada e o uso de groman permitem estradas mais retas e rápidas — impulsionando o movimento e a renda comercial em todo o império.',
                        tier: 2,
                        researchTurns: 3,
                        cost: { gold: 260, prestige: 30 },
                        requires: ['military_logistics'],
                        effects: { movement: 1, tradeIncomeMultiplier: 1.1 }
                    }
                },
                events: [
                    {
                        id: 'quest_imperial_road',
                        type: 'quest',
                        priority: 18,
                        cooldown: 8,
                        triggerCondition: 'turn >= 5',
                        title: 'Petição pela Estrada Imperial',
                        description: 'Um consórcio de governadores provinciais peticiona para financiar uma nova seção da Rodovia Imperial.',
                        choices: [
                            {
                                id: 'road_fund',
                                title: 'Financiar a expansão da rodovia',
                                subtitle: '-120 de ouro, +10 de prestígio',
                                summary: 'A nova estrada reduz os tempos de viagem pela metade e impulsiona as receitas comerciais.',
                                effects: { resources: { gold: -120, prestige: 10 } }
                            },
                            {
                                id: 'road_defer',
                                title: 'Adiar o projeto para o próximo ano de campanha',
                                subtitle: '-3 de prestígio',
                                summary: 'Os governadores resmungam com o atraso, mas os cofres são poupados.',
                                effects: { resources: { prestige: -3 } }
                            }
                        ]
                    }
                ]
            }
        ];
    }

    seedExampleMods() {
        this.mods = JSON.parse(JSON.stringify(this.getExampleModCatalog()));
        this.saveToStorage();
    }

    /**
     * Install (or replace) a seeded example mod by id. Returns true when an
     * entry exists in the catalog and was installed, false otherwise.
     */
    installExampleMod(modId) {
        if (this.isCampaignActive()) return false;
        const catalog = this.getExampleModCatalog();
        const example = catalog.find((m) => m.id === modId);
        if (!example) return false;
        const cloned = JSON.parse(JSON.stringify(example));
        const existingIdx = this.mods.findIndex((m) => m.id === modId);
        if (existingIdx >= 0) {
            this.mods[existingIdx] = cloned;
        } else {
            this.mods.push(cloned);
        }
        this.saveToStorage();
        this.applyMods();
        return true;
    }

    /**
     * Validate mod JSON structure
     * Returns { success: true } or { success: false, errors: [...] }
     */
    validateMod(mod) {
       const errors = [];
        if (!mod || typeof mod !== 'object') {
            return { success: false, errors: ['O payload do mod deve ser um objeto JSON válido.'] };
        }

        if (!mod.id || typeof mod.id !== 'string' || !MOD_ID_REGEX.test(mod.id) || isModUnsafeKey(mod.id)) {
            errors.push('O ID do mod deve ser uma string segura em minúsculas (letras, números, hífens, sublinhados) e não pode ser uma chave reservada como __proto__, prototype ou constructor.');
        }

        if (!mod.name || typeof mod.name !== 'string' || mod.name.trim() === '') {
            errors.push('O nome do mod deve ser uma string não vazia.');
        }

        if (!mod.version || typeof mod.version !== 'string') {
            errors.push('A versão do mod deve ser uma string de versão válida (ex.: "1.0.0").');
        }

        if (mod.enabled !== undefined && typeof mod.enabled !== 'boolean') {
            errors.push('A propriedade "enabled" do mod deve ser um booleano (true ou false) quando definida.');
        }

        // Validate units if present
        if (mod.units) {
           if (typeof mod.units !== 'object' || Array.isArray(mod.units)) {
                errors.push('A seção de unidades deve ser um objeto indexado por categoria.');
            } else {
                for (const cat in mod.units) {
                    if (!['infantry', 'cavalry', 'special', 'naval'].includes(cat)) {
                        errors.push(`Categoria de unidade inválida: "${cat}". Deve ser infantry, cavalry, special ou naval.`);
                        continue;
                    }
                    const categoryUnits = mod.units[cat];
                    if (!categoryUnits || typeof categoryUnits !== 'object' || Array.isArray(categoryUnits)) {
                        errors.push(`As unidades em "${cat}" devem ser definidas como um objeto indexado pelo ID da unidade.`);
                        continue;
                    }
                    for (const unitId in categoryUnits) {
                        if (isModUnsafeKey(unitId) || !MOD_ID_REGEX.test(unitId)) {
                            errors.push(`O ID de unidade "${unitId}" não é um identificador seguro.`);
                            continue;
                        }
                        const unit = categoryUnits[unitId];
                        if (!unit || typeof unit !== 'object') {
                            errors.push(`A unidade "${unitId}" deve ser um objeto.`);
                            continue;
                        }
                        if (unit.id !== unitId) {
                            errors.push(`Incompatibilidade de ID de unidade: a chave "${unitId}" não corresponde ao unit.id interno "${unit.id}".`);
                        }
                        if (!unit.name || typeof unit.name !== 'string') errors.push(`A unidade "${unitId}" deve ter um nome.`);
                        if (!unit.era || !Array.isArray(unit.era)) errors.push(`A unidade "${unitId}" deve especificar eras válidas como um array.`);
                        if (!unit.cost || typeof unit.cost !== 'object') {
                            errors.push(`A unidade "${unitId}" deve ter um objeto de custo com ouro e mão de obra numéricos.`);
                        } else {
                            ['gold', 'manpower'].forEach((field) => {
                                const v = unit.cost[field];
                                if (!Number.isFinite(v) || v < 0) {
                                    errors.push(`O custo.${field} da unidade "${unitId}" deve ser um número finito >= 0.`);
                                }
                            });
                        }
                        if (!unit.stats || typeof unit.stats !== 'object') {
                            errors.push(`A unidade "${unitId}" deve ter um objeto de estatísticas (stats).`);
                        } else {
                            const requiredStats = ['health', 'attack', 'defense', 'movement', 'range'];
                            requiredStats.forEach(stat => {
                                const v = unit.stats[stat];
                                if (!Number.isFinite(v) || v < 0) {
                                    errors.push(`A estatística "${stat}" da unidade "${unitId}" deve ser um número finito >= 0.`);
                                }
                            });
                        }
                    }
                }
            }
        }

        // Validate buildings if present — must match core CITY_BUILDING_TREE shape (baseCost + buildTurns)
        if (mod.buildings) {
            if (typeof mod.buildings !== 'object' || Array.isArray(mod.buildings)) {
                errors.push('A seção de edifícios deve ser um objeto indexado pelo ID do edifício.');
            } else {
                for (const bldId in mod.buildings) {
                    if (isModUnsafeKey(bldId) || !MOD_ID_REGEX.test(bldId)) {
                        errors.push(`O ID de edifício "${bldId}" não é um identificador seguro.`);
                        continue;
                    }
                    const bld = mod.buildings[bldId];
                    if (!bld || typeof bld !== 'object') {
                        errors.push(`O edifício "${bldId}" deve ser um objeto.`);
                        continue;
                    }
                    // O `id` interno é opcional (as entradas principais de CITY_BUILDING_TREE não possuem um).
                    // Se presente, deve corresponder à chave — caso contrário, applyMods preenche automaticamente a partir da chave.
                    if (bld.id !== undefined && bld.id !== bldId) {
                        errors.push(`Incompatibilidade de ID de edifício: a chave "${bldId}" não corresponde ao building.id interno "${bld.id}".`);
                    }
                    if (!bld.name || typeof bld.name !== 'string') errors.push(`O edifício "${bldId}" deve ter um nome.`);
                    if (!Number.isFinite(bld.maxLevel) || bld.maxLevel < 1) {
                        errors.push(`O edifício "${bldId}" deve especificar um maxLevel finito >= 1.`);
                    }
                    if (!bld.baseCost || typeof bld.baseCost !== 'object') {
                        errors.push(`O edifício "${bldId}" deve ter um objeto baseCost com ouro/mão de obra/prestígio numéricos.`);
                    } else {
                        ['gold', 'manpower', 'prestige'].forEach((field) => {
                            const v = bld.baseCost[field];
                            if (!Number.isFinite(v) || v < 0) {
                                errors.push(`O baseCost.${field} do edifício "${bldId}" deve ser um número finito >= 0.`);
                            }
                        });
                    }
                    if (!Number.isFinite(bld.buildTurns) || bld.buildTurns < 1) {
                        errors.push(`O edifício "${bldId}" deve especificar buildTurns finito >= 1.`);
                    }
                }
            }
        }

        // Validate techs if present — must match core TECHNOLOGY_TREE shape (requires array, cost object)
        if (mod.techs) {
            if (typeof mod.techs !== 'object' || Array.isArray(mod.techs)) {
                errors.push('A seção de tecnologias deve ser um objeto indexado pelo ID da tecnologia.');
            } else {
                for (const techId in mod.techs) {
                    if (isModUnsafeKey(techId) || !MOD_ID_REGEX.test(techId)) {
                        errors.push(`O ID de tecnologia "${techId}" não é um identificador seguro.`);
                        continue;
                    }
                    const tech = mod.techs[techId];
                    if (!tech || typeof tech !== 'object') {
                        errors.push(`A tecnologia "${techId}" deve ser um objeto.`);
                        continue;
                    }
                    // O `id` e o `tier` internos são opcionais (as entradas principais de TECHNOLOGY_TREE não possuem
                    // nenhum deles); aplique a verificação de correspondência de chave apenas se o `id` estiver explicitamente definido.
                    if (tech.id !== undefined && tech.id !== techId) {
                        errors.push(`Incompatibilidade de ID de tecnologia: a chave "${techId}" não corresponde ao tech.id interno "${tech.id}".`);
                    }
                    if (!tech.name || typeof tech.name !== 'string') errors.push(`A tecnologia "${techId}" deve ter um nome.`);
                    if (tech.tier !== undefined && (!Number.isFinite(tech.tier) || tech.tier < 0)) {
                        errors.push(`O tier da tecnologia "${techId}" deve ser um número finito >= 0 quando definido.`);
                    }
                    if (!Number.isFinite(tech.researchTurns) || tech.researchTurns < 1) {
                        errors.push(`A tecnologia "${techId}" deve especificar researchTurns finito >= 1.`);
                    }
                    if (tech.requires !== undefined && !Array.isArray(tech.requires)) {
                        errors.push(`A propriedade requires da tecnologia "${techId}" deve ser um array de IDs de tecnologia (ex.: ["siegecraft"]).`);
                    }
                    if (!tech.cost || typeof tech.cost !== 'object') {
                        errors.push(`A tecnologia "${techId}" deve ter um objeto cost com ouro/prestígio numéricos.`);
                    } else {
                        if (!Number.isFinite(tech.cost.gold) || tech.cost.gold < 0) {
                            errors.push(`O cost.gold da tecnologia "${techId}" deve ser um número finito >= 0.`);
                        }
                        if (tech.cost.prestige !== undefined && (!Number.isFinite(tech.cost.prestige) || tech.cost.prestige < 0)) {
                            errors.push(`O cost.prestige da tecnologia "${techId}" deve ser um número finito >= 0 quando definido.`);
                        }
                    }
                }
            }
        }

        // Validate events if present
        if (mod.events) {
            if (!Array.isArray(mod.events)) {
                errors.push('A seção de eventos deve ser um array.');
            } else {
                mod.events.forEach((evt, idx) => {
                    if (!evt || typeof evt !== 'object') {
                        errors.push(`O evento no índice ${idx} deve ser um objeto.`);
                        return;
                    }
                    if (!evt.id || typeof evt.id !== 'string') {
                        errors.push(`O evento no índice ${idx} deve ter um ID.`);
                    } else if (isModUnsafeKey(evt.id) || !MOD_ID_REGEX.test(evt.id)) {
                        errors.push(`O ID de evento "${evt.id}" não é um identificador seguro (letras minúsculas, números, hífens, sublinhados; não __proto__/prototype/constructor).`);
                    }
                    if (!evt.title || typeof evt.title !== 'string') errors.push(`O evento "${evt.id || idx}" deve ter um título.`);
                    if (!evt.description || typeof evt.description !== 'string') errors.push(`O evento "${evt.id || idx}" deve ter uma descrição.`);
                    if (evt.triggerCondition !== undefined) {
                        if (typeof evt.triggerCondition !== 'string') {
                            errors.push(`A condição de gatilho (triggerCondition) do evento "${evt.id || idx}" deve ser uma expressão em string (ex.: "turn >= 5").`);
                        } else if (!MOD_TRIGGER_CONDITION_REGEX.test(evt.triggerCondition)) {
                            errors.push(`A condição de gatilho "${evt.triggerCondition}" do evento "${evt.id || idx}" não corresponde à gramática suportada: variável (turn, gold, manpower ou prestígio), seguida por um dos operadores >=, <=, >, <, ==, e depois um número inteiro não negativo (ex.: "turn >= 5").`);
                        }
                    }
                    if (evt.triggerTags !== undefined) {
                        if (!Array.isArray(evt.triggerTags)) {
                            errors.push(`As tags de gatilho (triggerTags) do evento "${evt.id || idx}" devem ser um array de strings quando fornecidas.`);
                        } else if (evt.triggerTags.some((tag) => typeof tag !== 'string')) {
                            errors.push(`Todas as entradas de triggerTags do evento "${evt.id || idx}" devem ser strings.`);
                        }
                    }
                    if (evt.priority !== undefined && !Number.isFinite(evt.priority)) {
                        errors.push(`A prioridade do evento "${evt.id || idx}" deve ser um número finito quando definida.`);
                    }
                    if (evt.cooldown !== undefined && (!Number.isInteger(evt.cooldown) || evt.cooldown < 0)) {
                        errors.push(`O cooldown do evento "${evt.id || idx}" deve ser um número inteiro não negativo quando definido.`);
                    }
                    if (evt.choices && !Array.isArray(evt.choices)) {
                        errors.push(`As escolhas (choices) do evento "${evt.id || idx}" devem ser um array.`);
                    } else if (evt.choices) {
                        evt.choices.forEach((choice, choiceIdx) => {
                            if (!choice || typeof choice !== 'object') {
                                errors.push(`A escolha no índice ${choiceIdx} do evento "${evt.id || idx}" deve ser um objeto.`);
                                return;
                            }
                            if (!choice.id || typeof choice.id !== 'string') {
                                errors.push(`A escolha no índice ${choiceIdx} do evento "${evt.id || idx}" deve ter um ID.`);
                            }
                            if (!choice.title || typeof choice.title !== 'string') {
                                errors.push(`A escolha "${choice.id || choiceIdx}" do evento "${evt.id || idx}" deve ter um título.`);
                            }
                        });
                    }
                });
            }
        }

        return {
            success: errors.length === 0,
            errors
        };
    }

    /**
     * Add or update a mod
     */
    addMod(modData) {
        if (this.isCampaignActive()) {
            return { success: false, errors: ['Mods não podem ser instalados ou atualizados enquanto uma campanha estiver em andamento. Retorne ao Menu Principal primeiro.'] };
        }
        const validation = this.validateMod(modData);
        if (!validation.success) {
            return validation;
        }

        // Clean values
        const newMod = {
            id: modData.id,
            name: modData.name,
            description: modData.description || '',
            author: modData.author || 'Anonymous',
            version: modData.version,
            enabled: typeof modData.enabled === 'boolean' ? modData.enabled : true,
            units: modData.units || {},
            buildings: modData.buildings || {},
            techs: modData.techs || {},
            events: modData.events || []
        };

        const existingIdx = this.mods.findIndex(m => m.id === newMod.id);
        if (existingIdx >= 0) {
            this.mods[existingIdx] = newMod;
        } else {
            this.mods.push(newMod);
        }

        this.saveToStorage();
        this.applyMods();

        return { success: true };
    }

    /**
     * Campaigns reference live unit/building/tech templates by id (e.g.
     * combat reads `attackerType.stats.range`), so removing a template while
     * the game screen is active can crash gameplay. Block mod toggle/delete
     * in that case — players must change mods from the Main Menu.
     *
     * Note: `gameState.initialized` stays true after `returnToMainMenu()`
     * (which only swaps screens), so the source of truth here is which
     * screen the UI is currently showing.
     */
    isCampaignActive() {
        if (typeof uiManager !== 'undefined' && uiManager && uiManager.currentScreen) {
            return uiManager.currentScreen === 'game';
        }
        return false;
    }

    /**
     * Toggle a mod's active state. Returns 'ok' on success, 'not_found' if
     * the id is unknown, or 'campaign_active' if a campaign is in progress.
     */
    toggleMod(modId) {
        if (this.isCampaignActive()) return 'campaign_active';
        const mod = this.mods.find(m => m.id === modId);
        if (!mod) return 'not_found';
        mod.enabled = !mod.enabled;
        this.saveToStorage();
        this.applyMods();
        return 'ok';
    }

    /**
     * Delete a mod. Returns 'ok' / 'not_found' / 'campaign_active' similar to toggleMod.
     */
    deleteMod(modId) {
        if (this.isCampaignActive()) return 'campaign_active';
        const initialLen = this.mods.length;
        this.mods = this.mods.filter(m => m.id !== modId);
        if (this.mods.length === initialLen) return 'not_found';
        this.saveToStorage();
        this.applyMods();
        return 'ok';
    }

    /**
     * Merge all enabled mods into core game data structures
     */
    applyMods() {
        this.backupCoreData();
        if (!this.originalData) return; // Cannot apply without backup

        // Reset to original core structures
        for (const cat in UNIT_TYPES) {
            delete UNIT_TYPES[cat];
        }
        Object.assign(UNIT_TYPES, JSON.parse(JSON.stringify(this.originalData.units)));

        for (const id in CITY_BUILDING_TREE) {
            delete CITY_BUILDING_TREE[id];
        }
        Object.assign(CITY_BUILDING_TREE, JSON.parse(JSON.stringify(this.originalData.buildings)));

        for (const id in TECHNOLOGY_TREE) {
            delete TECHNOLOGY_TREE[id];
        }
        Object.assign(TECHNOLOGY_TREE, JSON.parse(JSON.stringify(this.originalData.techs)));

        // Reset recruitment catalog so disabled mod units no longer recruit
        if (this.originalData.recruitmentCatalog && typeof RECRUITMENT_UNIT_CATALOG !== 'undefined') {
            RECRUITMENT_UNIT_CATALOG.length = 0;
            RECRUITMENT_UNIT_CATALOG.push(...this.originalData.recruitmentCatalog);
        }

        // Merge enabled mods
        const enabledMods = this.mods.filter(m => m.enabled);
        console.log(`ModManager: Aplicando ${enabledMods.length} mods ativados.`);

        for (const mod of enabledMods) {
            // Merge units — skip unsafe keys to avoid prototype pollution
            if (mod.units) {
                for (const cat in mod.units) {
                    if (isModUnsafeKey(cat)) continue;
                    if (!UNIT_TYPES[cat]) UNIT_TYPES[cat] = {};
                    for (const unitId in mod.units[cat]) {
                        if (isModUnsafeKey(unitId)) continue;
                        UNIT_TYPES[cat][unitId] = JSON.parse(JSON.stringify(mod.units[cat][unitId]));
                        if (typeof RECRUITMENT_UNIT_CATALOG !== 'undefined' && !RECRUITMENT_UNIT_CATALOG.includes(unitId)) {
                            RECRUITMENT_UNIT_CATALOG.push(unitId);
                        }
                    }
                }
            }

            // Merge buildings — auto-fill missing inner id from the key so
            // mods that follow the core (id-less) shape still resolve.
            if (mod.buildings) {
                for (const bldId in mod.buildings) {
                    if (isModUnsafeKey(bldId)) continue;
                    const cloned = JSON.parse(JSON.stringify(mod.buildings[bldId]));
                    if (cloned && typeof cloned === 'object' && cloned.id === undefined) {
                        cloned.id = bldId;
                    }
                    CITY_BUILDING_TREE[bldId] = cloned;
                }
            }

            // Merge techs — same auto-fill so id-less mod techs still resolve.
            if (mod.techs) {
                for (const techId in mod.techs) {
                    if (isModUnsafeKey(techId)) continue;
                    const cloned = JSON.parse(JSON.stringify(mod.techs[techId]));
                    if (cloned && typeof cloned === 'object' && cloned.id === undefined) {
                        cloned.id = techId;
                    }
                    TECHNOLOGY_TREE[techId] = cloned;
                }
            }
        }

        // Notify state or map if running
        if (typeof gameState !== 'undefined' && gameState.initialized) {
            // Update UI views if possible to capture changes in technology and building trees
            if (typeof uiManager !== 'undefined') {
                uiManager.updateHUD();
                if (typeof gameMap !== 'undefined') gameMap.requestRender();
            }
        }
    }

    /**
     * Get a list of narrative events defined in enabled mods.
     *
     * Event `id` is namespaced as `mod:<modId>:<eventId>` so it can't collide
     * with core dynamic-narrative template ids (or with events from other
     * mods) in the shared cooldown map. The original id is preserved as
     * `sourceId` for display/debugging.
     */
    getEnabledEvents() {
        const events = [];
        const enabledMods = this.mods.filter(m => m.enabled);
        for (const mod of enabledMods) {
            if (Array.isArray(mod.events)) {
                mod.events.forEach(evt => {
                    if (!evt || typeof evt !== 'object' || !evt.id) return;
                    const safeTriggerTags = Array.isArray(evt.triggerTags)
                        ? evt.triggerTags.filter((tag) => typeof tag === 'string')
                        : [];
                    events.push({
                        ...evt,
                        triggerTags: safeTriggerTags,
                        sourceId: evt.id,
                        id: `mod:${mod.id}:${evt.id}`,
                        modId: mod.id,
                        modName: mod.name
                    });
                });
            }
        }
        return events;
    }
}

// Global ModManager instance
const modManager = new ModManager();
window.modManager = modManager;

// Helper to evaluate basic data-driven trigger conditions safely
function evaluateModCondition(conditionStr, state) {
    if (!conditionStr) return true;
    
    // Support basic variables: turn, gold, manpower, prestige
    const match = conditionStr.match(MOD_TRIGGER_CONDITION_REGEX);
    if (!match) return false;
    
    const [, variable, operator, valueStr] = match;
    const value = parseInt(valueStr, 10);
    
    let actualVal = 0;
    if (variable === 'turn') actualVal = state.turn;
    else if (variable === 'gold') actualVal = state.player?.resources?.gold || 0;
    else if (variable === 'manpower') actualVal = state.player?.resources?.manpower || 0;
    else if (variable === 'prestige') actualVal = state.player?.resources?.prestige || 0;
    
    switch (operator) {
        case '>=': return actualVal >= value;
        case '<=': return actualVal <= value;
        case '>': return actualVal > value;
        case '<': return actualVal < value;
        case '==': return actualVal === value;
        default: return false;
    }
}
window.evaluateModCondition = evaluateModCondition;
