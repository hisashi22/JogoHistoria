/**
 * Combat System
 * Turn-based combat calculations with Byzantine tactics
 */

const TACTICAL_FORMATIONS = {
    line: {
        id: 'line',
        name: 'Linha',
        attackMultiplier: 1,
        defenseMultiplier: 1,
        moraleMultiplier: 1,
        speedMultiplier: 1
    },
    wedge: {
        id: 'wedge',
        name: 'Cunha',
        attackMultiplier: 1.22,
        defenseMultiplier: 0.88,
        moraleMultiplier: 0.96,
        speedMultiplier: 1.1
    },
    shield_wall: {
        id: 'shield_wall',
        name: 'Muralha de Escudos',
        attackMultiplier: 0.85,
        defenseMultiplier: 1.28,
        moraleMultiplier: 1.08,
        speedMultiplier: 0.82
    }
};

const TERRAIN_TACTICAL_MODIFIERS = {
    plains: { speedMultiplier: 1.07, moraleMultiplier: 1 },
    forest: { speedMultiplier: 0.84, moraleMultiplier: 1.03 },
    hills: { speedMultiplier: 0.87, moraleMultiplier: 1.04 },
    mountains: { speedMultiplier: 0.73, moraleMultiplier: 1.08 },
    city: { speedMultiplier: 0.9, moraleMultiplier: 1.05 },
    water: { speedMultiplier: 1, moraleMultiplier: 1 }
};

const BATTLE_TYPE_TACTICAL_MODIFIERS = {
    field: {
        attacker: { attackMultiplier: 1, defenseMultiplier: 1, speedMultiplier: 1, moraleMultiplier: 1 },
        defender: { attackMultiplier: 1, defenseMultiplier: 1, speedMultiplier: 1, moraleMultiplier: 1 }
    },
    siege: {
        attacker: { attackMultiplier: 0.94, defenseMultiplier: 0.96, speedMultiplier: 0.9, moraleMultiplier: 0.96 },
        defender: { attackMultiplier: 1.02, defenseMultiplier: 1.12, speedMultiplier: 0.92, moraleMultiplier: 1.06 }
    },
    ambush: {
        attacker: { attackMultiplier: 1.08, defenseMultiplier: 0.96, speedMultiplier: 1.05, moraleMultiplier: 1.03 },
        defender: { attackMultiplier: 0.95, defenseMultiplier: 1.08, speedMultiplier: 0.93, moraleMultiplier: 1.02 }
    },
    naval: {
        attacker: { attackMultiplier: 1.03, defenseMultiplier: 0.98, speedMultiplier: 1.06, moraleMultiplier: 1 },
        defender: { attackMultiplier: 1.01, defenseMultiplier: 1.01, speedMultiplier: 1.04, moraleMultiplier: 1 }
    }
};

function resolveFormation(formationId) {
    return TACTICAL_FORMATIONS[formationId] || TACTICAL_FORMATIONS.line;
}

function getUnitSpeedStat(unit) {
    return Math.max(1, Number(unit?.stats?.speed ?? unit?.stats?.movement ?? 1));
}

function pickEnemyFormation(unit, enemy, terrain, battleType) {
    const unitType = getUnitById(unit?.typeId);
    const healthRatio = Math.max(0, Math.min(1, (unit?.currentHealth || 0) / Math.max(1, unit?.stats?.health || 1)));
    if (healthRatio < 0.45) return 'shield_wall';
    if (battleType === 'siege' || terrain === 'city') return 'shield_wall';
    if (terrain === 'forest' || terrain === 'hills' || terrain === 'mountains') {
        if ((unit?.stats?.defense || 0) >= (unit?.stats?.attack || 0)) return 'shield_wall';
    }
    if ((unitType?.type === 'cavalry' || unitType?.category === 'shock') && (unit?.morale || 0) >= 65) return 'wedge';
    if (getUnitSpeedStat(unit) >= getUnitSpeedStat(enemy) + 1 && (unit?.morale || 0) >= 70) return 'wedge';
    return 'line';
}

function chooseFormation(side, unit, enemy, terrain, battleType, requestedFormation) {
    if (resolveFormation(requestedFormation).id === requestedFormation) {
        return requestedFormation;
    }
    if (unit?.owner === 'enemy') {
        return pickEnemyFormation(unit, enemy, terrain, battleType);
    }
    if (side === 'defender' && (battleType === 'siege' || terrain === 'city')) {
        return 'shield_wall';
    }
    if (side === 'attacker' && battleType === 'ambush' && (unit?.morale || 0) >= 70) {
        return 'wedge';
    }
    return 'line';
}

function calculateTacticalStats(unit, enemy, terrain, battleType, formationId, side = 'attacker') {
    const unitType = getUnitById(unit.typeId);
    const formation = resolveFormation(formationId);
    const terrainMod = TERRAIN_TACTICAL_MODIFIERS[terrain] || TERRAIN_TACTICAL_MODIFIERS.plains;
    const battleTypeMod = BATTLE_TYPE_TACTICAL_MODIFIERS[battleType]?.[side] || BATTLE_TYPE_TACTICAL_MODIFIERS.field[side];
    const mapTerrainEffects = gameMap?.getTerrainEffects?.(terrain, {
        unit,
        attacker: unit,
        defender: enemy
    }) || { attackMultiplier: 1, defenseMultiplier: 1 };
    const levelBonus = 1 + ((unit.level || 1) - 1) * 0.1;

    const baseAttack = Number(unit?.stats?.attack);
    const baseDefense = Number(unit?.stats?.defense);
    let attack = Number.isFinite(baseAttack) ? baseAttack : 1;
    let defense = Number.isFinite(baseDefense) ? baseDefense : 1;
    const speed = getUnitSpeedStat(unit) * formation.speedMultiplier * terrainMod.speedMultiplier * battleTypeMod.speedMultiplier;
    const effectiveMoraleRaw = (unit.morale || 0) * formation.moraleMultiplier * terrainMod.moraleMultiplier * battleTypeMod.moraleMultiplier;
    const effectiveMorale = Math.max(0, Math.min(100, effectiveMoraleRaw));
    const moraleFactor = Math.max(0.25, Math.min(1.2, effectiveMorale / 100));

    // Existing counter-type modifiers are preserved as tactical layer inputs.
    if (enemy && unitType?.bonuses) {
        const enemyType = getUnitById(enemy.typeId);
        if (enemyType?.type === 'infantry' && unitType.bonuses.vsInfantry) {
            attack *= unitType.bonuses.vsInfantry;
        } else if (enemyType?.type === 'cavalry' && unitType.bonuses.vsCavalry) {
            attack *= unitType.bonuses.vsCavalry;
        }
        if (terrain !== 'plains' && unitType.bonuses.terrain) {
            attack *= unitType.bonuses.terrain;
            defense *= unitType.bonuses.terrain;
        }
    }

    attack *= formation.attackMultiplier
        * battleTypeMod.attackMultiplier
        * (mapTerrainEffects.attackMultiplier || 1)
        * levelBonus
        * moraleFactor;
    defense *= formation.defenseMultiplier
        * battleTypeMod.defenseMultiplier
        * (mapTerrainEffects.defenseMultiplier || 1)
        * levelBonus
        * moraleFactor;

    return {
        attack: Math.max(1, attack),
        defense: Math.max(1, defense),
        speed: Math.max(0.5, speed),
        morale: effectiveMorale,
        formationId: formation.id,
        formationName: formation.name
    };
}

/**
 * Calculate combat damage between attacker and defender
 */
function calculateCombatDamage(attacker, defender, terrain = 'plains', battleType = 'field', options = {}) {
    const attackerFormation = chooseFormation(
        'attacker',
        attacker,
        defender,
        terrain,
        battleType,
        options.attackerFormation
    );
    const defenderFormation = chooseFormation(
        'defender',
        defender,
        attacker,
        terrain,
        battleType,
        options.defenderFormation
    );
    const attackerTactical = calculateTacticalStats(attacker, defender, terrain, battleType, attackerFormation, 'attacker');
    const defenderTactical = calculateTacticalStats(defender, attacker, terrain, battleType, defenderFormation, 'defender');

    const baseAttackerDamage = Math.max(
        1,
        Math.floor((attackerTactical.attack - defenderTactical.defense * 0.45) + attackerTactical.speed * 0.6)
    );
    const baseDefenderDamage = Math.max(
        1,
        Math.floor((defenderTactical.attack - attackerTactical.defense * 0.35) + defenderTactical.speed * 0.45)
    );
    const randomFactor = () => 0.85 + Math.random() * 0.3;
    const attackerDamage = Math.max(1, Math.floor(baseAttackerDamage * randomFactor()));
    const defenderDamage = Math.max(1, Math.floor(baseDefenderDamage * randomFactor()));

    const tacticalLog = [
        `${attacker.name} (${attackerTactical.formationName}) vs ${defender.name} (${defenderTactical.formationName}) em ${terrain}.`,
        `Atributos A/D/V/M ${Math.round(attackerTactical.attack)}/${Math.round(attackerTactical.defense)}/${attackerTactical.speed.toFixed(1)}/${Math.round(attackerTactical.morale)} vs ${Math.round(defenderTactical.attack)}/${Math.round(defenderTactical.defense)}/${defenderTactical.speed.toFixed(1)}/${Math.round(defenderTactical.morale)}.`
    ];

    return {
        attackerDamage,
        defenderDamage,
        attackerTactical,
        defenderTactical,
        tacticalLog
    };
}

function applyBattleTypeModifiers(attacker, defender, battleType, terrain, baseDamage) {
    let attackerDamage = baseDamage.attackerDamage;
    let defenderDamage = baseDamage.defenderDamage;

    const attackerEffects = attacker.owner === 'player' ? (gameState.player?.techEffects || {}) : {};
    const defenderEffects = defender.owner === 'player' ? (gameState.player?.techEffects || {}) : {};

    if (battleType === 'siege') {
        if (attacker.category === 'siege') {
            attackerDamage = Math.floor(attackerDamage * 1.2);
        }
    } else if (battleType === 'ambush') {
        const ambushSide = defender.bonuses?.ambush ? 'defender' : (attacker.bonuses?.ambush ? 'attacker' : 'defender');
        if (ambushSide === 'attacker') {
            attackerDamage = Math.floor(attackerDamage * 1.12);
        } else {
            defenderDamage = Math.floor(defenderDamage * 1.12);
        }
    } else if (battleType === 'naval') {
        const attackerNaval = attacker.type === 'naval' || attacker.bonuses?.waterTraversal;
        const defenderNaval = defender.type === 'naval' || defender.bonuses?.waterTraversal;
        if (attackerNaval && !defenderNaval) attackerDamage = Math.floor(attackerDamage * 1.15);
        if (defenderNaval && !attackerNaval) defenderDamage = Math.floor(defenderDamage * 1.15);
    }

    if (defender.fortified) {
        attackerDamage = Math.floor(attackerDamage * 0.8);
        defenderDamage = Math.floor(defenderDamage * 1.15);
    }

    const defenderTile = gameMap?.getTile(defender.position.x, defender.position.y);
    if (defenderTile?.fort && defenderTile.fort.owner === defender.owner) {
        const defenseBonus = defenderTile.fort.defenseBonus || 0;
        const garrisonBonus = defenderTile.fort.garrisonBonus || 0;
        attackerDamage = Math.floor(attackerDamage * (1 - Math.max(0, Math.min(0.45, defenseBonus))));
        defenderDamage = Math.floor(defenderDamage * (1 + Math.max(0, Math.min(0.35, garrisonBonus))));
    }

    if (attacker.bonuses?.greekFire) {
        // Devastating incendiary effect
        attackerDamage = Math.floor(attackerDamage * 1.6);
        if (defender.type === 'naval' || defenderTile?.cityData) {
            attackerDamage = Math.floor(attackerDamage * 1.4);
        }
    }

    if (attacker.type === 'cavalry') {
        attackerDamage = Math.floor(attackerDamage * (attackerEffects.cavalryAttackMultiplier || 1));
    }
    if (attacker.type === 'naval') {
        attackerDamage = Math.floor(attackerDamage * (attackerEffects.navalAttackMultiplier || 1));
    }
    if (attacker.category === 'siege') {
        attackerDamage = Math.floor(attackerDamage * (attackerEffects.siegeAttackMultiplier || 1));
    }
    if (defender.type === 'cavalry') {
        defenderDamage = Math.floor(defenderDamage * (defenderEffects.cavalryAttackMultiplier || 1));
    }
    if (defender.type === 'naval') {
        defenderDamage = Math.floor(defenderDamage * (defenderEffects.navalAttackMultiplier || 1));
    }

    return {
        attackerDamage: Math.max(1, attackerDamage),
        defenderDamage: Math.max(1, defenderDamage)
    };
}

function maybeRetreat(unit, enemy, side, options = {}, tactical = null) {
    const requestedSide = options.retreatSide || 'defender';
    if (requestedSide !== side) return { success: false };
    if (!options.attemptRetreat) return { success: false };
    if (unit.currentHealth > unit.stats.health * 0.6) return { success: false };

    const baseChance = 0.45;
    const unitSpeed = tactical?.speed ?? getUnitSpeedStat(unit);
    const enemySpeed = getUnitSpeedStat(enemy);
    const mobilityBonus = unitSpeed >= enemySpeed ? 0.15 : 0;
    const moraleBonus = unit.morale >= 65 ? 0.1 : -0.05;
    const chance = Math.max(0.15, Math.min(0.85, baseChance + mobilityBonus + moraleBonus));
    const roll = Math.random();
    if (roll > chance) return { success: false };

    return {
        success: true,
        side,
        chance,
        roll
    };
}

function executeBattle(attackerId, defenderId, terrain = 'plains', battleType = 'field', options = {}) {
    const attacker = gameState.units.find(u => u.id === attackerId);
    const defender = gameState.units.find(u => u.id === defenderId);

    if (!attacker || !defender) {
        return { success: false, message: 'Unidades inválidas' };
    }

    const distance = Math.abs(attacker.position.x - defender.position.x) +
        Math.abs(attacker.position.y - defender.position.y);
    const attackerType = getUnitById(attacker.typeId);
    const maxRange = attackerType?.stats?.range || 1;
    if (distance > maxRange) {
        return { success: false, message: 'Alvo fora do alcance' };
    }

    const attackerSnapshot = {
        id: attackerId,
        name: attacker.name || 'Atacante',
        owner: attacker.owner || 'enemy',
        maxHealth: Math.max(1, Number(attacker.stats?.health || 1))
    };
    const defenderSnapshot = {
        id: defenderId,
        name: defender.name || 'Defensor',
        owner: defender.owner || 'enemy',
        maxHealth: Math.max(1, Number(defender.stats?.health || 1))
    };

    const baseDamage = calculateCombatDamage(attacker, defender, terrain, battleType, options);
    const adjustedDamage = applyBattleTypeModifiers(attacker, defender, battleType, terrain, baseDamage);
    let attackerDamage = adjustedDamage.attackerDamage;
    let defenderDamage = adjustedDamage.defenderDamage;

    attacker.fortified = false;

    const combatLog = [...(baseDamage.tacticalLog || [])];

    const attackerRetreat = maybeRetreat(attacker, defender, 'attacker', options, baseDamage.attackerTactical);
    if (attackerRetreat.success) {
        attackerDamage = Math.floor(attackerDamage * 0.5);
        combatLog.push(`${attacker.name} tentou uma retirada tática.`);
    }
    const defenderRetreat = maybeRetreat(defender, attacker, 'defender', options, baseDamage.defenderTactical);
    if (defenderRetreat.success) {
        defenderDamage = Math.floor(defenderDamage * 0.5);
        combatLog.push(`${defender.name} tentou uma retirada tática.`);
    }

    defender.currentHealth -= attackerDamage;
    attacker.currentHealth -= defenderDamage;

    const defenderDied = defender.currentHealth <= 0;
    const attackerDied = attacker.currentHealth <= 0;
    const attackerHealthAfter = Math.max(0, Math.floor(attacker.currentHealth || 0));
    const defenderHealthAfter = Math.max(0, Math.floor(defender.currentHealth || 0));

    if (!attackerDied) {
        attacker.experience += defenderDied ? 24 : 10;
        if (checkLevelUp(attacker) && attacker.owner === 'player' && typeof achievementManager !== 'undefined') {
            achievementManager.recordUnitLevel(attacker);
        }
    }
    if (!defenderDied && !attackerDied) {
        defender.experience += 6;
        if (checkLevelUp(defender) && defender.owner === 'player' && typeof achievementManager !== 'undefined') {
            achievementManager.recordUnitLevel(defender);
        }
    }

    if (defenderDied) {
        attacker.morale = Math.min(100, attacker.morale + 12);
    } else {
        attacker.morale = Math.max(0, attacker.morale - 4);
    }

    if (attackerDied) {
        defender.morale = Math.min(100, defender.morale + 12);
    } else {
        defender.morale = Math.max(0, defender.morale - 4);
    }

    if (defenderDied) removeUnit(defenderId);
    if (attackerDied) removeUnit(attackerId);

    const retreat = defenderRetreat.success
        ? defenderRetreat
        : (attackerRetreat.success ? attackerRetreat : { success: false });

    let outcome = 'stalemate';
    if (attackerDied && defenderDied) outcome = 'mutual_losses';
    else if (defenderDied) outcome = 'attacker_victory';
    else if (attackerDied) outcome = 'defender_victory';
    combatLog.push(`Troca de danos: ${attacker.name}  causou ${attackerDamage}, ${defender.name} causou ${defenderDamage}.`);
    combatLog.push(`Resultado: ${outcome.replace(/_/g, ' ')}.`);

    if (typeof achievementManager !== 'undefined') {
        if (outcome === 'attacker_victory' && attacker.owner === 'player') {
            achievementManager.recordBattleWon(attacker);
        } else if (outcome === 'defender_victory' && defender.owner === 'player') {
            achievementManager.recordBattleWon(defender);
        }
    }

    return {
        success: true,
        battleType,
        terrain,
        attackerDamage,
        defenderDamage,
        defenderDied,
        attackerDied,
        retreat,
        outcome,
        summary: `${attacker.name} ${baseDamage.attackerTactical?.formationName || 'Linha'} vs ${defender.name} ${baseDamage.defenderTactical?.formationName || 'Linha'} (${terrain}) -> ${outcome.replace(/_/g, ' ')}`,
        combatLog,
        attacker: {
            ...attackerSnapshot,
            health: attackerHealthAfter,
            morale: attacker.morale,
            tactical: baseDamage.attackerTactical
        },
        defender: {
            ...defenderSnapshot,
            health: defenderHealthAfter,
            morale: defender.morale,
            tactical: baseDamage.defenderTactical
        }
    };
}

/**
 * Execute combat between two units
 */
function executeCombat(attackerId, defenderId, terrain = 'plains') {
    return executeBattle(attackerId, defenderId, terrain, 'field', { attemptRetreat: false });
}

/**
 * Check if unit should level up
 */
function checkLevelUp(unit) {
    if (!unit) return false;
    let leveled = false;
    let availableUnits = null;
    const currentEra = gameState?.getCurrentEraTag?.();
    if (currentEra) {
        availableUnits = new Set(getUnitsByEra(currentEra).map((u) => u.id));
    }

    while (unit.experience >= (unit.level * 100)) {
        const expNeeded = unit.level * 100;
        unit.level++;
        unit.experience -= expNeeded;

        // Promote first so growth is applied to the resulting unit type for this level.
        promoteUnitByExperience(unit, { availableUnits });

        const growth = getUnitGrowthProfile(unit.typeId);
        unit.stats.health += growth.health;
        unit.stats.attack += growth.attack;
        unit.stats.defense += growth.defense;
        unit.currentHealth = unit.stats.health;
        leveled = true;
    }

    return leveled;
}

/**
 * Remove unit from game
 */
function removeUnit(unitId) {
    const index = gameState.units.findIndex(u => u.id === unitId);
    if (index !== -1) {
        const unit = gameState.units[index];

        // Remove from player's owned units
        if (unit.owner === 'player') {
            const playerIndex = gameState.player.unitsOwned.indexOf(unitId);
            if (playerIndex !== -1) {
                gameState.player.unitsOwned.splice(playerIndex, 1);
            }
        }

        gameState.units.splice(index, 1);
    }
}

/**
 * Calculate combat preview (without executing)
 */
function previewCombat(attackerId, defenderId, terrain = 'plains') {
    const attacker = gameState.units.find(u => u.id === attackerId);
    const defender = gameState.units.find(u => u.id === defenderId);

    if (!attacker || !defender) return null;

    const { attackerDamage, defenderDamage } = calculateCombatDamage(attacker, defender, terrain);

    return {
        attackerDamage,
        defenderDamage,
        attackerSurvives: attacker.currentHealth > defenderDamage,
        defenderSurvives: defender.currentHealth > attackerDamage,
        attackerHealthAfter: Math.max(0, attacker.currentHealth - defenderDamage),
        defenderHealthAfter: Math.max(0, defender.currentHealth - attackerDamage)
    };
}

/**
 * Apply leader bonuses to combat
 */
function applyLeaderBonuses(unit, bonuses) {
    const unitType = getUnitById(unit.typeId);

    // Apply cavalry bonuses
    if (unitType.type === 'cavalry') {
        if (bonuses.cavalryAttack) {
            unit.stats.attack = Math.floor(unit.stats.attack * bonuses.cavalryAttack);
        }
        if (bonuses.cavalryMovement) {
            unit.stats.movement = Math.floor(unit.stats.movement * bonuses.cavalryMovement);
        }
    }

    // Apply infantry bonuses
    if (unitType.type === 'infantry') {
        if (bonuses.infantryDefense) {
            unit.stats.defense = Math.floor(unit.stats.defense * bonuses.infantryDefense);
        }
    }

    // Apply cataphract bonuses
    if (unit.typeId === 'cataphract' || unit.typeId === 'klibanophoroi') {
        if (bonuses.cataphractPower) {
            unit.stats.attack = Math.floor(unit.stats.attack * bonuses.cataphractPower);
            unit.stats.defense = Math.floor(unit.stats.defense * bonuses.cataphractPower);
        }
    }
}

/**
 * Check if position is valid for attack
 */
function canAttack(attackerId, defenderPosition) {
    const attacker = gameState.units.find(u => u.id === attackerId);
    if (!attacker) return false;

    const attackerType = getUnitById(attacker.typeId);
    const distance = Math.abs(attacker.position.x - defenderPosition.x) +
        Math.abs(attacker.position.y - defenderPosition.y);

    return distance <= attackerType.stats.range;
}
