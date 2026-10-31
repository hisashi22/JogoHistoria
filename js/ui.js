/**
 * UI Manager
 * Handles all UI interactions and screen transitions
 */

// Module-level mapping of `<faction>:<typeId>` to portrait filename.
// Hoisted out of getUnitPortraitPath() so it isn't re-allocated on every call
// (the method runs on UI hot paths: recruitment modal + unit panel refresh).
const UNIT_PORTRAITS = {
    'arab:camel_riders':        'arab_unit_camel_riders_circle.png',
    'bulgar:skutatoi':          'bulgar_unit_infantry_circle.png',
    'bulgar:mountain_infantry': 'bulgar_unit_infantry_circle.png',
    'byzantine:skutatoi':       'byzantine_unit_skutatoi_circle.png',
    'byzantine:cataphract':     'byzantine_unit_cataphract.png',
    'byzantine:varangian':      'byzantine_varangian_guard.png',
    'frank:skutatoi':           'ostrogoth_unit_infantry_circle.png',
    'tribal:skutatoi':          'ostrogoth_unit_infantry_circle.png',
    'sassanid:kavallarioi':     'sassanid_unit_cavalry_circle.png',
    'sassanid:horsearchers':    'sassanid_unit_cavalry_circle.png',
};

class UIManager {
    constructor() {
        this.currentScreen = 'loading';
        this.screens = {};
        this.modals = {};
        this.selectedCentury = '6';
        this.selectedFaction = 'byzantine';
        this.selectedScenario = SCENARIOS.empire;
        this.selectedLeaderCard = null;
        this.tutorialPanel = null;
        this.tutorialLastHintByStep = {};
        this.overviewCollapsed = false;
    }

    /**
     * Initialize UI
     */
    initialize() {
        // Cache screen elements
        this.screens = {
            loading: document.getElementById('loading-screen'),
            mainMenu: document.getElementById('main-menu'),
            leaderSelection: document.getElementById('leader-selection'),
            game: document.getElementById('game-screen')
        };

        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalContent = document.getElementById('modal-content');
        this.notificationContainer = document.getElementById('notification-container');
        this.turnProcessingOverlay = document.getElementById('turn-processing-overlay');
        this.commandOverview = document.getElementById('command-overview');
        this.overviewCards = {
            resources: document.querySelector('#overview-resources .overview-card-body'),
            faction: document.querySelector('#overview-faction .overview-card-body'),
            cities: document.querySelector('#overview-cities .overview-card-body'),
            events: document.querySelector('#overview-events .overview-card-body')
        };

        // Set up event listeners
        this.setupEventListeners();

        // Load historical scenario registry in background; refresh tabs if leader selection is already open
        ScenarioLoader.loadIndex()
            .then(() => {
                if (this.currentScreen === 'leaderSelection') {
                    this.populateScenarios(this.selectedCentury);
                }
            })
            .catch(err => console.warn('[UIManager] Falha ao carregar o índice de cenários:', err));

        // Show main menu after loading
        setTimeout(() => {
            this.showScreen('mainMenu');
        }, 2000);
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('btn-new-game')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showLeaderSelection();
        });

        document.getElementById('btn-continue')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.continueGame();
        });

        document.getElementById('btn-load-game')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showLoadGameModal();
        });

        document.getElementById('btn-settings')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showSettingsModal();
        });

        document.getElementById('btn-about')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showAboutModal();
        });

        document.getElementById('btn-mods')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showModsModal();
        });

        // Leader selection
        document.getElementById('btn-back-from-leaders')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showScreen('mainMenu');
        });

        // Century selection
        document.querySelectorAll('.century-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                audioManager.playUISound('click');
                this.switchCentury(e.target.dataset.century);
            });
        });

        // Faction selection
        document.querySelectorAll('.faction-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                audioManager.playUISound('click');
                this.switchFaction(e.target.dataset.faction);
            });
        });

        document.getElementById('btn-select-leader')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.startGame();
        });

        // Game screen buttons
        document.getElementById('btn-end-turn')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.endTurn();
        });

        document.getElementById('btn-save')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showSaveGameModal();
        });

        document.getElementById('btn-menu')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showGameMenu();
        });

        document.getElementById('btn-scenario-info')?.addEventListener('click', () => {
            const url = neobyzantineLink(gameState?.activeScenario?.neobyzantineUrl);
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });

        document.getElementById('btn-recruit')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.recruitAtSelectedCity();
        });

        document.getElementById('btn-build')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.buildInSelectedCity();
        });

        document.getElementById('btn-tech')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.researchTechnology();
        });

        document.getElementById('btn-diplomacy')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.manageDiplomacy();
        });

        document.getElementById('btn-quests')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showQuestLogModal();
        });

        document.getElementById('btn-achievements')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.showAchievementsModal();
        });

        document.getElementById('btn-attack-unit')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.attackWithSelectedUnit();
        });

        document.getElementById('btn-fortify-unit')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.fortifySelectedUnit();
        });

        window.addEventListener('resize', () => {
            this.positionUnitPanel();
        });

        document.getElementById('btn-overview-toggle')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.toggleCommandOverview();
        });

        document.getElementById('btn-overview-help')?.addEventListener('click', () => {
            audioManager.playUISound('click');
            this.toggleOverviewHelp();
        });

        document.querySelectorAll('[data-overview-action]').forEach((button) => {
            button.addEventListener('click', () => {
                audioManager.playUISound('click');
                const action = button.getAttribute('data-overview-action');
                switch (action) {
                    case 'build':
                        this.buildInSelectedCity();
                        break;
                    case 'recruit':
                        this.recruitAtSelectedCity();
                        break;
                    case 'diplomacy':
                        this.manageDiplomacy();
                        break;
                    case 'quests':
                        this.showQuestLogModal();
                        break;
                    default:
                        break;
                }
            });
        });

        // Close modal on overlay click
        this.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.closeModal();
            }
        });
    }

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen?.classList.remove('active');
        });

        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
            this.updateTutorialPanelVisibility();
        }
    }

    /**
     * Show leader selection screen
     */
    showLeaderSelection() {
        this.showScreen('leaderSelection');
        this.clearLeaderSelection();
        this.populateCenturies();
        this.switchCentury(this.selectedCentury);
    }

    clearLeaderSelection() {
        this.selectedLeaderCard = null;
        document.querySelectorAll('.leader-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById('leader-detail')?.classList.remove('active');
    }

    populateScenarios(century) {
        const container = document.getElementById('scenario-tabs');
        if (!container) return;

        const campaignScenarios = [
            {
                id: SCENARIOS.building,
                title: 'Construindo a Civilização',
                description: 'Comece com uma cidade principal; tribos locais ao redor de cidades históricas podem se juntar a você ou resistir.'
            },
            {
                id: SCENARIOS.empire,
                title: 'Gerenciando um Império',
                description: 'Comece com vilas estabelecidas historicamente, guarnições e uma economia mais forte.'
            }
        ];

        const battles = ScenarioLoader.getScenariosByCentury(century);

        // If a battle scenario was active but is no longer available for this century, reset it
        if (ScenarioLoader.getScenarioMeta(this.selectedScenario) && !battles.find(b => b.id === this.selectedScenario)) {
            this.selectedScenario = SCENARIOS.empire;
        }

        container.innerHTML = '';

        campaignScenarios.forEach((scenario) => {
            const btn = document.createElement('button');
            btn.className = `scenario-tab ${this.selectedScenario === scenario.id ? 'active' : ''}`;
            btn.dataset.scenario = scenario.id;
            btn.title = scenario.description;
            btn.textContent = scenario.title;
            btn.addEventListener('click', () => this.switchScenario(scenario.id));
            container.appendChild(btn);
        });

        if (battles.length > 0) {
            const divider = document.createElement('span');
            divider.className = 'scenario-divider';
            divider.textContent = 'Batalhas Históricas';
            container.appendChild(divider);

            battles.forEach((scenario) => {
                const btn = document.createElement('button');
                btn.className = `scenario-tab scenario-tab--battle ${this.selectedScenario === scenario.id ? 'active' : ''}`;
                btn.dataset.scenario = scenario.id;
                btn.title = scenario.description;
                btn.textContent = scenario.title;
                btn.addEventListener('click', () => this.switchScenario(scenario.id));
                container.appendChild(btn);
            });
        }
    }

    switchScenario(scenarioId) {
        this.selectedScenario = scenarioId;
        document.querySelectorAll('.scenario-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.scenario === scenarioId);
        });
    }


    /**
     * Populate century tabs
     */
    populateCenturies() {
        const container = document.querySelector('.century-tabs');
        if (!container) return;

        container.innerHTML = '';
        const centuries = getAvailableCenturies();

        centuries.forEach(c => {
            const btn = document.createElement('button');
            btn.className = `century-tab ${this.selectedCentury === c ? 'active' : ''}`;
            btn.dataset.century = c;

            // Add era symbol based on century
            const eraSymbol = c <= 7 ? '🏛' : (c <= 10 ? '⛪' : '🏰');
            btn.innerHTML = `${eraSymbol} século ${c}`;

            btn.addEventListener('click', (e) => this.switchCentury(c));
            container.appendChild(btn);
        });
    }

    /**
     * Switch century
     */
    switchCentury(century) {
        this.selectedCentury = century;
        this.clearLeaderSelection();

        // Update tabs
        document.querySelectorAll('.century-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.century === century);
        });

        this.populateFactions(century);
        const factions = getFactionsByCentury(century);
        if (factions.length > 0) {
            this.switchFaction(factions[0]);
        }
        this.populateScenarios(century);
    }

    /**
     * Populate faction tabs
     */
    populateFactions(century) {
        const container = document.querySelector('.faction-tabs');
        if (!container) return;

        container.innerHTML = '';
        const factions = getFactionsByCentury(century);

        factions.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `faction-tab ${this.selectedFaction === f ? 'active' : ''}`;
            btn.dataset.faction = f;

            const factionSymbol = getFactionSymbol(f);
            btn.innerHTML = `${factionSymbol} ${f.charAt(0).toUpperCase() + f.slice(1)}`;

            btn.addEventListener('click', (e) => this.switchFaction(f));
            container.appendChild(btn);
        });
    }

    /**
     * Switch faction
     */
    switchFaction(faction) {
        this.selectedFaction = faction;
        this.clearLeaderSelection();

        // Update tabs
        document.querySelectorAll('.faction-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.faction === faction);
        });

        this.populateLeaders(this.selectedCentury, faction);
    }

    /**
     * Populate leaders for selected century and faction
     */
    populateLeaders(century, faction) {
        const leadersGrid = document.getElementById('leaders-grid');
        if (!leadersGrid) return;

        leadersGrid.innerHTML = '';
        const leaders = getLeadersByCenturyAndFaction(century, faction);

        leaders.forEach(leader => {
            const card = this.createLeaderCard(leader);
            leadersGrid.appendChild(card);
        });
    }

    /**
     * Create leader card element
     */
    createLeaderCard(leader) {
        const card = document.createElement('div');
        card.className = 'leader-card';
        card.dataset.leaderId = leader.id;

        // Determine symbol based on faction
        const symbol = leader.faction ? getFactionSymbol(leader.faction) : (this.selectedFaction ? getFactionSymbol(this.selectedFaction) : BYZANTINE_SYMBOLS.crown);
        const portraitPath = this.getLeaderPortraitPath(leader);
        const portraitHtml = portraitPath
            ? `<img src="${portraitPath}" alt="${leader.name}" loading="lazy" onerror="this.remove(); this.parentElement.classList.add('leader-portrait-fallback'); this.parentElement.innerHTML='${symbol}';">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:linear-gradient(135deg, var(--parchment-dark), var(--parchment));">
                    ${symbol}
                </div>`;

        card.innerHTML = `
            <div class="leader-portrait">
                ${portraitHtml}
            </div>
            <h4>${leader.name}</h4>
            <p>${leader.title}</p>
            <small style="opacity:0.7;">${leader.years}</small>
        `;

        card.addEventListener('click', () => {
            audioManager.playUISound('select');
            this.selectLeader(leader);
        });

        return card;
    }

    /**
     * Select a leader
     */
    selectLeader(leader) {
        // Remove previous selection
        document.querySelectorAll('.leader-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Mark as selected
        const card = document.querySelector(`[data-leader-id="${leader.id}"]`);
        if (card) {
            card.classList.add('selected');
        }

        // Show leader details
        this.showLeaderDetails(leader);
    }

    /**
     * Show leader details panel
     */
    showLeaderDetails(leader) {
        const detailPanel = document.getElementById('leader-detail');
        if (!detailPanel) return;

        detailPanel.classList.add('active');

        // Update portrait
        const portrait = document.getElementById('leader-portrait-large');
        if (portrait) {
            portrait.classList.remove('leader-portrait-fallback');
            const symbol = leader.faction ? getFactionSymbol(leader.faction) : (this.selectedFaction ? getFactionSymbol(this.selectedFaction) : BYZANTINE_SYMBOLS.crown);
            const portraitPath = this.getLeaderPortraitPath(leader);
            if (portraitPath) {
                portrait.innerHTML = `<img src="${portraitPath}" alt="${leader.name}" onerror="this.remove(); this.parentElement.classList.add('leader-portrait-fallback'); this.parentElement.innerHTML='${symbol}';">`;
            } else {
                portrait.classList.add('leader-portrait-fallback');
                portrait.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:6rem;">${symbol}</div>`;
            }
        }

        // Update info
        document.getElementById('leader-name').textContent = leader.name;
        document.getElementById('leader-title').textContent = leader.title;
        document.getElementById('leader-years').textContent = leader.years;
        document.getElementById('leader-bio').textContent = leader.bio;

        // Update stats
        const statsDiv = document.getElementById('leader-stats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="leader-stat">
                    <span class="leader-stat-label">Militar</span>
                    <span class="leader-stat-value">${leader.stats.military}</span>
                </div>
                <div class="leader-stat">
                    <span class="leader-stat-label">Econômica</span>
                    <span class="leader-stat-value">${leader.stats.economy}</span>
                </div>
                <div class="leader-stat">
                    <span class="leader-stat-label">Diplomacia</span>
                    <span class="leader-stat-value">${leader.stats.diplomacy}</span>
                </div>
            `;
        }

        // Update abilities
        const abilitiesDiv = document.getElementById('leader-abilities');
        if (abilitiesDiv) {
            abilitiesDiv.innerHTML = '<h4>Habilidades Especiais</h4>';
            leader.abilities.forEach(ability => {
                const abilityEl = document.createElement('div');
                abilityEl.className = 'ability';
                abilityEl.innerHTML = `
                    <span class="ability-name">${ability.name}:</span>
                    <span>${ability.description}</span>
                `;
                abilitiesDiv.appendChild(abilityEl);
            });
        }

        this.selectedLeaderCard = leader;
    }

    getUnitPortraitPath(unit) {
        const faction = unit?.faction || unit?.owner || '';
        const typeId = unit?.typeId || '';
        const file = UNIT_PORTRAITS[`${faction}:${typeId}`];
        return file ? `assets/images/units/thumbs/${file}` : null;
    }

    getLeaderPortraitPath(leader) {
        const file = leader?.portrait;
        if (!file) return null;
        if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('//')) {
            return null;
        }
        if (file.startsWith('assets/') || file.startsWith('./assets/') || file.startsWith('/assets/')) {
            return file;
        }
        return `assets/images/leaders/${file}`;
    }

    /**
     * Switch era tab
     */
    switchEra(era) {
        this.currentEra = era;

        // Update tab styles
        document.querySelectorAll('.era-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.era === era) {
                tab.classList.add('active');
            }
        });

        // Populate leaders
        this.populateLeaders(era);

        // Hide detail panel
        document.getElementById('leader-detail')?.classList.remove('active');
    }

    /**
     * Start game with selected leader
     */
    async startGame() {
        if (!this.selectedLeaderCard) {
            this.showNotification('Por favor, selecione um líder', 'error');
            return;
        }

        // Resolve historical scenario if one is selected from the registry
        const meta = ScenarioLoader.getScenarioMeta(this.selectedScenario);
        let historicalScenario = null;
        if (meta) {
            try {
                const loader = new ScenarioLoader();
                historicalScenario = await loader.loadBuiltin(this.selectedScenario);
            } catch (err) {
                console.error('[startGame] Falha ao carregar o cenário de batalha:', err);
                this.showNotification('Falha ao carregar o cenário de batalha', 'error');
                return;
            }
        }

        const century = historicalScenario ? String(historicalScenario.century) : this.selectedCentury;
        const faction = historicalScenario
            ? (ScenarioLoader.FACTION_MAP[historicalScenario.forces?.[0]?.faction] ?? 'byzantine')
            : this.selectedFaction;

        this.showScreen('game');
        initializeGameMap();
        const success = gameState.initializeGame(
            this.selectedLeaderCard.id,
            century,
            faction,
            this.selectedScenario,
            historicalScenario
        );
        if (success) {
            if (historicalScenario) {
                const loader = new ScenarioLoader();
                loader.applyScenario(gameState, gameMap, historicalScenario);
            }
            this.initializeGameView();
            this.updateHUD();
            audioManager.playMusic('500ad_ambient');
            const notifMsg = historicalScenario
                ? historicalScenario.title
                : `Scenario: ${this.selectedScenario === SCENARIOS.empire ? 'Gerenciando um Império' : 'Construindo a Civilização'}`;
            this.showNotification(notifMsg, 'info');
            this.startTutorial({ replay: false });
        } else {
            this.showScreen('leaderSelection');
        }
    }

    /**
     * Continue last game
     */
    continueGame() {
        const slotInfo = storageManager.getSaveSlotInfo(0);
        if (!slotInfo) {
            this.showNotification('Nenhum jogo salvo encontrado', 'error');
            return;
        }

        this.showScreen('game');
        initializeGameMap();
        const result = storageManager.loadGame(0);
        if (result.success) {
            gameMap?.markTerritoryDirty();
            this.initializeGameView();
            this.updateHUD();
            audioManager.playMusic('500ad_ambient');
            this.showNotification('Jogo carregado', 'success');
            this.updateTutorialPanelVisibility();
        } else {
            this.showScreen('mainMenu');
            this.showNotification(result.message || 'Nenhum jogo salvo encontrado', 'error');
        }
    }

    /**
     * End turn
     */
    async endTurn() {
        this.showTurnProcessing(true);
        try {
            const result = await gameState.endTurn();
            if (!result) {
                this.showNotification('O turno não foi concluído', 'error');
                return;
            }
            if (result.paused) {
                this.showNotification('Por favor, aguarde, o turno já está sendo processado', 'info');
                return;
            }
            this.updateHUD();
            gameMap?.requestRender();

            // Auto-save
            if (storageManager.settings.autoSave) {
                storageManager.autoSave();
            }

            this.showNotification(
                `Turno ${result.turn} Renda: ${result.income.gold} ouro, ${result.income.manpower} mão de obra, ${result.income.food || 0} comida (cidades: ${result.cityProduction?.gold || 0}g/${result.cityProduction?.manpower || 0}m, manutenção ${result.upkeep || 0})`,
                'success'
            );
            const generatedNarratives = result.dynamicNarrative?.generated || [];
            if (generatedNarratives.length > 0) {
                const names = generatedNarratives.map((entry) => entry.title).join(', ');
                this.showNotification(`Nova missão/evento: ${names}`, 'info');
            }
            if (result.researchProgress?.completed) {
                this.showNotification(`Pesquisa concluída: ${result.researchProgress.completed.name}`, 'success');
            } else if (result.researchProgress?.active) {
                const active = result.researchProgress.active;
                this.showNotification(
                    `Pesquisa em andamento: ${active.name} (${active.turnsRemaining}/${active.totalTurns} turnos restantes)`,
                    'info'
                );
            }
            if (Array.isArray(result.completedTraining) && result.completedTraining.length > 0) {
                const blockedEntries = result.completedTraining.filter((entry) => entry?.blocked);
                const completedEntries = result.completedTraining.filter((entry) => !entry?.blocked);

                if (completedEntries.length > 0) {
                    const completedText = completedEntries
                        .map((entry) => `${entry.unit?.name || 'Unit'} at ${entry.cityName}`)
                        .join(', ');
                    this.showNotification(`Treinamento concluído: ${completedText}`, 'success');
                }

                if (blockedEntries.length > 0) {
                    const blockedText = blockedEntries
                        .map((entry) => `${entry.cityName} (${entry.reason || 'Local de spawn indisponível'})`)
                        .join(', ');
                    this.showNotification(`Treinamento bloqueado: ${blockedText}`, 'info');
                }
            }
            this.onTutorialAction('endTurn');
            audioManager.setContext('ambient');
        } finally {
            this.showTurnProcessing(false);
        }
    }

    showTurnProcessing(visible) {
        if (!this.turnProcessingOverlay) return;
        this.turnProcessingOverlay.classList.toggle('active', Boolean(visible));
        this.turnProcessingOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
        const endTurnBtn = document.getElementById('btn-end-turn');
        if (endTurnBtn) {
            endTurnBtn.disabled = Boolean(visible);
        }
    }

    recruitAtSelectedCity() {
        if (!gameMap?.selectedTile) {
            this.showNotification('Selecione um bloco de cidade para recrutar', 'error');
            return;
        }

        const tile = gameMap.getTile(gameMap.selectedTile.x, gameMap.selectedTile.y);
        if (!tile?.cityData || tile.owner !== 'player') {
            this.showNotification('O recrutamento exige uma cidade pertencente ao jogador', 'error');
            return;
        }

        const playerFaction = gameState.player?.faction || gameState.selectedFaction || 'byzantine';
        const choices = gameState.getRecruitmentOptions(tile)
            .map((entry) => ({
                id: entry.unitId,
                title: `${entry.unit?.name || entry.unitId}`,
                subtitle: entry.finalCost
                    ? `${entry.finalCost.gold}g / ${entry.finalCost.manpower}m • ${entry.trainingTurns === 0 ? 'Imediato' : `${entry.trainingTurns} turno(s)`} • manutenção: ${entry.upkeep || 0}`
                    : '',
                detail: entry.available
                    ? (entry.upgradePath?.length ? `Melhora para: ${entry.upgradePath.map((id) => getUnitById(id)?.name || id).join(', ')}` : 'Disponível')
                    : entry.reasons.join('\n'),
                disabled: !entry.available,
                imgSrc: this.getUnitPortraitPath({ faction: playerFaction, typeId: entry.unitId })
            }));

       this.showChoiceModal(
            `Recrutar em ${tile.cityData.name}`,
            choices,
            (unitId) => {
                const currentStatus = gameState.getRecruitmentOptionStatus(tile, unitId);
                if (!currentStatus.available) {
                    this.showNotification(currentStatus.reasons.join('; '), 'error');
                    return;
                }
                const spawnTile = currentStatus.spawnTile;
                if (!spawnTile) {
                    const unit = getUnitById(unitId);
                    const isNaval = unit?.type === 'naval' || unit?.category === 'transport';
                    this.showNotification(
                        isNaval ? 'Nenhum bloco de água próximo válido para recrutamento naval' : 'Nenhum bloco de terra próximo aberto para recrutamento',
                        'error'
                    );
                    return;
                }
                const queued = gameState.queueUnitRecruitment(unitId, tile);
                if (!queued.success) {
                    const queuedReasons = Array.isArray(queued.reasons) ? queued.reasons : [];
                    const fallbackReasons = currentStatus && Array.isArray(currentStatus.reasons) ? currentStatus.reasons : [];
                    const reasons = queuedReasons.length ? queuedReasons : fallbackReasons;
                    const reasonText = reasons.length ? reasons.join('; ') : 'requisitos ou recursos ausentes';
                    this.showNotification(`Não é possível recrutar essa unidade aqui: ${reasonText}`, 'error');
                    return;
                }
                this.updateHUD();
                gameMap.requestRender();
                const unit = getUnitById(unitId);
                const msg = queued.instantSpawn
                    ? `${unit?.name || unitId} recrutado imediatamente em ${tile.cityData.name}`
                    : (() => { const t = queued.project?.totalTurns || 1; return `Treinamento de ${unit?.name || unitId} iniciado em ${tile.cityData.name} (${t} turno${t === 1 ? '' : 's'})`; })();
                this.showNotification(msg, 'success');
            }
        );
    }

    findRecruitSpawnTile(cityTile, unitId) {
        return gameState.getRecruitSpawnTile(cityTile, unitId);
    }

    buildInSelectedCity() {
        if (!gameMap?.selectedTile) {
            this.showNotification('Selecione um bloco de cidade para construir', 'error');
            return;
        }

        const tile = gameMap.getTile(gameMap.selectedTile.x, gameMap.selectedTile.y);
        const isPlayerControlled = tile && (tile.owner === 'player' || gameMap.getTerritoryOwnerAt(tile.x, tile.y) === 'player');
        const hasColonizationUnit = Boolean(gameState.getColonizationUnitOnTile?.(tile));
        if (!isPlayerControlled && !hasColonizationUnit) {
            this.showNotification('Construir aqui exige um bloco pertencente ao jogador ou uma unidade terrestre estacionada para colonização', 'error');
            return;
        }
        const cityData = gameState.ensureCityBuildingState(tile);
        const autoBuildEnabled = Boolean(cityData?.autoBuildEnabled);
        const hasCity = Boolean(tile?.cityData);
        const cityName = tile.cityData?.name || `Bloco ${tile.x},${tile.y}`;
        const buildModeLabel = autoBuildEnabled ? 'AUTO' : 'CONTROLE MANUAL';

        const cityBuildingChoices = hasCity ? gameState.getCityBuildingOptions(tile).map((entry) => ({
            id: `city_building:${entry.id}`,
            title: `${entry.name} (N${entry.currentLevel}/${entry.maxLevel})`,
            subtitle: entry.nextLevel && entry.cost
                ? `Melhorar para N${entry.nextLevel} ${entry.cost.gold}g / ${entry.cost.manpower}m / ${entry.cost.prestige || 0}p • ${entry.turns} turnos`
                : 'Nível máximo atingido',
            detail: entry.available ? 'Disponível' : entry.reasons.join('\n'),
            disabled: !entry.available
        })) : [];
        const automationChoice = {
            id: 'city_auto_toggle',
            title: autoBuildEnabled ? '⚙ Automatizar: LIGADO — toque para controlar manualmente' : '⚙ Controle Manual — toque para retomar o automático',
            subtitle: `Modo: ${buildModeLabel}`,
            detail: autoBuildEnabled
                ? 'A cidade inicia automaticamente a melhor melhoria de edifício a cada turno. Escolha um projeto abaixo para substituir.'
                : 'Controle manual ativo — a cidade aguarda sua escolha. Toque para retomar o automático.'
        };
        const infrastructureChoices = gameState.getBuildActionOptions(tile).map((entry) => ({
            id: `infra:${entry.actionId}`,
            title: `${entry.action?.name || entry.actionId} [Infrastructure]`,
            subtitle: `${entry.action?.gold || 0}g / ${entry.action?.manpower || 0}m / ${entry.action?.prestige || 0}p`,
            detail: entry.available ? 'Available' : entry.reasons.join(' • '),
            disabled: !entry.available
        }));
        const choices = hasCity
            ? [automationChoice, ...cityBuildingChoices, ...infrastructureChoices]
            : infrastructureChoices;

        this.showChoiceModal(
            `Construir em ${cityName}
${buildModeLabel}`,
            choices,
            (choiceId) => {
                if (choiceId === 'city_auto_toggle') {
                    const current = gameState.ensureCityBuildingState(tile);
                    if (!current) {
                        this.showNotification('A construção automática só está disponível em blocos de cidade', 'error');
                        return;
                    }
                    current.autoBuildEnabled = !current.autoBuildEnabled;
                    this.showNotification(
                        current.autoBuildEnabled
                            ? `${cityName}: Construção automática retomada`
                            : `${cityName}: Controle manual — construção automática pausada`,
                        'info'
                    );
                    this.updateHUD();
                    gameMap.requestRender();
                    // Re-open so the updated mode is visible immediately.
                    setTimeout(() => this.buildInSelectedCity(), 0);
                    return;
                }
                const isCityBuilding = choiceId.startsWith('city_building:');
                const isInfrastructure = choiceId.startsWith('infra:');
                const id = isCityBuilding
                    ? choiceId.substring('city_building:'.length)
                    : (isInfrastructure ? choiceId.substring('infra:'.length) : choiceId);
                const result = isCityBuilding
                    ? gameState.startCityBuildingProject(tile, id)
                    : gameState.applyCityBuildAction(tile, id);
                if (!result.success) {
                    this.showNotification(result.message || 'Falha na construção', 'error');
                    return;
                }
                this.updateHUD();
                gameMap.requestRender();
                const message = isCityBuilding
                    ? `${cityName}: Melhoria de ${result.buildingName} para o Nível ${result.targetLevel} iniciada (${result.turns} turnos)`
                    : `${cityName}: ${result.actionName}`;
                this.showNotification(message, 'success');
                this.onTutorialAction('build');
            }
        );
    }

    researchTechnology() {
        if (!gameState?.initialized) {
            this.showNotification('Inicie uma campanha antes de abrir a pesquisa.', 'error');
            return;
        }
        const techState = gameState.getTechnologyTreeState();
        if (techState.length === 0) {
            this.showNotification('Nenhuma tecnologia definida', 'info');
            return;
        }

        const escapeHtml = this.escapeHtml.bind(this);
        const activeResearch = gameState.player?.activeResearch || null;
        const techById = new Map(techState.map((tech) => [tech.id, tech]));
        const tierById = {};
        const getTier = (techId, stack = new Set()) => {
            if (Number.isFinite(tierById[techId])) return tierById[techId];
            if (stack.has(techId)) return 1;
            stack.add(techId);
            const tech = techById.get(techId);
            const requires = Array.isArray(tech?.requires) ? tech.requires : [];
            if (requires.length === 0) {
                tierById[techId] = 1;
            } else {
                const depth = requires.reduce((max, reqId) => Math.max(max, getTier(reqId, stack)), 1);
                tierById[techId] = depth + 1;
            }
            stack.delete(techId);
            return tierById[techId];
        };
        techState.forEach((tech) => getTier(tech.id));

        const unlockSummary = (tech) => {
            const unlocks = tech.unlocks || {};
            const parts = [];
            const labelList = (ids, resolver) => (ids || []).map((id) => resolver(id)).filter(Boolean);
            const unitLabels = labelList(unlocks.units, (id) => getUnitById(id)?.name || id);
            const buildingLabels = labelList(unlocks.buildings, (id) => CITY_BUILDING_TREE[id]?.name || id);
            const actionLabels = labelList(unlocks.buildActions, (id) => BUILD_ACTIONS[id]?.name || id);
            if (unitLabels.length > 0) parts.push(`Unidades: ${unitLabels.join(', ')}`);
            if (buildingLabels.length > 0) parts.push(`Edifícios: ${buildingLabels.join(', ')}`);
            if (actionLabels.length > 0) parts.push(`Ações de cidade: ${actionLabels.join(', ')}`);
            return parts.length > 0 ? parts.join(' | ') : 'Desbloqueia bônus estratégicos';
        };

        const tiers = {};
        techState.forEach((tech) => {
            const tier = tierById[tech.id] || 1;
            if (!tiers[tier]) tiers[tier] = [];
            tiers[tier].push(tech);
        });

        const statusLabel = {
            researched: 'Pesquisada',
            researching: 'Pesquisando',
            available: 'Disponível',
            locked: 'Bloqueada'
        };
        const tierHtml = Object.keys(tiers)
            .map((tierStr) => Number.parseInt(tierStr, 10))
            .sort((a, b) => a - b)
            .map((tier) => {
                const cards = tiers[tier]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((tech) => {
                        const status = tech.status || 'locked';
                        const requirements = (tech.requires || []).map((reqId) => techById.get(reqId)?.name || reqId);
                        const requiresLabel = requirements.length > 0 ? requirements.join(', ') : 'Nenhum';
                        const unlocks = unlockSummary(tech);
                        const showStartButton = status === 'available' && !activeResearch;
                        const progressText = activeResearch && activeResearch.techId === tech.id
                            ? `Progresso: ${Math.max(0, activeResearch.totalTurns - activeResearch.turnsRemaining)}/${activeResearch.totalTurns} turnos`
                            : '';
                        return `
                            <article class="tech-node tech-node-${status}">
                                <div class="tech-node-header">
                                    <h3>${escapeHtml(tech.name)}</h3>
                                    <span class="tech-status-chip tech-status-${status}">${statusLabel[status] || 'Bloqueada'}</span>
                                </div>
                                <p class="tech-node-description">${escapeHtml(tech.description || '')}</p>
                                <p class="tech-node-meta"><strong>Custo:</strong> ${tech.cost?.gold || 0}g / ${tech.cost?.prestige || 0}p | <strong>Tempo:</strong> ${tech.researchTurns || 1} turnos</p>
                                <p class="tech-node-meta"><strong>Requer:</strong> ${escapeHtml(requiresLabel)}</p>
                                <p class="tech-node-meta"><strong>Desbloqueia:</strong> ${escapeHtml(unlocks)}</p>
                                ${progressText ? `<p class="tech-node-progress">${escapeHtml(progressText)}</p>` : ''}
                                ${showStartButton ? `<button class="menu-btn tech-start-btn" data-tech-start="${escapeHtml(tech.id)}">Iniciar Pesquisa</button>` : ''}
                                ${status === 'locked' && tech.missingRequirements?.length ? `<p class="tech-node-blocked">Ausente: ${escapeHtml(tech.missingRequirements.join(', '))}</p>` : ''}
                            </article>
                        `;
                    })
                    .join('');
                return `
                    <section class="tech-tier-section">
                        <h3>Nível ${tier}</h3>
                        <div class="tech-tier-grid">${cards}</div>
                    </section>
                `;
            })
            .join('');

        const activeBanner = activeResearch
            ? `<p class="tech-active-banner"><strong>Pesquisa Atual:</strong> ${escapeHtml(activeResearch.name || activeResearch.techId)} (${activeResearch.turnsRemaining}/${activeResearch.totalTurns} turnos restantes)</p>`
            : '<p class="tech-active-banner"><strong>Pesquisa Atual:</strong> Nenhuma</p>';
        const content = `
            <h2>Árvore de Pesquisa e Tecnologia</h2>
            ${activeBanner}
            <p class="tech-tree-legend">
                <span class="tech-status-chip tech-status-available">Disponível</span>
                <span class="tech-status-chip tech-status-researching">Pesquisando</span>
                <span class="tech-status-chip tech-status-researched">Pesquisada</span>
                <span class="tech-status-chip tech-status-locked">Bloqueada</span>
            </p>
            <div class="tech-tree-container">${tierHtml}</div>
            <div style="margin-top:1rem;">
                <button class="menu-btn" id="btn-close-tech-tree">Fechar</button>
            </div>
        `;

        this.showModal(content);
        this.modalContent?.querySelector('#btn-close-tech-tree')?.addEventListener('click', () => this.closeModal());
        this.modalContent?.querySelectorAll('[data-tech-start]').forEach((button) => {
            button.addEventListener('click', () => {
                const techId = button.getAttribute('data-tech-start');
                const result = gameState.researchTechnology(techId);
                if (!result.success) {
                    this.showNotification(result.message || 'Falha na pesquisa', 'error');
                    return;
                }
                this.updateHUD();
                gameMap?.requestRender();
                this.showNotification(`Pesquisa iniciada: ${result.name} (${result.turns} turnos)`, 'success');
                this.researchTechnology();
            });
        });
    }

    manageDiplomacy() {
        if (!gameState?.initialized) {
            this.showNotification('Inicie uma campanha antes de abrir a diplomacia.', 'error');
            return;
        }

        const escapeHtml = this.escapeHtml.bind(this);

        const renderDiplomacyModal = () => {
            const overview = (typeof gameState.getDiplomacyOverview === 'function') ? gameState.getDiplomacyOverview() : [];
            const reputation = gameState?.diplomacyState?.reputation || 0;
            const activeRoutes = (gameState?.diplomacyState?.tradeRoutes || []).filter((route) => route?.active).length;
            const rows = overview.map((entry) => {
                const actions = this.getDiplomacyActions(entry);
                const actionButtons = actions.map((action) => `
                    <button class="menu-btn choice-btn${action.disabled ? ' choice-btn-disabled' : ''}" data-dipl-action="${escapeHtml(action.id)}" data-dipl-faction="${escapeHtml(entry.factionId)}" ${action.disabled ? 'disabled aria-disabled="true"' : ''}>
                        <span class="btn-text">${escapeHtml(action.title)}</span>
                        <small class="choice-btn-subtitle">${escapeHtml(action.subtitle || '')}</small>
                    </button>
                `).join('');
                return `
                    <div class="dipl-row">
                        <h3>${escapeHtml(entry.displayName || this.formatFactionName(entry.factionId))}</h3>
                        <p>Status: <strong>${escapeHtml(entry.status)}</strong> | Hostilidade: ${escapeHtml(entry.hostility)} | Confiança: ${escapeHtml(entry.trust)}</p>
                        <p>Comércio: ${entry.tradeAgreement ? 'Acordo ativo' : 'Sem acordo'}${entry.route ? ` | Valor da rota: ${escapeHtml(entry.route.value)}g` : ''}</p>
                        <div class="dipl-actions">${actionButtons}</div>
                    </div>
                `;
            }).join('');

            const content = `
                <h2>Diplomacia e Comércio</h2>
                <p>Reputação: <strong>${reputation}</strong> | Rotas Comerciais Ativas: <strong>${activeRoutes}</strong></p>
                <div class="dipl-list" style="display:flex;flex-direction:column;gap:0.75rem;max-height:60vh;overflow:auto;">
                    ${overview.length > 0 ? rows : '<p>Nenhuma facção conhecida para negociar ainda.</p>'}
                </div>
                <div style="margin-top:1rem;">
                    <button class="menu-btn" id="btn-close-diplomacy">Fechar</button>
                </div>
            `;

            this.showModal(content);
            this.modalContent?.querySelector('#btn-close-diplomacy')?.addEventListener('click', () => this.closeModal());
            this.modalContent?.querySelectorAll('[data-dipl-action]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const actionId = btn.getAttribute('data-dipl-action');
                    const factionId = btn.getAttribute('data-dipl-faction');
                    const result = gameState.applyDiplomacyAction(actionId, factionId);
                    this.showNotification(result.message, result.success ? 'success' : 'error');
                    this.updateHUD();
                    if (result.success) {
                        this.onTutorialAction('diplomacy');
                    }
                    renderDiplomacyModal();
                });
            });
        };

        renderDiplomacyModal();
    }

    getDiplomacyActions(entry) {
        const status = entry?.status || 'war';
        const tradeAgreement = Boolean(entry?.tradeAgreement);
        return [
            {
                id: 'propose_truce',
                title: 'Propor Trégua',
                subtitle: 'Pausar hostilidades',
                disabled: status !== 'war'
            },
            {
                id: 'propose_alliance',
                title: 'Propor Aliança',
                subtitle: 'Não-agressão mútua',
                disabled: status === 'war' || status === 'alliance'
            },
            {
                id: 'trade_agreement',
                title: 'Acordo Comercial',
                subtitle: 'Estabelecer rotas de renda',
                disabled: status === 'war' || tradeAgreement
            },
            {
                id: 'declare_war',
                title: 'Declarar Guerra',
                subtitle: 'Romper laços e lutar',
                disabled: status === 'war'
            }
        ];
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    showQuestLogModal() {
        if (!gameState?.initialized) {
            this.showNotification('Inicie uma campanha antes de abrir as missões.', 'error');
            return;
        }
        const overview = typeof gameState.getDynamicNarrativeOverview === 'function'
            ? gameState.getDynamicNarrativeOverview()
            : { active: [], history: [] };
        const active = Array.isArray(overview.active) ? overview.active : [];
        const history = Array.isArray(overview.history) ? overview.history : [];

        const activeHtml = active.length > 0
            ? active.map((entry) => {
                const tags = (entry.triggerTags || []).map((tag) => `<span style="display:inline-block;padding:0.2rem 0.45rem;border:1px solid rgba(212,175,55,0.45);border-radius:999px;font-size:0.75rem;opacity:0.9;">${this.escapeHtml(tag)}</span>`).join(' ');
                const choices = (entry.choices || []).map((choice) => `
                    <button class="menu-btn quest-choice-btn" data-quest-id="${this.escapeHtml(entry.id)}" data-choice-id="${this.escapeHtml(choice.id)}">
                        <span class="btn-text">${this.escapeHtml(choice.title)}</span>
                        <small class="choice-btn-subtitle">${this.escapeHtml(choice.subtitle || '')}</small>
                    </button>
                `).join('');
                return `
                    <article class="dipl-row">
                        <h3>${this.escapeHtml(entry.title)}</h3>
                        <p>Tipo: <strong>${this.escapeHtml(entry.type)}</strong> | Iniciado no turno ${this.escapeHtml(entry.createdTurn)}</p>
                        ${tags ? `<div class="dipl-actions">${tags}</div>` : ''}
                        <p>${this.escapeHtml(entry.description || '')}</p>
                        <div class="dipl-actions" style="flex-direction:column;align-items:stretch;">${choices}</div>
                    </article>
                `;
            }).join('')
            : '<p>Nenhuma missão/evento ativo.</p>';

        const historyHtml = history.length > 0
            ? history.map((entry) => `
                <div class="dipl-row">
                    <h3>${this.escapeHtml(entry.title || 'Sem Título')}</h3>
                    <p>${this.escapeHtml(entry.choiceTitle || entry.selectedChoiceId || entry.status || 'Registrado')} turno 
${this.escapeHtml(entry.resolvedTurn ?? entry.createdTurn ?? gameState.turn)}</p>
                </div>
            `).join('')
            : '<p>Nenhuma entrada no histórico ainda.</p>';

        const content = `
            <h2>Missões e Eventos</h2>
            <div class="dipl-list" style="display:flex;flex-direction:column;gap:0.75rem;max-height:68vh;overflow:auto;">
                <section>
                    <h3>Ativas</h3>
                    <div style="display:flex;flex-direction:column;gap:0.65rem;">${activeHtml}</div>
                </section>
                <section>
                    <h3>Histórico</h3>
                    <div style="display:flex;flex-direction:column;gap:0.45rem;">${historyHtml}</div>
                </section>
            </div>
            <div style="margin-top:1rem;">
                <button class="menu-btn" id="btn-close-quest-log">Fechar</button>
            </div>
        `;
        this.showModal(content);

        this.modalContent?.querySelector('#btn-close-quest-log')?.addEventListener('click', () => this.closeModal());
        this.modalContent?.querySelectorAll('.quest-choice-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const questId = button.getAttribute('data-quest-id');
                const choiceId = button.getAttribute('data-choice-id');
                const result = gameState.resolveDynamicNarrativeChoice(questId, choiceId);
                if (!result?.success) {
                    this.showNotification(result?.message || 'Não foi possível aplicar a escolha.', 'error');
                    return;
                }
                this.updateHUD();
                gameMap?.requestRender();
                this.showNotification(result.message || 'Escolha aplicada', 'success');
                this.showQuestLogModal();
            });
        });
    }

    showAchievementsModal() {
        if (typeof achievementManager === 'undefined') return;

        achievementManager.syncFromGameState();

        const byCategory = achievementManager.getByCategory();
        const unlocked = achievementManager.getUnlockedCount();
        const total = achievementManager.getTotalCount();

        const categoryLabels = {
            combat: '⚔️ Combate',
            expansion: '🏰 Expansão',
            technology: '📚 Tecnologia',
            economy: '💰 Economia',
            diplomacy: '🕊️ Diplomacia',
            progression: '📅 Progressão',
            victory: '👑 Vitória'
        };

        const categorySections = Object.entries(byCategory).map(([cat, items]) => {
            const cards = items.map(a => `
                <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}" title="${this.escapeHtml(a.description)}">
                    <div class="achievement-icon">${a.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-title">${this.escapeHtml(a.title)}</div>
                        <div class="achievement-desc">${this.escapeHtml(a.description)}</div>
                        ${a.unlocked ? '<div class="achievement-badge">✓ Desbloqueada</div>' : ''}
                    </div>
                </div>
            `).join('');
            return `
                <div class="achievements-category">
                    <div class="achievements-category-title">${categoryLabels[cat] || cat}</div>
                    <div class="achievements-grid">${cards}</div>
                </div>
            `;
        }).join('');

        const content = `
            <div class="achievements-panel">
                <div class="achievements-header">
                    <h2 style="font-family:var(--font-display);color:var(--imperial-gold);">🏆 Conquistas</h2>
                    <span class="achievements-progress">${unlocked} / ${total} desbloqueadas</span>
                </div>
                ${categorySections}
                <div style="margin-top:1rem;">
                    <button class="menu-btn" id="btn-close-achievements">Fechar</button>
                </div>
            </div>
        `;

        this.showModal(content);
        this.modalContent?.querySelector('#btn-close-achievements')?.addEventListener('click', () => this.closeModal());
    }

    showChoiceModal(title, options, onSelect) {
        const items = options.map((option) => `
            <button class="menu-btn choice-btn${option.disabled ? ' choice-btn-disabled' : ''}" data-choice="${option.id}" ${option.disabled ? 'disabled aria-disabled="true"' : ''}>
                ${option.imgSrc ? `<img src="${option.imgSrc}" alt="" class="choice-btn-img" style="width:32px;height:32px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:0.4rem;">` : ''}
                <span class="btn-text">${option.title}</span>
                <small class="choice-btn-subtitle">${option.subtitle || ''}</small>
                ${option.detail ? `<small class="choice-btn-detail${option.disabled ? ' choice-btn-detail-disabled' : ''}">${option.detail}</small>` : ''}
            </button>
        `).join('');

        const content = `
            <h2>${title}</h2>
            <div style="display:flex;flex-direction:column;gap:0.75rem;max-height:65vh;overflow:auto;">
                ${items}
            </div>
            <div style="margin-top:1rem;">
                <button class="menu-btn" id="btn-close-choice">Fechar</button>
            </div>
        `;

        this.showModal(content);
        // CSP-safe equivalent of inline onerror="this.remove();" on each
        // option image — drop the <img> if the asset fails to load.
        this.modalContent?.querySelectorAll('img.choice-btn-img').forEach((img) => {
            img.addEventListener('error', () => img.remove(), { once: true });
        });
        this.modalContent?.querySelectorAll('.choice-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                const id = btn.getAttribute('data-choice');
                this.closeModal();
                onSelect(id);
            });
        });
        this.modalContent?.querySelector('#btn-close-choice')?.addEventListener('click', () => this.closeModal());
    }

    attackWithSelectedUnit() {
        const selected = gameState.selectedUnit;
        if (!selected || selected.owner !== 'player') {
            this.showNotification('Selecione uma de suas unidades primeiro', 'error');
            return;
        }
        if (selected.currentMovement <= 0) {
            this.showNotification(`${selected.name} não tem movimento restante neste turno`, 'error');
            return;
        }
        if (!gameMap?.selectedTile) {
            this.showNotification('Selecione um bloco de destino', 'error');
            return;
        }
        const target = gameState.units.find(u =>
            u.owner !== 'player' &&
            u.position.x === gameMap.selectedTile.x &&
            u.position.y === gameMap.selectedTile.y
        );
        if (!target) {
            this.showNotification('Nenhuma unidade inimiga no bloco selecionado', 'error');
            return;
        }
        const engagement = gameState.canUnitsEngage(selected, target);
        if (!engagement.allowed) {
            this.showNotification(engagement.reason || 'Ataque não permitido.', 'error');
            return;
        }

        audioManager.setContext('combat');
        const terrain = gameMap.getTile(target.position.x, target.position.y)?.terrain || 'plains';
        const result = executeBattle(selected.id, target.id, terrain, terrain === 'city' ? 'siege' : 'field', {
            attemptRetreat: true,
            retreatSide: 'defender'
        });
        if (!result.success) {
            this.showNotification(result.message || 'Falha no ataque', 'error');
            return;
        }

        selected.currentMovement = 0;
        this.showCombatResult(result);
        this.updateHUD();
        gameMap.requestRender();
        this.onTutorialAction('combat');
    }

    fortifySelectedUnit() {
        const selected = gameState.selectedUnit;
        if (!selected || selected.owner !== 'player') {
            this.showNotification('Selecione uma de suas unidades primeiro', 'error');
            return;
        }
        const result = gameState.fortifyUnit(selected.id);
        if (!result?.success) {
            this.showNotification(result?.message || 'Não é possível fortificar aqui', 'error');
            return;
        }
        this.showNotification(result.message, 'success');
        this.showUnitPanel(selected);
        this.updateHUD();
        gameMap.requestRender();
    }

    /**
     * Update HUD
     */
    updateHUD() {
        const resources = gameState.player.resources || {};
        document.getElementById('resource-gold').textContent = resources.gold || 0;
        document.getElementById('resource-manpower').textContent = resources.manpower || 0;
        document.getElementById('resource-prestige').textContent = resources.prestige || 0;
        const setOptionalResource = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value || 0;
        };
        setOptionalResource('resource-food', resources.food);
        setOptionalResource('resource-wood', resources.wood);
        setOptionalResource('resource-stone', resources.stone);
        setOptionalResource('resource-iron', resources.iron);
        setOptionalResource('resource-rare', resources.rare);
        document.getElementById('turn-number').textContent = gameState.turn;
        this.updateCommandOverview();

        // Show/hide the neobyzantine.org history button for active battle scenarios
        const scenarioBtn = document.getElementById('btn-scenario-info');
        if (scenarioBtn) {
            const hasLink = Boolean(neobyzantineLink(gameState?.activeScenario?.neobyzantineUrl));
            scenarioBtn.style.display = hasLink ? '' : 'none';
            if (hasLink) {
                const label = `Saiba mais sobre ${gameState.activeScenario.title ?? 'esta batalha'} no NeoByzantine.org`;
                scenarioBtn.title = label;
                scenarioBtn.setAttribute('aria-label', label);
            }
        }
    }

   toggleCommandOverview() {
        this.overviewCollapsed = !this.overviewCollapsed;
        this.commandOverview?.classList.toggle('collapsed', this.overviewCollapsed);
        if (this.overviewCollapsed && this.commandOverview?.classList.contains('help-visible')) {
            // Keep visual and ARIA help states synchronized when the overview is collapsed.
            this.commandOverview.classList.remove('help-visible');
            const helpBtn = document.getElementById('btn-overview-help');
            if (helpBtn) {
                helpBtn.setAttribute('aria-pressed', 'false');
                helpBtn.setAttribute('aria-expanded', 'false');
                helpBtn.setAttribute('aria-label', 'Mostrar ajuda contextual');
                helpBtn.title = 'Mostrar ajuda contextual';
                helpBtn.setAttribute('aria-controls', 'overview-help-text');
            }
        }
        const toggleBtn = document.getElementById('btn-overview-toggle');
        if (toggleBtn) {
            const isExpanded = !this.overviewCollapsed;
            const label = this.overviewCollapsed ? 'Expandir painel de visão geral' : 'Recolher painel de visão geral';
            toggleBtn.textContent = this.overviewCollapsed ? '+' : '−';
            toggleBtn.title = label;
            toggleBtn.setAttribute('aria-label', label);
            toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            if (this.commandOverview?.id) toggleBtn.setAttribute('aria-controls', this.commandOverview.id);
        }
        if (!this.overviewCollapsed) {
            // Refresh immediately on expand so card data is never stale.
            this.updateCommandOverview();
        }
    }

    toggleOverviewHelp() {
        if (!this.commandOverview) return;
        if (this.overviewCollapsed) {
            const helpBtn = document.getElementById('btn-overview-help');
            if (helpBtn) {
                // Keep ARIA state truthful while content is intentionally hidden in collapsed mode.
                helpBtn.setAttribute('aria-pressed', 'false');
                helpBtn.setAttribute('aria-expanded', 'false');
                helpBtn.setAttribute('aria-label', 'Mostrar ajuda contextual');
                helpBtn.title = 'Mostrar ajuda contextual';
                helpBtn.setAttribute('aria-controls', 'overview-help-text');
            }
            this.commandOverview.classList.remove('help-visible');
            return;
        }
        const helpVisible = this.commandOverview.classList.toggle('help-visible');
        const helpBtn = document.getElementById('btn-overview-help');
        if (helpBtn) {
            const label = helpVisible ? 'Ocultar ajuda contextual' : 'Mostrar ajuda contextual';
            helpBtn.setAttribute('aria-pressed', String(helpVisible));
            helpBtn.setAttribute('aria-expanded', String(helpVisible));
            helpBtn.setAttribute('aria-label', label);
            helpBtn.title = label;
            helpBtn.setAttribute('aria-controls', 'overview-help-text');
        }
    }

    renderOverviewLines(lines) {
        return lines.map((line) => `
            <div class="overview-line">
                <span class="overview-label">${this.escapeHtml(line.label)}</span>
                <span class="overview-value">${this.escapeHtml(line.value)}</span>
            </div>
        `).join('');
    }

    updateCommandOverview() {
        if (!this.commandOverview || !gameState?.initialized) return;
        // When collapsed, skip card recomputation and DOM writes until the panel is visible again.
        if (this.overviewCollapsed) return;
        this.updateResourcesOverviewCard();
        this.updateFactionOverviewCard();
        this.updateCityOverviewCard();
        this.updateEventsOverviewCard();
    }

    updateResourcesOverviewCard() {
        const el = this.overviewCards?.resources;
        if (!el) return;
        const resources = gameState?.player?.resources || {};
        const armySize = Array.isArray(gameState?.units)
            ? gameState.units.filter((unit) => unit?.owner === 'player').length
            : 0;
        const lines = [
            { label: 'Ouro', value: String(resources.gold || 0) },
            { label: 'Mão de obra', value: String(resources.manpower || 0) },
            { label: 'Estoque estratégico', value: String((resources.food || 0) + (resources.wood || 0) + (resources.stone || 0) + (resources.iron || 0) + (resources.rare || 0)) },
            { label: 'Unidades em campo', value: String(armySize) }
        ];
        el.innerHTML = this.renderOverviewLines(lines);
    }

    updateFactionOverviewCard() {
        const el = this.overviewCards?.faction;
        if (!el) return;
        const overview = typeof gameState?.getDiplomacyOverview === 'function' ? gameState.getDiplomacyOverview() : [];
        const activeRoutes = (gameState?.diplomacyState?.tradeRoutes || []).filter((route) => route?.active).length;
        const hostile = overview.filter((row) => row?.status === 'war').length;
        let strongest = null;
        let maxHostility = -Infinity;
        for (const row of overview) {
            if (!row) continue;
            const hostility = row.hostility || 0;
            if (hostility > maxHostility) {
                maxHostility = hostility;
                strongest = row;
            }
        }
        const lines = [
            { label: 'Facções conhecidas', value: String(overview.length) },
            { label: 'Em guerra', value: String(hostile) },
            { label: 'Rotas comerciais', value: String(activeRoutes) },
            {
                label: 'Principal ameaça',
                value: strongest
                    ? (strongest.displayName || this.formatFactionName(strongest.factionId) || 'Desconhecida')
                    : 'Nenhuma'
            }
        ];
        el.innerHTML = this.renderOverviewLines(lines);
    }

    updateCityOverviewCard() {
        const el = this.overviewCards?.cities;
        if (!el) return;
        const cityTiles = gameMap?.getCityTiles?.('player') || [];
        const metrics = {
            ownedCities: cityTiles.length,
            constructions: cityTiles.filter((tile) => Boolean(tile?.cityData?.construction)).length,
            queues: cityTiles.reduce((sum, tile) => sum + ((tile?.cityData?.trainingQueue || []).length || 0), 0),
            autoBuild: cityTiles.filter((tile) => Boolean(tile?.cityData?.autoBuildEnabled)).length
        };
        const lines = [
            { label: 'Cidades possuídas', value: String(metrics.ownedCities) },
            { label: 'Em construção', value: String(metrics.constructions) },
            { label: 'Fila de treinamento', value: String(metrics.queues) },
            { label: 'Build Automático Ativado', value: String(metrics.autoBuild) }
        ];
        el.innerHTML = this.renderOverviewLines(lines);
    }

    updateEventsOverviewCard() {
        const el = this.overviewCards?.events;
        if (!el) return;
        const overview = typeof gameState?.getDynamicNarrativeOverview === 'function'
            ? gameState.getDynamicNarrativeOverview()
            : { active: [], history: [] };
        const active = Array.isArray(overview?.active) ? overview.active : [];
        const history = Array.isArray(overview?.history) ? overview.history : [];
        const recent = history.length > 0 ? history[history.length - 1] : null;
        const lines = [
            { label: 'Missões/Eventos ativos', value: String(active.length) },
            { label: 'Entradas do histórico', value: String(history.length) },
            { label: 'Entrada recente', value: recent?.title ? String(recent.title).slice(0, 24) : 'Nenhuma' },
            { label: 'Turno atual', value: String(gameState?.turn || 0) }
        ];
        el.innerHTML = this.renderOverviewLines(lines);
    }

    /**
     * Show unit panel
     */
    showUnitPanel(unit, options = {}) {
        const panel = document.getElementById('unit-panel');
        if (!panel) return;
        const enemyView = Boolean(options.enemyView);
        const estimatedView = Boolean(options.estimatedView);

        panel.classList.add('active');
        panel.classList.toggle('enemy-panel', enemyView);
        this.positionUnitPanel();

        document.getElementById('selected-unit-name').textContent = unit.name;
        const metaEl = document.getElementById('unit-panel-meta');
        if (metaEl) {
            if (enemyView) {
                const factionName = this.formatFactionName(unit.faction || unit.owner || 'enemy');
                metaEl.textContent = `Força inimiga: ${factionName}${estimatedView ? ' • Força estimada' : ''}`;
            } else {
                const factionText = unit.faction ? `Fação: ${this.formatFactionName(unit.faction)}` : 'Sua unidade';
                const moveModeText = this.getSelectedUnitMoveModeLabel(unit);
                metaEl.textContent = moveModeText ? `${factionText} • ${moveModeText}` : factionText;
            }
        }
        const portrait = document.getElementById('selected-unit-portrait');
        if (portrait) {
            const unitType = getUnitById(unit.typeId);
            const symbol = unit.symbol || unitType?.symbol || '⚔️';
            const portraitPath = this.getUnitPortraitPath(unit);

            portrait.textContent = '';
            const container = document.createElement('div');
            container.className = `unit-portrait-content ${unit.owner === 'player' ? 'player-unit' : 'enemy-unit'}`;
            container.dataset.category = unit.category;

            const iconSpan = document.createElement('span');
            iconSpan.className = 'unit-portrait-icon';
            if (portraitPath) {
                const img = document.createElement('img');
                img.src = portraitPath;
                img.alt = unit.name;
                img.style.cssText = 'width:48px;height:48px;border-radius:50%;object-fit:cover;';
                img.onerror = () => { img.remove(); iconSpan.textContent = symbol; };
                iconSpan.appendChild(img);
            } else {
                iconSpan.textContent = symbol;
                if (symbol.length > 2) iconSpan.style.fontSize = '1.8rem';
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'unit-portrait-name';
            nameSpan.textContent = unit.name;

            container.appendChild(iconSpan);
            container.appendChild(nameSpan);
            portrait.appendChild(container);
        }
        const statLabels = document.querySelectorAll('#unit-panel .stat-label');
        if (statLabels.length >= 4) {
            statLabels[0].textContent = estimatedView ? 'Vida (est.)' : 'Vida';
            statLabels[1].textContent = estimatedView ? 'Ataque (est.)' : 'Ataque';
            statLabels[2].textContent = estimatedView ? 'Defesa (est.)' : 'Defesa';
            statLabels[3].textContent = estimatedView ? 'Movimento (est.)' : 'Movimento';
        }

        if (estimatedView) {
            document.getElementById('unit-health-value').textContent = this.formatEstimatedHealth(unit);
            document.getElementById('unit-attack').textContent = this.formatEstimatedRange(unit.stats.attack, 0.18);
            document.getElementById('unit-defense').textContent = this.formatEstimatedRange(unit.stats.defense, 0.18);
            document.getElementById('unit-movement').textContent = this.formatEstimatedRange(unit.currentMovement, 0.25, { decimals: 1 });
        } else {
            document.getElementById('unit-health-value').textContent = `${unit.currentHealth}/${unit.stats.health}`;
            document.getElementById('unit-attack').textContent = unit.stats.attack;
            document.getElementById('unit-defense').textContent = unit.stats.defense;
            document.getElementById('unit-movement').textContent = `${unit.currentMovement.toFixed(1)}/${unit.stats.movement}`;
        }

        const healthBar = document.getElementById('unit-health-bar');
        if (healthBar) {
            const healthPercent = (unit.currentHealth / unit.stats.health) * 100;
            healthBar.style.width = `${healthPercent}%`;
        }

        if (enemyView) {
            const container = document.querySelector('.unit-actions');
            if (container) {
                container.innerHTML = '<div class="unit-intel-note">A inteligência é aproximada. Os valores exatos de combate, moral e bônus são desconhecidos.</div>';
            }
            return;
        }

        // Add special action buttons
        this.updateUnitActionButtons(unit);
    }

    showEnemyUnitPanel(unit) {
        this.showUnitPanel(unit, { enemyView: true, estimatedView: true });
    }

    getSelectedUnitMoveModeLabel(unit) {
        if (!unit || unit.owner !== 'player') return null;
        const isSelected = gameState?.selectedUnit?.id === unit.id;
        if (!isSelected) return null;
        return Boolean(gameMap?.awaitingMoveOrder) ? 'Mode de Movimento: LIGADO' : 'Mode de Movimento: DESLIGADO';
    }

    formatFactionName(factionId) {
        if (!factionId) return 'Unknown';
        const labels = {
            byzantine: 'Byzantinos',
            arab: 'Árabes',
            bulgar: 'Búlgaros',
            frank: 'Franceses',
            sassanid: 'Sasânidas',
            tribal: 'Tribal Confederation',
            enemy: 'Enemy Army',
            neutral: 'Neutral'
        };
        if (labels[factionId]) return labels[factionId];
        return String(factionId)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (m) => m.toUpperCase());
    }

    formatEstimatedRange(value, uncertainty = 0.15, options = {}) {
        const decimals = Number.isFinite(options.decimals) ? options.decimals : 0;
        const n = Number.isFinite(value) ? Number(value) : 0;
        const spread = Math.max(decimals > 0 ? 0.2 : 1, Math.abs(n) * uncertainty);
        const factor = 10 ** decimals;
        const low = Math.max(0, Math.floor((n - spread) * factor) / factor);
        const high = Math.max(low, Math.ceil((n + spread) * factor) / factor);
        const fmt = (x) => decimals > 0 ? x.toFixed(decimals) : String(Math.round(x));
        return low === high ? `~${fmt(low)}` : `~${fmt(low)}-${fmt(high)}`;
    }

    formatEstimatedHealth(unit) {
        const hpRatio = Math.max(0, Math.min(1, (unit.currentHealth || 0) / Math.max(1, unit.stats?.health || 1)));
        let condition = 'Unknown';
        if (hpRatio >= 0.8) condition = 'Strong';
        else if (hpRatio >= 0.55) condition = 'Steady';
        else if (hpRatio >= 0.3) condition = 'Worn';
        else condition = 'Critical';

        const spread = Math.max(8, Math.floor((unit.stats.health || 1) * 0.12));
        const low = Math.max(0, Math.min(unit.stats.health, unit.currentHealth - spread));
        const high = Math.max(low, Math.min(unit.stats.health, unit.currentHealth + spread));
        return `${condition} (~${low}-${high}/${unit.stats.health})`;
    }

    positionUnitPanel() {
        const panel = document.getElementById('unit-panel');
        if (!panel) return;

        // Mobile layout pins the panel to the bottom via CSS.
        if (window.matchMedia('(max-width: 768px)').matches) {
            panel.style.top = '';
            panel.style.maxHeight = '';
            return;
        }

        const hud = document.querySelector('.game-hud');
        const gameScreen = document.getElementById('game-screen');
        if (!hud || !gameScreen) return;

        const hudRect = hud.getBoundingClientRect();
        const screenRect = gameScreen.getBoundingClientRect();
        const topOffset = Math.ceil(hudRect.bottom - screenRect.top + 8);
        const bottomMargin = 88;
        const maxHeight = Math.max(220, Math.floor(window.innerHeight - topOffset - bottomMargin));

        panel.style.top = `${topOffset}px`;
        panel.style.maxHeight = `${maxHeight}px`;
    }

    /**
     * Update unit action buttons based on capabilities
     */
    updateUnitActionButtons(unit) {
        const container = document.querySelector('.unit-actions');
        if (!container) return;
        const withClickSound = (handler) => () => {
            if (typeof audioManager !== 'undefined' && audioManager?.playUISound) {
                audioManager.playUISound('click');
            }
            handler();
        };

        // Clear existing custom buttons (everything except move/attack/fortify if they are static)
        // For simplicity, let's just rebuild the whole set
        container.innerHTML = '';

        const moveBtn = document.createElement('button');
        moveBtn.className = 'action-btn';
        moveBtn.id = 'btn-move-unit';
        const moveArmed = Boolean(gameMap?.awaitingMoveOrder);
        moveBtn.textContent = moveArmed ? 'Modo de Movimento: ON' : 'Modo de Movimento: OFF';
        if (moveArmed) moveBtn.classList.add('active');
        moveBtn.onclick = withClickSound(() => {
            if (gameMap) gameMap.awaitingMoveOrder = !gameMap.awaitingMoveOrder;
            this.hideUnitPanelForMapTargeting();
            const armed = Boolean(gameMap?.awaitingMoveOrder);
            moveBtn.textContent = armed ? 'Modo de Movimento: ON' : 'Modo de Movimento: OFF';
            moveBtn.classList.toggle('active', armed);
            this.showNotification(
                armed
                    ? 'Modo de movimento ON: mova o mapa se necessário, depois clique no bloco de destino.'
                    : 'Modo de movimento OFF.',
                'info'
            );
            if (!armed) {
                this.showUnitPanel(unit);
            }
            gameMap?.requestRender();
        });
        container.appendChild(moveBtn);

        const attackBtn = document.createElement('button');
        attackBtn.className = 'action-btn';
        attackBtn.id = 'btn-attack-unit';
        attackBtn.textContent = 'Attack';
        attackBtn.onclick = withClickSound(() => this.attackWithSelectedUnit());
        container.appendChild(attackBtn);

        const fortBtn = document.createElement('button');
        fortBtn.className = 'action-btn';
        fortBtn.id = 'btn-fortify-unit';
        fortBtn.textContent = 'Fortify';
        fortBtn.onclick = withClickSound(() => this.fortifySelectedUnit());
        container.appendChild(fortBtn);

        // Engineer special actions
        if (unit.typeId === 'civil_engineers') {
            const buildRoadBtn = document.createElement('button');
            buildRoadBtn.className = 'action-btn';
            buildRoadBtn.textContent = 'Construir Estrada';
            buildRoadBtn.onclick = withClickSound(() => {
                const result = gameState.applyUnitBuildAction(unit, 'build_road');
                if (result.success) {
                    this.showNotification('Construção de estrada iniciada', 'success');
                    this.updateHUD();
                } else {
                    this.showNotification(result.message, 'error');
                }
            });
            container.appendChild(buildRoadBtn);
        }

        if (unit.typeId === 'civil_engineers' || unit.typeId === 'explorer' || unit.typeId === 'merchant_ship') {
            const automateBtn = document.createElement('button');
            automateBtn.className = `action-btn ${unit.automated ? 'active' : ''}`;
            const autoLabel = (unit.typeId === 'explorer' || unit.typeId === 'merchant_ship') ? 'Auto-explorar' : 'Automatizado';
            automateBtn.textContent = unit.automated ? `${autoLabel}: ON` : autoLabel;
            automateBtn.onclick = withClickSound(() => {
                unit.automated = !unit.automated;
                automateBtn.textContent = unit.automated ? `${autoLabel}: ON` : autoLabel;
                automateBtn.classList.toggle('active', unit.automated);
                if (unit.typeId === 'explorer' || unit.typeId === 'merchant_ship') {
                    this.showNotification(unit.automated ? `Auto-exploração de ${unit.name} ativada` : `Auto-exploração de ${unit.name} desativada`, 'info');
                } else {
                    this.showNotification(unit.automated ? 'Automação de engenheiro ativada' : 'Automação de engenheiro desativada', 'info');
                }
            });
            container.appendChild(automateBtn);
        }

        // Transport unit actions
        if (unit.bonuses?.transportCapacity && unit.carryingUnits && unit.carryingUnits.length > 0) {
            const unloadBtn = document.createElement('button');
            unloadBtn.className = 'action-btn';
            unloadBtn.textContent = `Descarregar (${unit.carryingUnits.length})`;
            unloadBtn.onclick = withClickSound(() => {
                const result = gameState.unloadUnits(unit.id);
                if (result.success) {
                    this.updateUnitActionButtons(unit);
                } else {
                    this.showNotification(result.message, 'error');
                }
            });
            container.appendChild(unloadBtn);
        }

        // Destination cancel button
        if (unit.destination) {
            const cancelDestBtn = document.createElement('button');
            cancelDestBtn.className = 'action-btn danger';
            cancelDestBtn.textContent = 'Cancelar Rota';
            cancelDestBtn.onclick = withClickSound(() => {
                unit.destination = null;
                this.showNotification('Rota cancelada', 'info');
                this.updateUnitActionButtons(unit);
            });
            container.appendChild(cancelDestBtn);
        }
    }

    getTutorialSteps() {
        return [
            {
                id: 'intro',
                title: 'Bem-vindo ao ano 500 d.C.',
                description: 'Esta breve introdução aborda movimentação, combate, construção de cidades, diplomacia e fluxo de turnos.',
                requiredAction: null,
                hint: 'Você pode ignorar o tutorial a qualquer momento.'
            },
            {
                id: 'move',
                title: 'Passo 1: Mover uma Unidade',
                description: 'Selecione uma de suas unidades, ative o Modo de Movimento e clique em um bloco alcançável.',
                requiredAction: 'move',
                hint: 'Dica: clique duas vezes na unidade selecionada para alternar o Modo de Movimento rapidamente.'
            },
            {
                id: 'combat',
                title: 'Passo 2: Entrar em Combate',
                description: 'Selecione uma unidade inimiga alvo e use Atacar quando estiver no alcance.',
                requiredAction: 'combat',
                hint: 'Selecione um bloco inimigo primeiro, depois use Atacar no painel da unidade.'
            },
            {
                id: 'build',
                title: 'Passo 3: Construir em uma Cidade',
                description: 'Selecione um bloco de cidade do jogador e abra Construir para iniciar infraestrutura ou melhorias na cidade.',
                requiredAction: 'build',
                hint: 'Use Construir em um bloco de cidade pertencente ao jogador a partir da barra de ações.'
            },
            {
                id: 'diplomacy',
                title: 'Passo 4: Diplomacia',
                description: 'Abra a Diplomacia e execute uma ação (trégua, aliança, comércio ou guerra).',
                requiredAction: 'diplomacy',
                hint: 'Os resultados diplomáticos alteram a confiança, a reputação e as opções de comércio.'
            },
            {
                id: 'end_turn',
                title: 'Passo 5: Encerrar Turno',
                description: 'Encerre seu turno para processar a economia, as ações da IA e missões/eventos.',
                requiredAction: 'endTurn',
                hint: 'Verifique suas notificações de recursos e eventos após cada turno.'
            }
        ];
    }

    getTutorialState() {
        if (!gameState?.ensureTutorialState) return null;
        return gameState.ensureTutorialState();
    }

    isTutorialVisible() {
        const state = this.getTutorialState();
        return Boolean(
            state
            && state.active
            && !state.skipped
            && !state.completed
            && this.currentScreen === 'game'
        );
    }

    startTutorial(options = {}) {
        const state = this.getTutorialState();
        if (!state) return;
        const replay = Boolean(options.replay);
        if (replay) {
            state.progress = {
                move: false,
                combat: false,
                build: false,
                diplomacy: false,
                endTurn: false
            };
            state.stepIndex = 0;
            state.completed = false;
            state.skipped = false;
            state.active = true;
            this.showNotification('Tutorial reiniciado.', 'info');
        } else if (state.completed || state.skipped) {
            return;
        } else {
            state.active = true;
        }
        this.tutorialLastHintByStep = {};
        this.updateTutorialPanelVisibility();
        this.showTutorialHint();
    }

    replayTutorial() {
        this.closeModal();
        this.startTutorial({ replay: true });
    }

    skipTutorial() {
        const state = this.getTutorialState();
        if (!state) return;
        state.active = false;
        state.skipped = true;
        this.updateTutorialPanelVisibility();
        this.showNotification('Tutorial pulado.', 'info');
    }

    completeTutorial() {
        const state = this.getTutorialState();
        if (!state) return;
        state.active = false;
        state.completed = true;
        state.skipped = false;
        this.updateTutorialPanelVisibility();
        this.showNotification('Tutorial completo.', 'success');
    }

    advanceTutorialStep(delta) {
        const state = this.getTutorialState();
        if (!state) return;
        const steps = this.getTutorialSteps();
        const current = steps[state.stepIndex] || steps[0];
        if (delta > 0 && current?.requiredAction && !state.progress[current.requiredAction]) {
            this.showNotification('Conclua a ação atual do tutorial antes de continuar.', 'info');
            this.showTutorialHint();
            return;
        }
        state.stepIndex = Math.max(0, Math.min(steps.length - 1, state.stepIndex + delta));
        this.renderTutorialPanel();
        this.showTutorialHint();
    }

    onTutorialAction(action) {
        const state = this.getTutorialState();
        if (!state || !state.active || state.skipped || state.completed) return;
        const normalized = action === 'end_turn' ? 'endTurn' : action;
        if (!Object.prototype.hasOwnProperty.call(state.progress, normalized)) return;
        state.progress[normalized] = true;
        const steps = this.getTutorialSteps();
        const current = steps[state.stepIndex] || null;
        if (current?.requiredAction === normalized) {
            if (state.stepIndex >= steps.length - 1) {
                this.completeTutorial();
                return;
            }
            state.stepIndex += 1;
            this.renderTutorialPanel();
            this.showTutorialHint();
        } else {
            this.renderTutorialPanel();
        }
    }

    ensureTutorialPanel() {
        if (this.tutorialPanel && document.body.contains(this.tutorialPanel)) {
            return this.tutorialPanel;
        }
        const panel = document.createElement('section');
        panel.id = 'tutorial-panel';
        panel.className = 'tutorial-panel';
        document.body.appendChild(panel);
        this.tutorialPanel = panel;
        return panel;
    }

    updateTutorialPanelVisibility() {
        if (!this.isTutorialVisible()) {
            if (this.tutorialPanel && document.body.contains(this.tutorialPanel)) {
                this.tutorialPanel.classList.remove('active');
            }
            return;
        }
        const panel = this.ensureTutorialPanel();
        panel.classList.add('active');
        this.renderTutorialPanel();
    }

    renderTutorialPanel() {
        if (!this.isTutorialVisible()) return;
        const panel = this.ensureTutorialPanel();
        const state = this.getTutorialState();
        if (!state) return;
        const steps = this.getTutorialSteps();
        const step = steps[state.stepIndex] || steps[0];
        const required = step.requiredAction;
        const isDone = !required || Boolean(state.progress[required]);
        const isFinalStep = state.stepIndex === steps.length - 1;
        const progressText = `${state.stepIndex + 1}/${steps.length}`;
        panel.innerHTML = `
            <div class="tutorial-header">
                <strong>Tutorial</strong>
                <span class="tutorial-progress">${progressText}</span>
            </div>
            <h3>${this.escapeHtml(step.title)}</h3>
            <p>${this.escapeHtml(step.description)}</p>
            ${required ? `<p class="tutorial-status ${isDone ? 'done' : 'pending'}">${isDone ? 'Concluído' : 'Aguardando ação'}</p>` : ''}
            <div class="tutorial-actions">
                <button class="menu-btn" data-tutorial="prev" ${state.stepIndex === 0 ? 'disabled' : ''}>Voltar</button>
                <button class="menu-btn" data-tutorial="next" ${(isFinalStep && !isDone) ? 'disabled' : ''}>${isFinalStep ? 'Concluir' : 'Próximo'}</button>
                <button class="menu-btn" data-tutorial="skip">Pular</button>
            </div>
        `;
        panel.querySelector('[data-tutorial="prev"]')?.addEventListener('click', () => this.advanceTutorialStep(-1));
        panel.querySelector('[data-tutorial="next"]')?.addEventListener('click', () => {
            if (isFinalStep) {
                if (!isDone) {
                    this.showNotification('Conclua a ação atual do tutorial antes de concluir.', 'info');
                    this.showTutorialHint();
                    return;
                }
                this.completeTutorial();
                return;
            }
            this.advanceTutorialStep(1);
        });
        panel.querySelector('[data-tutorial="skip"]')?.addEventListener('click', () => this.skipTutorial());
    }

    showTutorialHint() {
        if (!this.isTutorialVisible()) return;
        const state = this.getTutorialState();
        if (!state) return;
        const steps = this.getTutorialSteps();
        const step = steps[state.stepIndex] || null;
        if (!step?.hint) return;
        const now = Date.now();
        const lastShown = Number(this.tutorialLastHintByStep[state.stepIndex] || 0);
        if ((now - lastShown) < 4000) return;
        this.tutorialLastHintByStep[state.stepIndex] = now;
        this.showNotification(step.hint, 'info');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (!this.notificationContainer) return;
        const MAX_NOTIFICATIONS = 5;
        const existing = this.notificationContainer.querySelectorAll('.notification');
        if (existing.length >= MAX_NOTIFICATIONS) {
            existing[0].remove();
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        this.notificationContainer.appendChild(notification);
        setTimeout(() => { notification.remove(); }, 3000);
    }

    /**
     * Show game over screen
     */
    showGameOver(isVictory, customMessage = '') {
        const title = isVictory ? 'Vitória!' : 'Derrota!';
        const defaultMessage = isVictory
            ? 'Pela Glória de Constantinopla! O Império está seguro.'
            : 'Constantinopla caiu. O legado de Roma termina aqui.';
        const message = customMessage || defaultMessage;
        const icon = isVictory ? '👑' : '🏚️';

        const content = `
            <div style="text-align:center;padding:2rem;">
                <div style="font-size:5rem;margin-bottom:1rem;">${icon}</div>
                <h2 style="font-size:3rem;margin-bottom:1rem;color:#D4AF37;">${title}</h2>
                <p style="font-size:1.2rem;margin-bottom:2rem;">${message}</p>
                <div style="display:flex;flex-direction:column;gap:1rem;">
                    <button class="menu-btn primary" onclick="location.reload()">Nova Campanha</button>
                    <button class="menu-btn" onclick="uiManager.returnToMainMenu()">Menu Principal</button>
                </div>
            </div>
        `;

        this.showModal(content);
        audioManager.stopMusic();
        audioManager.playUISound(isVictory ? 'victory' : 'defeat');
    }

    /**
     * Show concise combat result with clear winner/loser and post-battle HP.
     */
    showCombatResult(result) {
        const resolveCombatant = (side) => {
            const payload = result?.[side] || {};
            const live = gameState.units.find((u) => u.id === payload.id);
            const maxHealth = Math.max(
                1,
                Number(live?.stats?.health ?? payload.maxHealth ?? 1)
            );
            const healthValue = Number.isFinite(live?.currentHealth)
                ? live.currentHealth
                : (Number.isFinite(payload.health) ? payload.health : 0);
            return {
                id: payload.id || live?.id || null,
                name: live?.name || payload.name || (side === 'attacker' ? 'Attacker' : 'Defender'),
                owner: live?.owner || payload.owner || null,
                position: live?.position || null,
                health: Math.max(0, Math.floor(healthValue)),
                maxHealth
            };
        };

        const attacker = resolveCombatant('attacker');
        const defender = resolveCombatant('defender');
        if (gameMap) {
            gameMap.focusOnBattleUnits(attacker, defender);
            const highlighted = [];
            if (attacker?.id && attacker.health < attacker.maxHealth) highlighted.push(attacker.id);
            if (defender?.id && defender.health < defender.maxHealth) highlighted.push(defender.id);
            gameMap.setBattleHealthHighlights(highlighted, 3500);
        }
        const battlePosition = defender?.position || attacker?.position;
        let locationText = '';
        if (battlePosition && gameMap) {
            let nearestTown = null;
            let nearestDistance = Number.POSITIVE_INFINITY;
            const cityTiles = gameMap.getCityTiles() || [];
            cityTiles.forEach((tile) => {
                const distance = Math.abs(tile.x - battlePosition.x) + Math.abs(tile.y - battlePosition.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTown = tile.cityData?.name || tile.name || null;
                }
            });
            if (nearestTown && Number.isFinite(nearestDistance) && nearestDistance <= 8) {
                locationText = ` near ${nearestTown}`;
            }
        }

        const playerSide = attacker.owner === 'player'
            ? 'attacker'
            : (defender.owner === 'player' ? 'defender' : null);
        const ourUnit = playerSide === 'attacker' ? attacker : (playerSide === 'defender' ? defender : null);
        const enemyUnit = playerSide === 'attacker' ? defender : (playerSide === 'defender' ? attacker : null);

        let outcome = 'Confronto';
        let level = 'info';
        if (result.attackerDied && result.defenderDied) {
            outcome = 'Baixas mútuas';
            level = 'error';
        } else if (playerSide === 'attacker' || playerSide === 'defender') {
            const ourLost = playerSide === 'attacker' ? Boolean(result.attackerDied) : Boolean(result.defenderDied);
            const enemyLost = playerSide === 'attacker' ? Boolean(result.defenderDied) : Boolean(result.attackerDied);
            if (enemyLost && !ourLost) {
                outcome = 'Vitória';
                level = 'success';
            } else if (ourLost && !enemyLost) {
                outcome = 'Derrota';
                level = 'error';
            } else {
                outcome = 'Empate';
                level = 'info';
            }
        } else if (result.defenderDied && !result.attackerDied) {
            outcome = `${attacker.name} venceu`;
        } else if (result.attackerDied && !result.defenderDied) {
            outcome = `${defender.name} venceu`;
        }

        const baseMessage = ourUnit && enemyUnit
            ? `${outcome}${locationText}: Our ${ourUnit.name} ${ourUnit.health}/${ourUnit.maxHealth} HP vs ${enemyUnit.name} ${enemyUnit.health}/${enemyUnit.maxHealth} HP`
            : `${outcome}${locationText}: ${attacker.name} ${attacker.health}/${attacker.maxHealth} HP vs ${defender.name} ${defender.health}/${defender.maxHealth} HP`;
        const tacticalSummary = result?.summary ? ` | ${result.summary}` : '';
        const combatLogTail = Array.isArray(result?.combatLog) && result.combatLog.length > 0
            ? ` | ${result.combatLog[result.combatLog.length - 1]}`
            : '';
        const message = `${baseMessage}${tacticalSummary}${combatLogTail}`;
        this.showNotification(message, level);

        // Flash the screen if player was attacked
        if (defender?.owner === 'player') {
            document.body.classList.add('hit-shake');
            setTimeout(() => document.body.classList.remove('hit-shake'), 500);
        }

        gameMap?.requestRender();
    }

    /**
     * Show modal
     */
    showModal(content) {
        if (this.modalContent) {
            this.modalContent.innerHTML = content;
        }
        this.modalOverlay?.classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal() {
        this.modalOverlay?.classList.remove('active');
    }

    /**
     * Show save game modal
     */
    showSaveGameModal() {
        const slots = storageManager.getAllSaveSlots();
        let content = '<h2>Salvar Jogo</h2><div style="display:flex;flex-direction:column;gap:1rem;">';

        for (let i = 1; i <= 3; i++) {
            const slot = slots[i - 1];
            content += `
                <button class="menu-btn" onclick="uiManager.saveToSlot(${i})">
                    <span class="btn-text">Slot ${i}${slot ? ` - ${slot.playerName} (Turno ${slot.turn})` : ' Vazio'}</span>
                </button>
            `;
        }

        content += '</div>';
        this.showModal(content);
    }

    /**
     * Show load game modal
     */
    showLoadGameModal() {
        const slots = storageManager.getAllSaveSlots();
        let content = '<h2>Carregar Jogo</h2><div style="display:flex;flex-direction:column;gap:1rem;">';

        for (let i = 1; i <= 3; i++) {
            const slot = slots[i - 1];
            if (slot) {
                content += `
                    <button class="menu-btn" onclick="uiManager.loadFromSlot(${i})">
                        <span class="btn-text">Slot ${i} ${slot.playerName} (Turno ${slot.turn})</span>
                    </button>
                `;
            }
        }

        content += '</div>';
        this.showModal(content);
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        const settings = storageManager.loadSettings();
        const content = `
            <h2>Configurações</h2>
            <div style="padding:2rem;">
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block;margin-bottom:0.5rem;">Volume da Música</label>
                    <input type="range" min="0" max="100" value="${settings.musicVolume * 100}" 
                           onchange="audioManager.setMusicVolume(this.value / 100)" style="width:100%;">
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block;margin-bottom:0.5rem;">Volume dos Efeitos Sonoros</label>
                    <input type="range" min="0" max="100" value="${settings.sfxVolume * 100}" 
                           onchange="audioManager.setSFXVolume(this.value / 100)" style="width:100%;">
                </div>
                <button class="btn-primary" onclick="uiManager.closeModal()">Fechar</button>
            </div>
        `;
        this.showModal(content);
    }

    /**
     * Show about modal
     */
    showAboutModal() {
        const content = `
            <h2>Sobre o Jogo</h2>
            <div style="padding:2rem;max-width:600px;">
                <p style="margin-bottom:1rem;">
                    Um jogo de estratégia baseado em turnos ambientado no Império Bizantino (Império Romano do Oriente) 
                    de 500 a 1453 d.C. Comande imperadores e generais lendários através de momentos cruciais 
                    na história bizantina.
                </p>
                <p style="margin-bottom:1rem;">
                    <strong>Precisão Histórica:</strong> Todos os líderes, unidades e cenários são baseados 
                    na história bizantina real.
                </p>
        <p style="margin-bottom:1rem;">
            Jogo desenvolvido por um grupo do 2º Desenvolvimento de Sistemas Noturno .
        </p>
                <p style="margin-bottom:1.5rem;">
                    <strong>Versão:</strong> ${window.APP_VERSION || 'dev'}
                </p>
                <button class="btn-primary" onclick="uiManager.closeModal()">Fechar</button>
            </div>
        `;
        this.showModal(content);
    }
/**
     * Show game menu
     */
    showGameMenu() {
        const content = `
            <h2>Menu do Jogo</h2>
            <div style="display:flex;flex-direction:column;gap:1rem;padding:1rem;">
                <button class="menu-btn" onclick="uiManager.closeModal()">Continuar</button>
                <button class="menu-btn" onclick="uiManager.showSaveGameModal()">Salvar Jogo</button>
                <button class="menu-btn" onclick="uiManager.showAchievementsModal()">🏆 Conquistas</button>
                <button class="menu-btn" onclick="uiManager.replayTutorial()">Repetir Tutorial</button>
                <button class="menu-btn" onclick="uiManager.showSettingsModal()">Configurações</button>
                <button class="menu-btn" onclick="uiManager.returnToMainMenu()">Menu Principal</button>
            </div>
        `;
        this.showModal(content);
    }

    /**
     * Save to slot
     */
    saveToSlot(slotNumber) {
        const result = storageManager.saveGame(slotNumber);
        this.showNotification(result.message, result.success ? 'success' : 'error');
        this.closeModal();
    }

    /**
     * Load from slot
     */
    loadFromSlot(slotNumber) {
        const slotInfo = storageManager.getSaveSlotInfo(slotNumber);
        if (!slotInfo) {
            this.showNotification('Nenhum dado de salvamento encontrado', 'error');
            this.closeModal();
            return;
        }

        this.showScreen('game');
        initializeGameMap();
        const result = storageManager.loadGame(slotNumber);
        if (result.success) {
            gameMap?.markTerritoryDirty();
            this.initializeGameView();
            this.updateHUD();
            this.showNotification('Jogo carregado', 'success');
            this.updateTutorialPanelVisibility();
        } else {
            this.showScreen('mainMenu');
            this.showNotification(result.message, 'error');
        }
        this.closeModal();
    }

    initializeGameView() {
        // Ensure layout is visible before sizing canvases.
        requestAnimationFrame(() => {
            window.game?.handleResize();
            initializeMinimap();

            // Historical battle: applyScenario already centered the camera; don't override.
            if (gameState?.activeScenario) {
                gameMap?.requestRender();
                this.updateTutorialPanelVisibility();
                return;
            }

            const playerCities = gameMap?.getCityTiles('player') || [];
            const playerFaction = gameState?.player?.faction || gameState?.selectedFaction || this.selectedFaction || 'byzantine';
            const preferredStartTownId = gameState?.getLeaderStartProfile?.(playerFaction)?.startTownId;
            const focusCity = playerCities.find(tile => tile.cityData?.capitalRole === 'primary')
                || playerCities.find(tile => tile.cityData?.id === preferredStartTownId)
                || playerCities.find(tile => tile.cityData?.kind === 'capital')
                || playerCities[0];
            if (focusCity) {
                gameMap?.centerOn(focusCity.x, focusCity.y);
            } else {
                const playerUnits = (gameState?.units || []).filter(u =>
                    u.owner === 'player' &&
                    Number.isFinite(u.position?.x) &&
                    Number.isFinite(u.position?.y) &&
                    u.position.x >= 0 &&
                    u.position.y >= 0
                );
                if (playerUnits.length > 0) {
                    const avgX = playerUnits.reduce((sum, u) => sum + u.position.x, 0) / playerUnits.length;
                    const avgY = playerUnits.reduce((sum, u) => sum + u.position.y, 0) / playerUnits.length;
                    gameMap?.centerOn(avgX, avgY);
                } else {
                    gameMap?.requestRender();
                }
            }
            this.updateTutorialPanelVisibility();
        });
    }

    /**
     * Show Mod Manager Modal
     */
    showModsModal() {
        const esc = this.escapeHtml.bind(this);
        const modsList = modManager.mods.map(mod => `
            <div class="mod-card ${mod.enabled ? 'enabled' : 'disabled'}" style="border:1px solid rgba(212,175,55,${mod.enabled ? '0.6' : '0.2'}); border-radius:8px; padding:10px; margin-bottom:10px; background:rgba(30,41,59,${mod.enabled ? '0.7' : '0.35'}); display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-family:var(--font-display); font-size:1.1rem; color:var(--gold-light);">${esc(mod.name)} <small style="opacity:0.6; font-size:0.75rem;">v${esc(mod.version)}</small></h3>
                    <div style="display:flex; gap:8px;">
                        <button class="action-btn" data-mod-action="toggle" data-mod-id="${esc(mod.id)}" style="padding:4px 8px; font-size:0.75rem; background:${mod.enabled ? 'var(--deep-red)' : 'green'};">
                            ${mod.enabled ? 'Desativar' : 'Ativar'}
                        </button>
                        <button class="action-btn" data-mod-action="delete" data-mod-id="${esc(mod.id)}" style="padding:4px 8px; font-size:0.75rem; background:maroon;">
                            Excluir
                        </button>
                    </div>
                </div>
                <p style="margin:4px 0; font-size:0.85rem; color:var(--parchment); opacity:0.9;">${esc(mod.description)}</p>
                <div style="font-size:0.75rem; opacity:0.7; display:flex; gap:12px;">
                    <span>Autor: ${esc(mod.author)}</span>
                    <span>Unidades: ${Object.keys(mod.units || {}).reduce((acc, cat) => acc + Object.keys(mod.units[cat] || {}).length, 0)}</span>
                    <span>Edifícios: ${Object.keys(mod.buildings || {}).length}</span>
                    <span>Tecnologias: ${Object.keys(mod.techs || {}).length}</span>
                    <span>Eventos: ${(mod.events || []).length}</span>
                </div>
            </div>
        `).join('');

        /*const content = `
            <h2>🧩 Gerenciador de Mods</h2>
            <p style="font-size:0.9rem; opacity:0.8; margin-bottom:1rem;">Personalize sua experiência em 500 d.C. Cole o JSON do mod, envie um arquivo de mod ou carregue mods de exemplo pré-empacotados.</p>
            
            <div class="achievements-panel" style="max-height: 55vh; overflow-y: auto; padding-right: 5px;">
                <h3 class="achievements-category-title">Mods Ativos e Carregados</h3>
                <div id="mods-list-container">
                    ${modsList || '<p style="opacity:0.6; text-align:center; padding:1.5rem 0;">Nenhum mod carregado ainda. Envie ou experimente um mod de exemplo!</p>'}
                </div>
                
                <h3 class="achievements-category-title" style="margin-top:1.5rem;">Carregar Mods de Exemplo</h3>
                <div style="display:flex; gap:10px; margin-bottom:1.5rem; flex-wrap:wrap;">
                    <button class="action-btn" data-mod-action="example" data-mod-id="greek_fire_refinery">🔥 Refinamento de Fogo Grego</button>
                    <button class="action-btn" data-mod-action="example" data-mod-id="barbarian_auxiliaries">⚔️ Auxiliares Bárbaros</button>
                    <button class="action-btn" data-mod-action="example" data-mod-id="imperial_roads_expansion">🛣️ Expansão de Estradas Imperiais</button>
                </div>

                <h3 class="achievements-category-title">Instalar Mod Personalizado</h3>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div>
                        <label style="display:block; font-size:0.85rem; margin-bottom:4px; font-weight:600;">Enviar Arquivo JSON do Mod</label>
                        <input type="file" id="mod-file-input" accept=".json" style="background:rgba(0,0,0,0.4); border:1px solid rgba(212,175,55,0.3); padding:8px; border-radius:4px; width:100%; color:var(--parchment);">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.85rem; margin-bottom:4px; font-weight:600;">Colar Conteúdo JSON do Mod</label>
                        <textarea id="mod-json-input" placeholder="Cole o JSON do seu mod aqui..." style="width:100%; height:120px; background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.3); border-radius:4px; color:#fff; font-family:monospace; padding:8px; box-sizing:border-box; font-size:0.8rem;"></textarea>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="action-btn" data-mod-action="install-text" style="flex:1;">Instalar / Atualizar Mod</button>
                    </div>
                    <div id="mod-validation-feedback" style="font-size:0.85rem; padding:8px; border-radius:4px; display:none;"></div>
                </div>
            </div>

            <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                <button class="action-btn" data-mod-action="close">Fechar</button>
            </div>
        `;*/

        this.showModal(content);
        this.bindModsModalHandlers();
    }

    bindModsModalHandlers() {
        const container = this.modalContent || document;
        const fileInput = container.querySelector('#mod-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (event) => this.handleModFileUpload(event));
        }
        container.querySelectorAll('[data-mod-action]').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const action = event.currentTarget.getAttribute('data-mod-action');
                const modId = event.currentTarget.getAttribute('data-mod-id') || '';
                switch (action) {
                    case 'toggle': this.toggleMod(modId); break;
                    case 'delete': this.deleteMod(modId); break;
                    case 'example': this.loadExampleMod(modId); break;
                    case 'install-text': this.installModFromText(); break;
                    case 'close': this.closeModal(); break;
                }
            });
        });
    }

    toggleMod(modId) {
        audioManager.playUISound('click');
        const result = modManager.toggleMod(modId);
        if (result === 'ok') {
            this.showNotification('Mod alternado com sucesso', 'success');
        } else if (result === 'campaign_active') {
            this.showNotification('Não é possível alterar mods durante uma campanha ativa. Retorne ao Menu Principal primeiro.', 'error');
        } else {
            this.showNotification('Mod não encontrado — a lista pode estar desatualizada', 'error');
        }
        this.showModsModal();
    }

    deleteMod(modId) {
        audioManager.playUISound('click');
        if (confirm('Tem certeza de que deseja excluir este mod?')) {
            const result = modManager.deleteMod(modId);
            if (result === 'ok') {
                this.showNotification('Mod excluído', 'info');
            } else if (result === 'campaign_active') {
                this.showNotification('Não é possível excluir mods durante uma campanha ativa. Retorne ao Menu Principal primeiro.', 'error');
            } else {
                this.showNotification('Mod não encontrado — a lista pode estar desatualizada', 'error');
            }
            this.showModsModal();
        }
    }

    loadExampleMod(modId) {
        audioManager.playUISound('click');
        if (modManager.isCampaignActive()) {
            this.showNotification('Não é possível alterar mods durante uma campanha ativa. Retorne ao Menu Principal primeiro.', 'error');
            return;
        }
        let mod = modManager.mods.find(m => m.id === modId);
        let reinstalled = false;
        if (!mod) {
            if (!modManager.installExampleMod(modId)) {
                this.showNotification(`O mod de exemplo "${modId}" não está no catálogo de exemplos.`, 'error');
                return;
            }
            mod = modManager.mods.find(m => m.id === modId);
            reinstalled = true;
        }
        // Enable on reinstall (mod was just (re)added disabled by default) so the
        // "Load Example Mod" button does the obvious thing on a single click.
        // For an already-present mod, this is the existing toggle behavior.
        if (reinstalled && !mod.enabled) {
            modManager.toggleMod(modId);
            this.showNotification(`Mod de exemplo "${mod.name}" reinstalado e ativado.`, 'success');
        } else {
            modManager.toggleMod(modId);
            this.showNotification(`Mod de exemplo "${mod.name}" alternado!`, 'success');
        }
        this.showModsModal();
    }

    handleModFileUpload(event) {
        const input = event.target;
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                const result = modManager.addMod(json);
                const feedback = document.getElementById('mod-validation-feedback');
                if (result.success) {
                    this.showNotification(`Mod "${json.name}" instalado com sucesso!`, 'success');
                    this.showModsModal();
                } else {
                    this.showNotification('Falha na instalação do mod', 'error');
                    if (feedback) {
                        feedback.style.display = 'block';
                        feedback.style.background = 'rgba(185, 48, 48, 0.15)';
                        feedback.style.border = '1px solid var(--crimson)';
                        feedback.style.color = '#ffc8c8';
                        feedback.innerHTML = `<strong>Erros:</strong><ul style="margin: 4px 0 0 16px; padding: 0;">` +
                            result.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('') + `</ul>`;
                    }
                }
            } catch (err) {
                this.showNotification('Formato de arquivo JSON inválido', 'error');
                const feedback = document.getElementById('mod-validation-feedback');
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.background = 'rgba(185, 48, 48, 0.15)';
                    feedback.style.border = '1px solid var(--crimson)';
                    feedback.style.color = '#ffc8c8';
                    feedback.textContent = `Erro de Análise JSON: ${err.message}`;
                }
            } finally {
                // Reset so re-uploading the same file fires another change event.
                if (input) input.value = '';
            }
        };
        reader.readAsText(file);
    }

    installModFromText() {
        audioManager.playUISound('click');
        const textarea = document.getElementById('mod-json-input');
        const feedback = document.getElementById('mod-validation-feedback');
        if (!textarea || !textarea.value.trim()) {
            this.showNotification('Cole algum JSON primeiro', 'error');
            return;
        }
        
        try {
            const json = JSON.parse(textarea.value);
            const result = modManager.addMod(json);
            if (result.success) {
                this.showNotification(`Mod "${json.name}" instalado com sucesso!`, 'success');
                this.showModsModal();
            } else {
                this.showNotification('A validação do mod falhou', 'error');
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.background = 'rgba(185, 48, 48, 0.15)';
                    feedback.style.border = '1px solid var(--crimson)';
                    feedback.style.color = '#ffc8c8';
                    feedback.innerHTML = `<strong>Erros de Validação:</strong><ul style="margin: 4px 0 0 16px; padding: 0;">` +
                        result.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('') + `</ul>`;
                }
            }
        } catch (err) {
            this.showNotification('Sintaxe JSON inválida', 'error');
            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.background = 'rgba(185, 48, 48, 0.15)';
                feedback.style.border = '1px solid var(--crimson)';
                feedback.style.color = '#ffc8c8';
                feedback.textContent = `Erro de Análise JSON: ${err.message}`;
            }
        }
    }
}

// Global UI manager instance
const uiManager = new UIManager();
window.uiManager = uiManager;