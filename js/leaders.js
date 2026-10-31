/**
 * Byzantine Leaders Data
 * Historically accurate emperors and generals from 500-1453 AD
 */

const LEADERS = {
    // 6th Century (Justinian Era)
    century6: {
        byzantine: [
            
        {
            id: 'justinian',
            name: 'Justiniano I',
            title: 'O Grande',
            years: '527-565 d.C.',
            era: 'early',
            portrait: 'justinian.png',
            stats: { military: 7, economy: 9, diplomacy: 8 },
            abilities: [
                { name: 'Reconquista', description: '+20% de dano de cerco, -10% nos custos de construção' },
                { name: 'Corpus Juris Civilis', description: '+15% de ouro de territórios' }
            ],
            startingResources: { gold: 1200, manpower: 600, prestige: 150 },
            bonuses: { siegeDamage: 1.2, buildingCost: 0.9, goldIncome: 1.15 }
        },
        {
            id: 'belisarius',
            name: 'Belisário',
            title: 'O General Lendário',
            years: '505-565 d.C.',
            era: 'early',
            portrait: 'belisarius.png',
            stats: { military: 10, economy: 6, diplomacy: 7 },
            abilities: [
                { name: 'Mestre da Cavalaria', description: '+30% de ataque e movimento da cavalaria' },
                { name: 'Gênio Tático', description: 'Pode vencer batalhas estando em desvantagem numérica de 2:1' }
            ],
            startingResources: { gold: 1000, manpower: 800, prestige: 120 },
            bonuses: { cavalryAttack: 1.3, cavalryMovement: 1.3, outnumberedBonus: 0.5 }
        }

        ],
        enemies: [
            
        {
            id: 'khosrow1',
            name: 'Cosroes I',
            title: 'Anushiruvan',
            faction: 'Império Sassânida',
            civilization: 'sassanid',
            years: '531-579 d.C.',
            era: 'early',
            portrait: 'khosrow_i.png',
            stats: { military: 9, economy: 10, diplomacy: 8 },
            abilities: [
                { name: 'Shahanshah', description: '+25% de geração de recursos' },
                { name: 'Cavalaria Savaran', description: '+20% de poder da cavalaria pesada' }
            ],
            startingResources: { gold: 1500, manpower: 700, prestige: 200 },
            bonuses: { resourceIncome: 1.25, cavalryPower: 1.2 }
        },
        {
            id: 'totila',
            name: 'Totila',
            title: 'Rei dos Ostrogodos',
            faction: 'Reino Ostrogodo',
            civilization: 'frank',
            years: '541-552 d.C.',
            era: 'early',
            portrait: 'totila.png',
            stats: { military: 9, economy: 5, diplomacy: 6 },
            abilities: [
                { name: 'Resistência Gótica', description: '+40% de defesa na Itália' },
                { name: 'Libertador', description: 'Reduz a agitação dos camponeses' }
            ],
            startingResources: { gold: 600, manpower: 900, prestige: 100 },
            bonuses: { homeDefense: 1.4 }
        }

        ]
    },

    // 7th Century (Heraclian Era)
    century7: {
        byzantine: [
            {
                id: 'heraclius',
                name: 'Heráclio',
                title: 'O Reformador',
                years: '610-641 d.C.',
                era: 'early',
                portrait: 'heraclius.png',
                stats: { military: 8, economy: 8, diplomacy: 7 },
                abilities: [
                    { name: 'Sistema de Temas', description: '+20% de regeneração de mão de obra' },
                    { name: 'Verdadeira Cruz', description: '+30% de prestígio em vitórias' }
                ],
                startingResources: { gold: 900, manpower: 1000, prestige: 250 },
                bonuses: { manpowerRegen: 1.2, prestigeBonus: 1.3 }
            }
        ],
        enemies: [
            {
                id: 'khalid',
                name: 'Khalid ibn al-Walid',
                title: 'Espada de Alá',
                faction: 'Califado Rashidun',
                civilization: 'arab',
                years: '585-642 d.C.',
                era: 'early',
                portrait: 'khalid.png',
                stats: { military: 10, economy: 6, diplomacy: 5 },
                abilities: [
                    { name: 'Guerra no Deserto', description: '+50% de velocidade no deserto' },
                    { name: 'Invicto', description: '+20% de moral para todas as unidades' }
                ],
                startingResources: { gold: 800, manpower: 1200, prestige: 300 },
                bonuses: { desertSpeed: 1.5, moraleBoost: 1.2 }
            }
        ]
    },

    // 10th Century (Macedonian Era)
    century10: {
        byzantine: [
            {
                id: 'basil2',
                name: 'Basílio II',
                title: 'Matador de Búlgaros',
                years: '976-1025 d.C.',
                era: 'middle',
                portrait: 'basil_ii.png',
                stats: { military: 10, economy: 8, diplomacy: 5 },
                abilities: [
                    { name: 'Conquista Implacável', description: '+25% de ataque, -20% de manutenção de unidades' },
                    { name: 'Escudo Varegue', description: '+30% de defesa da Guarda Varegue' }
                ],
                startingResources: { gold: 2000, manpower: 1500, prestige: 300 },
                bonuses: { unitAttack: 1.25, upkeepReduction: 0.8, eliteDefense: 1.3 }
            }
        ],

        contestants: [
            {
                id: 'bardas_skleros',
                name: 'Bardas Esclero',
                title: 'O General Rebelde',
                years: '976-979 d.C. (Rebelião)',
                era: 'middle',
                civilization: 'byzantine',
                portrait: 'bardas_skleros.png',
                stats: { military: 9, economy: 6, diplomacy: 7 },
                abilities: [
                    { name: 'Apoio Anatólio', description: '+40% de velocidade de recrutamento no Leste' },
                    { name: 'Aliados Armênios', description: 'Pode recrutar unidades armênias únicas' }
                ],
                startingResources: { gold: 1200, manpower: 1100, prestige: 100 },
                bonuses: { recruitmentSpeed: 1.4 }
            }
        ],
        
        enemies: [
            {
                id: 'samuel',
                name: 'Samuel da Bulgária',
                title: 'Czar dos Búlgaros',
                faction: 'Primeiro Império Búlgaro',
                civilization: 'bulgar',
                years: '997-1014 d.C.',
                era: 'middle',
                portrait: 'samuel.png',
                stats: { military: 8, economy: 7, diplomacy: 6 },
                abilities: [
                    { name: 'Emboscada nas Montanhas', description: '+40% de ataque em colinas/montanhas' },
                    { name: 'Resiliência Búlgara', description: '+20% de vida para todas as unidades' }
                ],
                startingResources: { gold: 800, manpower: 1400, prestige: 150 },
                bonuses: { hillAttack: 1.4, healthBonus: 1.2 }
            }
        ]
    },

    // 11th Century (Komnenian Era)
    century11: {
        byzantine: [
            {
                id: 'alexios1',
                name: 'Alexandre I Comneno',
                title: 'O Restaurador',
                years: '1081-1118 d.C.',
                era: 'late',
                portrait: 'alexios_i.png',
                stats: { military: 7, economy: 8, diplomacy: 10 },
                abilities: [
                    { name: 'Gênio Diplomático', description: '-30% nos custos de mercenários' },
                    { name: 'Reforma Comnena', description: '+20% de eficácia das unidades de elite' }
                ],
                startingResources: { gold: 1400, manpower: 800, prestige: 200 },
                bonuses: { mercenaryDiscount: 0.7, eliteBoost: 1.2 }
            }
        ],
        enemies: [
            {
                id: 'alp_arslan',
                name: 'Alp Arslan',
                title: 'O Leão Valente',
                faction: 'Império Seljúcida',
                civilization: 'arab',
                years: '1063-1072 d.C.',
                era: 'late',
                portrait: 'alp_arslan.png',
                stats: { military: 10, economy: 7, diplomacy: 6 },
                abilities: [
                    { name: 'Táticas de Manziquerta', description: '+50% de dano contra infantaria pesada' },
                    { name: 'Cavaleiros Turcos', description: '+30% de velocidade dos arqueiros montados' }
                ],
                startingResources: { gold: 1300, manpower: 1600, prestige: 350 },
                bonuses: { antiInfantry: 1.5, cavalrySpeed: 1.3 }
            }
        ]
    },
};

/**
 * Get all available centuries
 */
function getAvailableCenturies() {
    return Object.keys(LEADERS).map(key => key.replace('century', ''));
}

/**
 * Get factions for a specific century
 */
function getFactionsByCentury(century) {
    const data = LEADERS[`century${century}`];
    if (!data) return [];
    return Object.keys(data);
}

/**
 * Get leaders for a specific century and faction
 */
function getLeadersByCenturyAndFaction(century, faction) {
    const data = LEADERS[`century${century}`];
    return data && data[faction] ? data[faction] : [];
}

/**
 * Get a specific leader by ID across all data
 */
function getLeaderById(id) {
    for (const century in LEADERS) {
        for (const faction in LEADERS[century]) {
            const leader = LEADERS[century][faction].find(l => l.id === id);
            if (leader) return leader;
        }
    }
    return null;
}

/**
 * Get all leaders (legacy support)
 */
function getAllLeaders() {
    let all = [];
    for (const century in LEADERS) {
        for (const faction in LEADERS[century]) {
            all = all.concat(LEADERS[century][faction]);
        }
    }
    return all;
}
