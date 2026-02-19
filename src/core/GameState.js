/**
 * GameState.js — Central game state management
 * 
 * Manages the state machine (MENU → PLAYING → PAUSED → GAME_OVER),
 * run-specific data (score, coins, distance), wallet, inventory,
 * and active powerups. All persistence is delegated to SaveManager.
 */

import { CONFIG } from './Config.js';
import SaveManager from '../managers/SaveManager.js';

export default class GameState {
    constructor() {
        // State machine
        this.state = 'MENU'; // MENU | PLAYING | PAUSED | GAME_OVER

        // Per-run stats
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.speed = CONFIG.BASE_SPEED;
        this.startTime = 0;

        // Persistent data (loaded from save)
        this.highScore = SaveManager.loadHighScore();
        this.totalCoins = SaveManager.loadTotalCoins();
        this.inventory = SaveManager.loadInventory();

        // Active powerups for current run
        this.hasBoard = false;
        this.hasMagnet = false;
        this.magnetTimer = 0;
    }

    // ===== Persistence Helpers =====

    saveTotalCoins() {
        SaveManager.saveTotalCoins(this.totalCoins);
    }

    saveInventory() {
        SaveManager.saveInventory(this.inventory);
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            SaveManager.saveHighScore(this.score);
            return true; // new record
        }
        return false;
    }

    // ===== Economy =====

    buyItem(itemId, cost) {
        if (this.totalCoins < cost) return false;
        this.totalCoins -= cost;
        this.inventory[itemId] = (this.inventory[itemId] || 0) + 1;
        this.saveTotalCoins();
        this.saveInventory();
        return true;
    }

    bankCoins() {
        this.totalCoins += this.coins;
        this.saveTotalCoins();
    }

    // ===== Powerups =====

    activateBoard() {
        if (this.inventory.board > 0) {
            this.inventory.board--;
            this.saveInventory();
            this.hasBoard = true;
            return true;
        }
        return false;
    }

    activateMagnet() {
        if (this.inventory.magnet > 0) {
            this.inventory.magnet--;
            this.saveInventory();
            this.hasMagnet = true;
            this.magnetTimer = 10;
            return true;
        }
        return false;
    }

    // ===== Scoring & Speed =====

    updateScore(deltaTime) {
        const distanceInMeters = this.distance / 10;
        this.score = Math.floor(
            this.coins * CONFIG.COIN_VALUE +
            distanceInMeters * CONFIG.DISTANCE_SCORE_MULTIPLIER
        );
    }

    updateSpeed() {
        this.speed = Math.min(
            CONFIG.MAX_SPEED,
            CONFIG.BASE_SPEED + (this.distance / 1000) * CONFIG.ACCELERATION
        );
    }

    // ===== Reset (new run) =====

    reset() {
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.speed = CONFIG.BASE_SPEED;
        this.startTime = Date.now();
        this.hasBoard = false;
        this.hasMagnet = false;
        this.magnetTimer = 0;
    }
}
