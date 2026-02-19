/**
 * Game.js — Main game orchestrator
 * 
 * Central class that initializes all subsystems, manages the game loop,
 * and coordinates updates between entities, managers, and rendering.
 * This is the single entry point that wires everything together.
 */

import { CONFIG } from './Config.js';
import GameState from './GameState.js';
import Player from '../entities/Player.js';
import TrackSystem from '../entities/Train.js';
import ObstacleManager from '../entities/Obstacle.js';
import CoinManager from '../entities/Coin.js';
import SceneManager from '../rendering/SceneManager.js';
import CameraController from '../rendering/CameraController.js';
import Lighting from '../rendering/Lighting.js';
import CityBackground from '../rendering/CityBackground.js';
import AudioManager from '../managers/AudioManager.js';
import InputHandler from '../managers/InputManager.js';
import MenuUI from '../managers/UIManager.js';

export default class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');

        // Rendering pipeline
        this.sceneManager = new SceneManager(this.canvas);
        this.cameraController = new CameraController();
        this.lighting = new Lighting(this.sceneManager.scene);

        // Convenience references
        this.scene = this.sceneManager.scene;
        this.camera = this.cameraController.camera;

        // State
        this.gameState = new GameState();

        // UI (needs game reference for button callbacks)
        this.ui = new MenuUI(this);

        // Timing
        this.lastTime = 0;
        this.accumulatedTime = 0;

        // Initialize all subsystems
        this.init();
    }

    // ===== Initialization =====

    init() {
        // Audio
        this.audio = new AudioManager();

        // Entities
        this.player = new Player(this.scene);
        this.track = new TrackSystem(this.scene);
        this.obstacles = new ObstacleManager(this.scene);
        this.coins = new CoinManager(this.scene);

        // Input
        this.input = new InputHandler(this);

        // City background
        this.cityBackground = new CityBackground(this.scene);

        // Handle window resize
        window.addEventListener('resize', () => {
            this.sceneManager.handleResize(this.camera);
        });

        // Start menu music on first user interaction (autoplay policy)
        const startAudio = () => {
            this.audio.playMenu();
            document.removeEventListener('click', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };
        document.addEventListener('click', startAudio);
        document.addEventListener('touchstart', startAudio);

        // Show menu and start game loop
        this.ui.showMainMenu();
        this.startGameLoop();
    }

    // ===== State Transitions =====

    startGame() {
        this.gameState.state = 'PLAYING';
        this.gameState.reset();

        // Auto-activate owned powerups
        this.gameState.activateBoard();
        this.gameState.activateMagnet();

        // Reset all entities
        this.player.reset();
        this.track.reset();
        this.obstacles.reset();
        this.coins.reset();

        // Switch audio & UI
        this.audio.playGame();
        this.ui.showGame();
        this.ui.updateHUD();
    }

    togglePause() {
        if (this.gameState.state === 'PLAYING') {
            this.gameState.state = 'PAUSED';
            this.ui.showPause();
        } else if (this.gameState.state === 'PAUSED') {
            this.gameState.state = 'PLAYING';
            this.ui.hidePause();
        }
    }

    showMainMenu() {
        this.gameState.state = 'MENU';
        this.audio.playMenu();
        this.ui.showMainMenu();
    }

    gameOver() {
        this.gameState.state = 'GAME_OVER';
        this.gameState.bankCoins();
        const isNewRecord = this.gameState.saveHighScore();
        this.audio.playMenu();
        this.ui.showGameOver(isNewRecord);
    }

    // ===== Game Loop =====

    startGameLoop() {
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    gameLoop(currentTime) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        if (this.gameState.state === 'PLAYING') {
            this.update(deltaTime);
            this.ui.updateHUD();
        }

        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // ===== Update (called every frame while PLAYING) =====

    update(deltaTime) {
        // 1. Distance & speed progression
        this.gameState.distance += this.gameState.speed * deltaTime;
        this.gameState.updateSpeed();

        // 2. Magnet timer
        if (this.gameState.hasMagnet) {
            this.gameState.magnetTimer -= deltaTime;
            if (this.gameState.magnetTimer <= 0) {
                this.gameState.hasMagnet = false;
            }
        }

        // 3. Update entities
        this.player.update(deltaTime, this.track.currentZ);
        this.track.update(deltaTime, this.gameState.speed);
        this.obstacles.update(deltaTime, this.gameState.speed, this.track.currentZ, this.gameState.distance);
        this.coins.update(deltaTime, this.gameState.speed, this.track.currentZ);

        // 4. Coin collection
        const playerHitbox = this.player.getHitbox();
        const collectRadius = this.gameState.hasMagnet ? 3.0 : 0.8;
        const coinsCollected = this.coins.checkCollection(playerHitbox, this.track.currentZ, collectRadius);
        if (coinsCollected > 0) {
            this.gameState.coins += coinsCollected;
        }

        // 5. Collision detection
        if (this.obstacles.checkCollision(playerHitbox, this.track.currentZ)) {
            if (this.gameState.hasBoard) {
                this.gameState.hasBoard = false; // Board absorbs one hit
            } else {
                this.gameOver();
            }
        }

        // 6. Score
        this.gameState.updateScore(deltaTime);

        // 7. Background & camera
        this.cityBackground.update(this.track.currentZ);
        this.cameraController.update(this.player.x, this.player.y, this.track.currentZ);
    }

    // ===== Render =====

    render() {
        this.sceneManager.render(this.camera);
    }
}
