/**
 * SaveManager.js — Centralized localStorage persistence
 * 
 * All save/load operations go through this module, making it easy to
 * swap to a backend API or IndexedDB in the future.
 */

const KEYS = {
    HIGH_SCORE: 'subwaySurfersHighScore',
    TOTAL_COINS: 'runFromHalisCoins',
    INVENTORY: 'runFromHalisInventory',
    CHARACTER: 'rfhChar',
    BOARD: 'rfhBoard',
    REWARD_STREAK: 'rfhStreak',
    LAST_CLAIM: 'rfhLastClaim',
    MISSION_COINS: 'missionCoins',
    MISSION_DIST: 'missionDist',
    MISSION_SCORE: 'missionScore'
};

export default class SaveManager {

    // ===== High Score =====
    static loadHighScore() {
        return parseInt(localStorage.getItem(KEYS.HIGH_SCORE) || '0');
    }

    static saveHighScore(score) {
        localStorage.setItem(KEYS.HIGH_SCORE, score.toString());
    }

    // ===== Total Coins (wallet) =====
    static loadTotalCoins() {
        const saved = localStorage.getItem(KEYS.TOTAL_COINS);
        if (saved === null) {
            localStorage.setItem(KEYS.TOTAL_COINS, '500');
            return 500;
        }
        return parseInt(saved);
    }

    static saveTotalCoins(amount) {
        localStorage.setItem(KEYS.TOTAL_COINS, amount.toString());
    }

    // ===== Inventory =====
    static loadInventory() {
        const saved = localStorage.getItem(KEYS.INVENTORY);
        if (saved) return JSON.parse(saved);
        return { board: 0, magnet: 0 };
    }

    static saveInventory(inventory) {
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // ===== Character / Board selection =====
    static loadCharacter() {
        return localStorage.getItem(KEYS.CHARACTER) || 'runner';
    }

    static saveCharacter(id) {
        localStorage.setItem(KEYS.CHARACTER, id);
    }

    static loadBoard() {
        return localStorage.getItem(KEYS.BOARD) || 'classic';
    }

    static saveBoard(id) {
        localStorage.setItem(KEYS.BOARD, id);
    }

    // ===== Daily Rewards =====
    static loadRewardStreak() {
        return parseInt(localStorage.getItem(KEYS.REWARD_STREAK) || '0');
    }

    static saveRewardStreak(streak) {
        localStorage.setItem(KEYS.REWARD_STREAK, streak.toString());
    }

    static loadLastClaim() {
        return localStorage.getItem(KEYS.LAST_CLAIM) || '';
    }

    static saveLastClaim(dateString) {
        localStorage.setItem(KEYS.LAST_CLAIM, dateString);
    }

    // ===== Missions =====
    static loadMissionProgress(key) {
        return parseInt(localStorage.getItem(key) || '0');
    }

    static saveMissionProgress(key, value) {
        const current = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, Math.max(current, value).toString());
    }
}
