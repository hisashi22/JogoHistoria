/**
 * Storage System
 * LocalStorage-based save/load functionality
 */

const STORAGE_KEYS = {
    SAVE_SLOT_1: 'byzantine_save_slot_1',
    SAVE_SLOT_2: 'byzantine_save_slot_2',
    SAVE_SLOT_3: 'byzantine_save_slot_3',
    AUTO_SAVE: 'byzantine_auto_save',
    SETTINGS: 'byzantine_settings'
};

const SAVE_SCHEMA_VERSION = 1;

class StorageManager {
    constructor() {
        this.settings = this.loadSettings();
        this.autoSaveTimer = null;
    }

    normalizeSlotNumber(slotNumber) {
        let parsed = null;
        if (typeof slotNumber === 'number') {
            parsed = slotNumber;
        } else if (typeof slotNumber === 'string') {
            const trimmed = slotNumber.trim();
            if (/^\d+$/.test(trimmed)) {
                parsed = Number(trimmed);
            }
        }
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3) {
            return null;
        }
        return parsed;
    }

    getSlotKey(slotNumber) {
        return slotNumber === 0
            ? STORAGE_KEYS.AUTO_SAVE
            : STORAGE_KEYS[`SAVE_SLOT_${slotNumber}`];
    }

    buildSaveEnvelope(payload, slotNumber) {
        return {
            schemaVersion: SAVE_SCHEMA_VERSION,
            format: 'json',
            metadata: {
                slotNumber,
                savedAt: new Date().toISOString(),
                playerName: gameState.selectedLeader?.name || 'Unknown',
                turn: gameState.turn
            },
            payload
        };
    }

    normalizeSaveEnvelope(raw, slotNumber) {
        if (!raw || typeof raw !== 'object') {
            return null;
        }

        // Native schema v1 envelope.
        const rawPayload = raw.payload && typeof raw.payload === 'object'
            ? raw.payload
            : (raw.data && typeof raw.data === 'object' ? raw.data : null);
        const normalizedSchemaVersion = Number(raw.schemaVersion);
        const hasValidSchemaVersion = Number.isFinite(normalizedSchemaVersion) && normalizedSchemaVersion === SAVE_SCHEMA_VERSION;
        const hasValidFormat = raw.format === undefined || raw.format === 'json';
        if (hasValidSchemaVersion && hasValidFormat && rawPayload) {
            const metadata = raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : {};
            let savedAt = metadata.savedAt;
            if (!savedAt && Number.isFinite(rawPayload.timestamp)) {
                const legacyDate = new Date(rawPayload.timestamp);
                if (!Number.isNaN(legacyDate.getTime())) {
                    savedAt = legacyDate.toISOString();
                }
            }
            return {
                envelope: {
                    schemaVersion: SAVE_SCHEMA_VERSION,
                    format: 'json',
                    metadata: {
                        slotNumber,
                        savedAt: savedAt || new Date().toISOString(),
                        playerName: metadata.playerName || (rawPayload.selectedLeader?.name || 'Unknown'),
                        turn: Number.isFinite(metadata.turn) ? metadata.turn : rawPayload.turn
                    },
                    payload: rawPayload
                },
                payload: rawPayload
            };
        }

        // Legacy flat save shape from previous versions.
        if (raw.version && raw.player && Array.isArray(raw.units)) {
            const payload = { ...raw };
            let savedAt = raw.savedAt;
            if (!savedAt && Number.isFinite(raw.timestamp)) {
                const legacyDate = new Date(raw.timestamp);
                if (!Number.isNaN(legacyDate.getTime())) {
                    savedAt = legacyDate.toISOString();
                }
            }
            const envelope = {
                schemaVersion: SAVE_SCHEMA_VERSION,
                format: 'json',
                metadata: {
                    slotNumber,
                    savedAt: savedAt || new Date().toISOString(),
                    playerName: raw.playerName || raw.selectedLeader?.name || 'Unknown',
                    turn: Number.isFinite(raw.turn) ? raw.turn : 1
                },
                payload
            };
            return { envelope, payload };
        }

        return null;
    }

    /**
     * Save game to a specific slot
     */
    saveGame(slotNumber = 0) {
        try {
            const normalizedSlot = this.normalizeSlotNumber(slotNumber);
            if (normalizedSlot === null) {
                return { success: false, message: 'Número de slot de salvamento inválido' };
            }
            const payload = gameState.serialize();
            const saveData = this.buildSaveEnvelope(payload, normalizedSlot);
            const key = this.getSlotKey(normalizedSlot);
            localStorage.setItem(key, JSON.stringify(saveData));

            return { success: true, message: 'Jogo salvo com sucesso' };
        } catch (error) {
            console.error('Falha ao salvar:', error);
            return { success: false, message: 'Falha ao salvar o jogo' };
        }
    }

    /**
     * Load game from a specific slot
     */
    loadGame(slotNumber = 0) {
        try {
            const normalizedSlot = this.normalizeSlotNumber(slotNumber);
            if (normalizedSlot === null) {
                return { success: false, message: 'Número de slot de salvamento inválido' };
            }
            const key = this.getSlotKey(normalizedSlot);
            const saveDataStr = localStorage.getItem(key);

            if (!saveDataStr) {
                return { success: false, message: 'Nenhum dado de salvamento encontrado' };
            }

            const saveData = JSON.parse(saveDataStr);
            const normalized = this.normalizeSaveEnvelope(saveData, normalizedSlot);
            if (!normalized) {
                return { success: false, message: 'Formato de dados de salvamento inválido ou não suportado' };
            }
            const success = gameState.deserialize(normalized.payload);
            if (!success) {
                return { success: false, message: 'Falha ao carregar os dados de salvamento' };
            }

            // Rewrite into current envelope format when possible, but do not fail a successful load.
            try {
                localStorage.setItem(key, JSON.stringify(normalized.envelope));
            } catch (rewriteError) {
                console.warn('A gravação da migração do formato de salvamento falhou; continuando com o estado carregado:', rewriteError);
            }
            return { success: true, message: 'Jogo carregado com sucesso', data: normalized.envelope };
        } catch (error) {
            console.error('Falha ao carregar:', error);
            return { success: false, message: 'Falha ao carregar o jogo' };
        }
    }

    /**
     * Get save slot metadata
     */
    getSaveSlotInfo(slotNumber) {
        try {
            const normalizedSlot = this.normalizeSlotNumber(slotNumber);
            if (normalizedSlot === null) return null;
            const key = this.getSlotKey(normalizedSlot);
            const saveDataStr = localStorage.getItem(key);

            if (!saveDataStr) return null;

            const saveData = JSON.parse(saveDataStr);
            const normalized = this.normalizeSaveEnvelope(saveData, normalizedSlot);
            if (!normalized) return null;
            const metadata = normalized.envelope.metadata || {};
            return {
                slotNumber: normalizedSlot,
                playerName: metadata.playerName,
                turn: metadata.turn,
                savedAt: metadata.savedAt,
                exists: true
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Get all save slots
     */
    getAllSaveSlots() {
        return [
            this.getSaveSlotInfo(1),
            this.getSaveSlotInfo(2),
            this.getSaveSlotInfo(3)
        ];
    }

    /**
     * Delete a save slot
     */
    deleteSave(slotNumber) {
        try {
            const key = STORAGE_KEYS[`SAVE_SLOT_${slotNumber}`];
            localStorage.removeItem(key);
            return { success: true, message: 'Salvamento excluído com sucesso' };
        } catch (error) {
            return { success: false, message: 'Falha ao excluir o salvamento' };
        }
    }

    /**
     * Cancel any pending async auto-save timer.
     */
    cancelPendingAutoSave() {
        if (this.autoSaveTimer !== null) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * Auto-save game (synchronous). Clears any pending async save so the
     * deferred work doesn't duplicate the JSON.stringify of the same state.
     */
    autoSave() {
        this.cancelPendingAutoSave();
        return this.saveGame(0);
    }

    /**
     * Auto-save deferred past the current frame to avoid blocking the main thread
     * on visibilitychange events (JSON.stringify on large state can freeze 50-200ms).
     * Coalesces rapid bursts (e.g. visibilitychange + pagehide) so only one
     * JSON.stringify runs per quiescent period. The dedicated `pagehide`
     * listener calls autoSave() synchronously, which also clears any pending
     * deferred work to avoid duplicate saves.
     */
    autoSaveAsync() {
        if (this.autoSaveTimer !== null) return;
        this.autoSaveTimer = setTimeout(() => {
            this.autoSaveTimer = null;
            try { this.saveGame(0); } catch (e) { console.warn('Falha no salvamento automático:', e); }
        }, 0);
    }

    /**
     * Export save data as JSON
     */
    exportSave(slotNumber) {
        try {
            const normalizedSlot = this.normalizeSlotNumber(slotNumber);
            if (normalizedSlot === null || normalizedSlot === 0) return null;
            const key = this.getSlotKey(normalizedSlot);
            const saveDataStr = localStorage.getItem(key);
            if (!saveDataStr) return null;
            const saveData = JSON.parse(saveDataStr);
            const normalized = this.normalizeSaveEnvelope(saveData, normalizedSlot);
            if (!normalized) return null;
            return JSON.stringify(normalized.envelope);
        } catch (error) {
            return null;
        }
    }

    /**
     * Import save data from JSON
     */
    importSave(jsonData, slotNumber) {
        try {
            const normalizedSlot = this.normalizeSlotNumber(slotNumber);
            if (normalizedSlot === null || normalizedSlot === 0) {
                return { success: false, message: 'Número de slot de salvamento inválido' };
            }
            const saveData = JSON.parse(jsonData);
            const normalized = this.normalizeSaveEnvelope(saveData, normalizedSlot);
            if (!normalized) {
                return { success: false, message: 'Dados de salvamento inválidos ou não suportados' };
            }
            const envelope = normalized.envelope;
            const payload = envelope && envelope.payload;
            const payloadVersion = payload && payload.version;
            if (!payload || typeof payloadVersion === 'undefined') {
                return { success: false, message: 'Dados de salvamento inválidos ou não suportados' };
            }
            if (typeof isSupportedSaveVersion === 'function' && !isSupportedSaveVersion(payloadVersion)) {
                return { success: false, message: 'Dados de salvamento inválidos ou não suportados' };
            }
            const key = this.getSlotKey(normalizedSlot);
            localStorage.setItem(key, JSON.stringify(envelope));
            return { success: true, message: 'Salvamento importado com sucesso' };
        } catch (error) {
            return { success: false, message: 'Dados de salvamento inválidos' };
        }
    }

    /**
     * Save settings
     */
    saveSettings(settings) {
        try {
            this.settings = { ...this.settings, ...settings };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Load settings
     */
    loadSettings() {
        try {
            const settingsStr = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (settingsStr) {
                return JSON.parse(settingsStr);
            }
        } catch (error) {
            console.error('Falha ao carregar as configurações:', error);
        }

        // Default settings
        return {
            musicVolume: 0.5,
            sfxVolume: 0.7,
            autoSave: true,
            difficulty: 'normal'
        };
    }

    /**
     * Clear all data
     */
    clearAllData() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return { success: true, message: 'Todos os dados foram limpos' };
        } catch (error) {
            return { success: false, message: 'Falha ao limpar os dados' };
        }
    }
}

// Global storage manager instance
const storageManager = new StorageManager();
