/**
 * Audio Manager
 * Background music and sound effects system
 */

class AudioManager {
    constructor() {
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.currentMusic = null;
        this.currentContext = null;
        this.currentTrack = null;
        this.sounds = {};
        this.musicTracks = {};
        this.initialized = false;
        this.audioContext = null;
        this.assetAvailability = new Map();
        this.musicRequestToken = 0;
    }

    /**
     * Initialize audio system (requires user interaction)
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Load settings
            const settings = storageManager.loadSettings();
            this.musicVolume = settings.musicVolume || 0.5;
            this.sfxVolume = settings.sfxVolume || 0.7;

            this.initialized = true;
            console.log('Sistema de áudio inicializado');
        } catch (error) {
            console.error('Falha ao inicializar áudio:', error);
        }
    }

    /**
     * Play background music
     */
    async canLoadAsset(path) {
        if (!path) return false;
        if (this.assetAvailability.has(path)) {
            return this.assetAvailability.get(path);
        }
        try {
            const response = await fetch(path, { method: 'HEAD', cache: 'no-store' });
            const ok = response.ok;
            this.assetAvailability.set(path, ok);
            return ok;
        } catch (error) {
            console.log('Falha na verificação do arquivo de áudio:', path, error);
            this.assetAvailability.set(path, false);
            return false;
        }
    }

    async playMusic(trackName, loop = true) {
        if (!this.initialized) {
            this.initialize();
        }

        // Idempotent: if the same track is already playing, no-op so context
        // switches (e.g. setContext('ambient')) don't restart it.
        if (this.currentTrack === trackName && this.currentMusic && !this.currentMusic.paused) {
            return;
        }

        // Stop current music
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }

        // For now, we'll use a placeholder
        // In production, you would load actual audio files
        console.log(`Reproduzindo música: ${trackName}`);

        // Create audio element (placeholder)
        const audio = new Audio();
        audio.volume = this.musicVolume;
        audio.loop = loop;

        const src = `assets/audio/music/${trackName}.mp3`;
        const requestToken = ++this.musicRequestToken;
        const canLoad = await this.canLoadAsset(src);
        if (!canLoad) {
            console.log(`Arquivo de música não disponível: ${src}`);
            if (this.currentMusic === audio) this.currentMusic = null;
            // Don't claim the track is playing — leave currentTrack reflecting reality.
            return;
        }

        if (requestToken !== this.musicRequestToken) {
            return;
        }

        audio.src = src;

        this.currentMusic = audio;
        // Only now is the track actually about to play; record it for idempotency.
        this.currentTrack = trackName;

        // Play with promise handling for mobile
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Reprodução de áudio impedida:', error);
            });
        }
    }

    /**
     * Play sound effect
     */
    playSound(soundName) {
        // SFX assets not yet available — intentional no-op.
        // Uncomment and wire src when assets/audio/sfx/${soundName}.mp3 files exist.
    }

    /**
     * Switch music context (ambient or combat).
     * Track changes are gated on the actually-playing track, not the recorded
     * context — so direct playMusic() calls elsewhere can't desync this and
     * cause spurious restarts.
     */
    setContext(contextName) {
        const trackForContext = contextName === 'combat'
            ? 'battle_theme'
            : (contextName === 'ambient' ? '500ad_ambient' : null);
        if (!trackForContext) return;
        this.currentContext = contextName;
        if (this.currentTrack !== trackForContext) {
            this.playMusic(trackForContext);
        }
    }

    /**
     * Stop music
     */
    stopMusic() {
        this.musicRequestToken++;
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        this.currentTrack = null;
        this.currentContext = null;
    }

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }

        // Save to settings
        storageManager.saveSettings({ musicVolume: this.musicVolume });
    }

    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        storageManager.saveSettings({ sfxVolume: this.sfxVolume });
    }

    /**
     * Mute all audio
     */
    muteAll() {
        this.setMusicVolume(0);
        this.setSFXVolume(0);
    }

    /**
     * Unmute all audio
     */
    unmuteAll() {
        this.setMusicVolume(0.5);
        this.setSFXVolume(0.7);
    }

    /**
     * Play UI sound
     */
    playUISound(action) {
        const sounds = {
            click: 'ui_click',
            hover: 'ui_hover',
            select: 'ui_select',
            error: 'ui_error',
            success: 'ui_success'
        };

        if (sounds[action]) {
            this.playSound(sounds[action]);
        }
    }

    /**
     * Play combat sound
     */
    playCombatSound(type) {
        const sounds = {
            sword: 'combat_sword',
            arrow: 'combat_arrow',
            cavalry: 'combat_cavalry',
            victory: 'combat_victory',
            defeat: 'combat_defeat'
        };

        if (sounds[type]) {
            this.playSound(sounds[type]);
        }
    }
}

// Global audio manager instance
const audioManager = new AudioManager();

// Initialize audio on first user interaction
document.addEventListener('click', () => {
    audioManager.initialize();
}, { once: true });

document.addEventListener('touchstart', () => {
    audioManager.initialize();
}, { once: true });
