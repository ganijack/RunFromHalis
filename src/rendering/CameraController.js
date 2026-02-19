/**
 * CameraController.js — Camera creation and position tracking
 * 
 * Creates the perspective camera and provides an update method
 * that follows the player with the configured offset.
 */

import { CONFIG } from '../core/Config.js';

export default class CameraController {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA_FOV,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
    }

    /**
     * Update camera to follow the player.
     * @param {number} playerX  - Player's current X position
     * @param {number} playerY  - Player's current Y position
     * @param {number} currentZ - Current track Z position
     */
    update(playerX, playerY, currentZ) {
        this.camera.position.set(
            playerX,
            playerY + CONFIG.CAMERA_HEIGHT,
            currentZ - CONFIG.CAMERA_DISTANCE
        );

        this.camera.lookAt(
            playerX,
            playerY + 2,
            currentZ + 20
        );
    }
}
