/**
 * main.js — Application entry point
 * 
 * Imports the Game class and initializes the game when the page loads.
 * This is the single script loaded by index.html.
 */

import Game from './core/Game.js';

window.onload = () => {
    const game = new Game();
};
