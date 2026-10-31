/**
 * Byzantine and Historical Symbols
 * Unicode characters representing Byzantine, Roman, and medieval symbols
 */

const BYZANTINE_SYMBOLS = {
    // Religious & Imperial
    cross: '☦',           // Orthodox Cross
    chi_rho: '☧',         // Chi-Rho (Christogram)
    crown: '👑',          // Imperial Crown
    eagle: '🦅',          // Double-headed Eagle (Byzantine symbol)

    // Military
    sword: '⚔',           // Crossed Swords
    shield: '🛡',         // Shield
    spear: '🗡',          // Spear
    helmet: '⛑',         // Helmet

    // Architecture
    church: '⛪',         // Church/Cathedral
    fortress: '🏰',       // Fortress/Castle
    tower: '🗼',          // Tower

    // Resources & Economy
    gold: '💰',           // Gold/Treasury
    grain: '🌾',          // Grain/Agriculture
    ship: '⛵',           // Naval/Trade
    scroll: '📜',         // Diplomacy/Learning

    // Terrain
    mountain: '⛰',       // Mountains
    water: '🌊',          // Sea/Water
    forest: '🌲',         // Forest
    city: '🏛',           // Classical City

    // Directional
    north: '⬆',
    south: '⬇',
    east: '➡',
    west: '⬅',

    // Status
    victory: '🏆',
    defeat: '💀',
    peace: '☮',
    war: '⚡'
};

const FACTION_SYMBOLS = {
    byzantine: '☦',       // Orthodox Cross
    sassanid: '🔥',       // Fire (Zoroastrian)
    arab: '☪',            // Star and Crescent
    bulgar: '⚔',          // Sword
    seljuk: '🌙',         // Crescent
    crusader: '✝',        // Latin Cross
    ostrogoth: '🗡',      // Sword
    frank: '⚜',           // Fleur-de-lis
    rus: '🐻'             // Bear
};

const ERA_SYMBOLS = {
    early: '🏛',          // Classical architecture
    middle: '⛪',         // Medieval church
    late: '🏰'            // Castle/fortress
};

/**
 * Get symbol for a faction
 */
function getFactionSymbol(faction) {
    return FACTION_SYMBOLS[faction] || '⚔';
}

/**
 * Get symbol for an era
 */
function getEraSymbol(era) {
    return ERA_SYMBOLS[era] || '🏛';
}

/**
 * Get symbol for terrain type
 */
function getTerrainSymbol(terrain) {
    const symbols = {
        plains: '🌾',
        hills: '⛰',
        mountains: '🏔',
        forest: '🌲',
        water: '🌊',
        city: '🏛',
        desert: '🏜'
    };
    return symbols[terrain] || '·';
}
