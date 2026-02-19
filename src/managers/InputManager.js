/**
 * InputManager.js — Keyboard and touch input handling
 * 
 * Listens for keyboard and touch swipe events and translates them
 * into player actions (moveLeft, moveRight, jump, slide).
 * Requires a reference to the Game instance to access player and state.
 */

export default class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this.touchStart = null;
        this.inputBuffer = [];

        this.init();
    }

    init() {
        // Keyboard
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Touch
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    handleKeyDown(e) {
        if (this.keys.has(e.code)) return;
        this.keys.add(e.code);

        if (this.game.gameState.state !== 'PLAYING') return;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.game.player.moveRight();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.game.player.moveLeft();
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                this.game.player.jump();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.game.player.slide();
                break;
        }
    }

    handleKeyUp(e) {
        this.keys.delete(e.code);
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 0) return;

        this.touchStart = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.touchStart || this.game.gameState.state !== 'PLAYING') return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - this.touchStart.x;
        const dy = touch.clientY - this.touchStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const elapsed = Date.now() - this.touchStart.time;

        if (distance < 30 || elapsed > 300) {
            this.touchStart = null;
            return;
        }

        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        if (angle >= -45 && angle < 45) {
            // Right swipe → move left in world
            this.game.player.moveLeft();
        } else if (angle >= 45 && angle < 135) {
            // Down swipe
            this.game.player.slide();
        } else if (angle >= -135 && angle < -45) {
            // Up swipe
            this.game.player.jump();
        } else {
            // Left swipe → move right in world
            this.game.player.moveRight();
        }

        this.touchStart = null;
    }
}
