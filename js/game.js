/**
 * Main Game Controller
 * Orchestrates all game systems and initialization
 */

class Game {
    constructor() {
        this.running = false;
        this.lastFrameTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        this.continuousMapRendering = false;
    }

    /**
     * Initialize the game
     */
    async initialize() {
        console.log('Inicializando - Jogo de Estratégia do Império Bizantino');

        // Simulate loading
        await this.loadAssets();

        // Initialize UI
        uiManager.initialize();

        // Initialize Mod Manager
        if (typeof modManager !== 'undefined') {
            modManager.initialize();
        }

        // Initialize audio
        await audioManager.initialize();

        console.log('Jogo inicializado com sucesso');
    }

    /**
     * Load game assets
     */
    async loadAssets() {
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');

        const assets = [
            { name: 'Dados de líderes', delay: 200 },
            { name: 'Dados de unidades', delay: 200 },
            { name: 'Blocos do mapa', delay: 300 },
            { name: 'Gráficos da interface', delay: 200 },
            { name: 'Arquivos de áudio', delay: 300 }
        ];

        let progress = 0;
        const progressStep = 100 / assets.length;

        for (const asset of assets) {
            if (loadingText) {
                loadingText.textContent = `Carregando ${asset.name}...`;
            }

            await new Promise(resolve => setTimeout(resolve, asset.delay));

            progress += progressStep;
            if (loadingProgress) {
                loadingProgress.style.width = `${progress}%`;
            }
        }

        if (loadingText) {
            loadingText.textContent = 'Pronto!';
        }
        if (loadingProgress) {
            loadingProgress.style.width = '100%';
        }
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.lastFrameTime = performance.now();
        if (this.continuousMapRendering) {
            this.gameLoop();
        }
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.running = false;
    }

    /**
     * Main game loop
     */
    gameLoop(currentTime = 0) {
        if (!this.running) return;

        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

            // Update game state
            this.update(deltaTime);

            // Render
            this.render();
        }

        // Request next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        // Update game logic here
        // For turn-based game, most updates happen on user actions
        // This can be used for animations, AI, etc.
    }

    /**
     * Render game
     */
    render() {
        // Turn-based map is rendered on demand by UI/state actions.
        if (!this.continuousMapRendering) {
            if (minimap && uiManager.currentScreen === 'game') {
                minimap.updateViewport();
            }
            return;
        }

        if (gameMap && uiManager.currentScreen === 'game') {
            gameMap.requestRender();
            if (minimap) minimap.updateViewport();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (gameMap && gameMap.canvas) {
            // Adjust canvas size if needed
            const container = gameMap.canvas.parentElement;
            if (container) {
                gameMap.canvas.width = container.clientWidth;
                gameMap.canvas.height = container.clientHeight;
                gameMap.requestRender();
            }
        }

        if (minimap) {
            minimap.resize();
            minimap.render();
        }
    }
}

// Global game instance
const game = new Game();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    game.initialize().then(() => {
        game.start();
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    game.handleResize();
});

// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        game.handleResize();
    }, 100);
});

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'CANVAS') {
        e.preventDefault();
    }
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Auto-save when leaving
        if (gameState.initialized && storageManager.settings.autoSave) {
            storageManager.autoSaveAsync();
        }
    }
});

// Synchronous save on tab close / navigation — pagehide fires reliably where
// setTimeout-deferred work may be throttled or dropped.
window.addEventListener('pagehide', () => {
    if (gameState.initialized && storageManager.settings.autoSave) {
        try { storageManager.autoSave(); } catch (e) { console.warn('falha no salvamento automático ao fechar a página:', e); }
    }
});

// Export for debugging
window.game = game;
window.gameState = gameState;
window.gameMap = gameMap;
