/**
 * Minimap Component
 * Displays a small overview of the entire map with viewport indicator
 */

class Minimap {
    constructor(gameMap) {
        this.gameMap = gameMap;
        this.canvas = null;
        this.ctx = null;
        this.viewportIndicator = null;
        this.activeUnitIndicator = null;
        this.scaleX = 0;
        this.scaleY = 0;
        this.width = 0;
        this.height = 0;
        this.isDragging = false;
        this.realmGrid = [];
    }

    /**
     * Initialize the minimap
     */
    initialize() {
        this.canvas = document.getElementById('minimap-canvas');
        this.viewportIndicator = document.getElementById('minimap-viewport');

        if (!this.canvas) {
            console.warn('Canvas do minimapa não encontrado');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.ensureIndicators();

        this.resize();

        // Setup event listeners
        this.setupEventListeners();

        // Initial render
        this.render();
    }

    ensureIndicators() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;

        if (!this.viewportIndicator) {
            this.viewportIndicator = document.createElement('div');
            this.viewportIndicator.id = 'minimap-viewport';
            this.viewportIndicator.className = 'minimap-viewport';
            container.appendChild(this.viewportIndicator);
        }

        this.activeUnitIndicator = document.getElementById('minimap-active-unit');
        if (!this.activeUnitIndicator) {
            this.activeUnitIndicator = document.createElement('div');
            this.activeUnitIndicator.id = 'minimap-active-unit';
            this.activeUnitIndicator.className = 'minimap-active-unit';
            container.appendChild(this.activeUnitIndicator);
        }
    }

    /**
     * Setup event listeners for minimap interaction
     */
    setupEventListeners() {
        this.canvas.addEventListener('pointerdown', (event) => {
            this.isDragging = true;
            this.handleMinimapPointer(event);
            this.canvas.setPointerCapture(event.pointerId);
        });

        this.canvas.addEventListener('pointermove', (event) => {
            if (this.isDragging) {
                this.handleMinimapPointer(event);
            }
        });

        this.canvas.addEventListener('pointerup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('pointercancel', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('pointerleave', () => {
            this.isDragging = false;
        });
    }

    /**
     * Sync minimap dimensions with CSS size
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        const worldWidth = this.gameMap.width * MAP_CONFIG.tileSize;
        const worldHeight = this.gameMap.height * MAP_CONFIG.tileSize;
        this.scaleX = this.width / worldWidth;
        this.scaleY = this.height / worldHeight;
        this.ensureRealmGrid();
    }

    ensureRealmGrid() {
        if (this.realmGrid.length !== this.gameMap.height) {
            this.realmGrid = Array.from({ length: this.gameMap.height }, () => new Array(this.gameMap.width).fill(null));
            return;
        }
        for (let y = 0; y < this.gameMap.height; y++) {
            const row = this.realmGrid[y];
            if (!Array.isArray(row) || row.length !== this.gameMap.width) {
                this.realmGrid[y] = new Array(this.gameMap.width).fill(null);
            }
        }
    }

    /**
     * Handle pointer input to jump to minimap position
     */
    handleMinimapPointer(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const worldX = (x / this.scaleX) - (this.gameMap.canvas.width / 2);
        const worldY = (y / this.scaleY) - (this.gameMap.canvas.height / 2);

        const maxX = (this.gameMap.width * MAP_CONFIG.tileSize) - this.gameMap.canvas.width;
        const maxY = (this.gameMap.height * MAP_CONFIG.tileSize) - this.gameMap.canvas.height;

        this.gameMap.camera.x = Math.max(0, Math.min(maxX, worldX));
        this.gameMap.camera.y = Math.max(0, Math.min(maxY, worldY));

        // Re-render both maps
        this.gameMap.requestRender();
        this.updateViewport();
    }

    /**
     * Render the minimap
     */
    render() {
        if (!this.ctx) return;

        // Clear minimap
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const tilePixelWidth = Math.max(1, MAP_CONFIG.tileSize * this.scaleX);
        const tilePixelHeight = Math.max(1, MAP_CONFIG.tileSize * this.scaleY);
        const realmGrid = this.realmGrid;
        const realmColors = {
            player: { fill: 'rgba(213, 166, 67, 0.35)', edge: 'rgba(255, 221, 112, 0.9)' },
            enemy: { fill: 'rgba(178, 43, 43, 0.34)', edge: 'rgba(255, 143, 143, 0.92)' },
            neutral: { fill: 'rgba(68, 137, 92, 0.30)', edge: 'rgba(151, 218, 170, 0.85)' },
            byzantine: { fill: 'rgba(122, 52, 167, 0.34)', edge: 'rgba(187, 136, 244, 0.95)' },
            arab: { fill: 'rgba(46, 137, 89, 0.34)', edge: 'rgba(138, 235, 182, 0.9)' },
            bulgar: { fill: 'rgba(177, 58, 58, 0.34)', edge: 'rgba(246, 156, 156, 0.9)' },
            frank: { fill: 'rgba(66, 118, 188, 0.33)', edge: 'rgba(154, 197, 255, 0.9)' },
            sassanid: { fill: 'rgba(176, 108, 52, 0.34)', edge: 'rgba(252, 192, 125, 0.9)' },
            tribal: { fill: 'rgba(103, 121, 70, 0.28)', edge: 'rgba(185, 205, 141, 0.82)' }
        };

        const getRealmStyle = (realmKey) => {
            if (!realmKey) return null;
            return realmColors[realmKey] || realmColors.neutral;
        };

        // Draw simplified terrain + realm tint
        for (let y = 0; y < this.gameMap.height; y++) {
            for (let x = 0; x < this.gameMap.width; x++) {
                const tile = this.gameMap.tiles[y][x];
                if (!tile) continue;
                const explored = !this.gameMap.isFoggedTile(x, y);
                const currentlyVisible = this.gameMap.isTileVisible(x, y);

                // Get color from heightmap or terrain
                let color = '#888';
                if (typeof MEDITERRANEAN_HEIGHTMAP !== 'undefined' &&
                    MEDITERRANEAN_HEIGHTMAP[y] &&
                    MEDITERRANEAN_HEIGHTMAP[y][x] !== undefined) {
                    color = heightToColor(MEDITERRANEAN_HEIGHTMAP[y][x]);
                } else {
                    color = TERRAIN_TYPES[tile.terrain].color;
                }

                // Draw pixel
                const px = x * MAP_CONFIG.tileSize * this.scaleX;
                const py = y * MAP_CONFIG.tileSize * this.scaleY;
                const sizeX = tilePixelWidth;
                const sizeY = tilePixelHeight;

                this.ctx.fillStyle = color;
                this.ctx.fillRect(px, py, sizeX, sizeY);
                if (!explored) {
                    this.ctx.fillStyle = 'rgba(92, 96, 108, 0.34)';
                    this.ctx.fillRect(px, py, sizeX, sizeY);
                }

                // Territory ownership / realm tint overlay for easier border reading.
                const controlOwner = explored ? (tile.owner || this.gameMap.getTerritoryOwnerAt(x, y)) : null;
                const realmKey = explored && tile.terrain !== 'water'
                    ? ((tile.faction && tile.terrain !== 'water') ? tile.faction : controlOwner)
                    : null;
                realmGrid[y][x] = tile.terrain === 'water' ? null : (realmKey || null);
                const realmStyle = getRealmStyle(realmGrid[y][x]);
                if (realmStyle && tile.terrain !== 'water') {
                    this.ctx.fillStyle = realmStyle.fill;
                    this.ctx.fillRect(px, py, sizeX, sizeY);
                }
                if (explored && !currentlyVisible) {
                    this.ctx.fillStyle = 'rgba(78, 82, 92, 0.16)';
                    this.ctx.fillRect(px, py, sizeX, sizeY);
                }
            }
        }

        // Emphasize realm boundaries with bright edge highlights on overlay color.
        const edgeThicknessX = Math.max(1, Math.round(Math.min(2, tilePixelWidth)));
        const edgeThicknessY = Math.max(1, Math.round(Math.min(2, tilePixelHeight)));
        for (let y = 0; y < this.gameMap.height; y++) {
            for (let x = 0; x < this.gameMap.width; x++) {
                const realmKey = realmGrid[y][x];
                if (!realmKey) continue;

                const style = getRealmStyle(realmKey);
                if (!style) continue;

                const px = x * MAP_CONFIG.tileSize * this.scaleX;
                const py = y * MAP_CONFIG.tileSize * this.scaleY;
                const rightRealm = x + 1 < this.gameMap.width ? realmGrid[y][x + 1] : null;
                const bottomRealm = y + 1 < this.gameMap.height ? realmGrid[y + 1][x] : null;
                const leftRealm = x > 0 ? realmGrid[y][x - 1] : null;
                const topRealm = y > 0 ? realmGrid[y - 1][x] : null;

                this.ctx.fillStyle = style.edge;
                if (rightRealm !== realmKey) {
                    this.ctx.fillRect(px + tilePixelWidth - edgeThicknessX, py, edgeThicknessX, tilePixelHeight);
                }
                if (bottomRealm !== realmKey) {
                    this.ctx.fillRect(px, py + tilePixelHeight - edgeThicknessY, tilePixelWidth, edgeThicknessY);
                }
                if (leftRealm !== realmKey) {
                    this.ctx.fillRect(px, py, edgeThicknessX, tilePixelHeight);
                }
                if (topRealm !== realmKey) {
                    this.ctx.fillRect(px, py, tilePixelWidth, edgeThicknessY);
                }
            }
        }

        // Draw cities/important locations
        if (typeof HISTORIC_TOWNS !== 'undefined') {
            HISTORIC_TOWNS.forEach(town => {
                const px = town.x * MAP_CONFIG.tileSize * this.scaleX;
                const py = town.y * MAP_CONFIG.tileSize * this.scaleY;
                if (this.gameMap.isFoggedTile(town.x, town.y)) return;

                const tile = this.gameMap.getTile(town.x, town.y);
                if (tile?.owner === 'player') this.ctx.fillStyle = '#f4d03f';
                else if (tile?.owner === 'enemy') this.ctx.fillStyle = '#ff9f9f';
                else if (tile?.owner === 'neutral') this.ctx.fillStyle = '#9cd3b0';
                else this.ctx.fillStyle = '#D4AF37';
                this.ctx.fillRect(px - 1, py - 1, 3, 3);
            });
        }

        // Update viewport indicator
        this.updateViewport();
    }

    /**
     * Update viewport indicator position
     */
    updateViewport() {
        if (!this.viewportIndicator) return;

        const vpX = this.gameMap.camera.x * this.scaleX;
        const vpY = this.gameMap.camera.y * this.scaleY;
        const vpWidth = this.gameMap.canvas.width * this.scaleX;
        const vpHeight = this.gameMap.canvas.height * this.scaleY;

        this.viewportIndicator.style.left = `${vpX}px`;
        this.viewportIndicator.style.top = `${vpY}px`;
        this.viewportIndicator.style.width = `${vpWidth}px`;
        this.viewportIndicator.style.height = `${vpHeight}px`;
        this.updateActiveUnitIndicator();
    }

    updateActiveUnitIndicator() {
        if (!this.activeUnitIndicator) return;
        const selectedUnit = (typeof gameState !== 'undefined' && gameState)
            ? gameState.selectedUnit
            : null;

        if (!selectedUnit
            || selectedUnit.owner !== 'player'
            || !Number.isFinite(selectedUnit.position?.x)
            || !Number.isFinite(selectedUnit.position?.y)) {
            this.activeUnitIndicator.style.display = 'none';
            return;
        }

        const centerX = ((selectedUnit.position.x * MAP_CONFIG.tileSize) + (MAP_CONFIG.tileSize / 2)) * this.scaleX;
        const centerY = ((selectedUnit.position.y * MAP_CONFIG.tileSize) + (MAP_CONFIG.tileSize / 2)) * this.scaleY;
        this.activeUnitIndicator.style.display = 'block';
        this.activeUnitIndicator.style.left = `${centerX}px`;
        this.activeUnitIndicator.style.top = `${centerY}px`;
    }
}

// Global minimap instance
let minimap = null;

/**
 * Initialize minimap
 */
function initializeMinimap() {
    if (!gameMap) return;

    const canvas = document.getElementById('minimap-canvas');
    if (minimap && minimap.canvas === canvas) {
        minimap.gameMap = gameMap;
        minimap.resize();
        minimap.render();
        return;
    }

    minimap = new Minimap(gameMap);
    minimap.initialize();
}
