/**
 * Coin.js — Coin spawning, animation, and collection
 * 
 * Manages coin entities including line/diagonal spawn patterns,
 * bobbing/spinning animation, and proximity-based collection detection.
 */

import { CONFIG, COLORS } from '../core/Config.js';

export default class CoinManager {
    constructor(scene) {
        this.scene = scene;
        this.coins = [];
        this.nextSpawnZ = 10;
        this.spawnInterval = 5;
    }

    // ===== Coin Creation =====

    createCoin(x, y, z) {
        const geom = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 20);
        const mat = new THREE.MeshStandardMaterial({
            color: COLORS.COIN,
            emissive: COLORS.COIN,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.9
        });
        const coin = new THREE.Mesh(geom, mat);

        coin.rotation.x = Math.PI / 2;
        coin.position.set(x, y, z);
        coin.userData = {
            bobOffset: Math.random() * Math.PI * 2,
            collected: false
        };

        this.coins.push(coin);
        this.scene.add(coin);
    }

    // ===== Spawn Patterns =====

    spawnLine(lane, startZ) {
        const y = 0.5;
        for (let i = 0; i < 5; i++) {
            this.createCoin(CONFIG.LANE_POSITIONS[lane], y, startZ + i * 1.5);
        }
    }

    spawnDiagonal(startZ) {
        const y = 0.5;
        const lanes = [0, 1, 2, 1, 0];
        for (let i = 0; i < lanes.length; i++) {
            this.createCoin(CONFIG.LANE_POSITIONS[lanes[i]], y, startZ + i * 1.5);
        }
    }

    // ===== Update =====

    update(deltaTime, speed, currentZ) {
        // Animate coins (spin + bob)
        const time = Date.now() / 1000;
        this.coins.forEach(coin => {
            if (!coin.userData.collected) {
                coin.rotation.z += deltaTime * 3;
                const bob = Math.sin(time * 2 + coin.userData.bobOffset) * 0.1;
                coin.position.y = 0.5 + bob;
            }
        });

        // Remove coins behind camera
        this.coins = this.coins.filter(coin => {
            if (coin.position.z < currentZ - 20) {
                this.scene.remove(coin);
                return false;
            }
            return true;
        });

        // Spawn new coins ahead
        while (this.nextSpawnZ < currentZ + CONFIG.VISIBLE_DISTANCE) {
            const pattern = Math.random();
            if (pattern < 0.4) {
                const lane = Math.floor(Math.random() * 3);
                this.spawnLine(lane, this.nextSpawnZ);
            } else {
                this.spawnDiagonal(this.nextSpawnZ);
            }
            this.nextSpawnZ += this.spawnInterval + Math.random() * 5;
        }
    }

    // ===== Collection Detection =====

    checkCollection(playerHitbox, currentZ, radius) {
        let collected = 0;
        const collectRadius = radius || 0.8;

        this.coins.forEach(coin => {
            if (coin.userData.collected) return;

            const dx = coin.position.x - playerHitbox.x;
            const dy = coin.position.y - playerHitbox.y;
            const dz = coin.position.z - currentZ;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < collectRadius) {
                coin.userData.collected = true;
                this.scene.remove(coin);
                collected++;
            }
        });

        return collected;
    }

    // ===== Reset =====

    reset() {
        this.coins.forEach(coin => this.scene.remove(coin));
        this.coins = [];
        this.nextSpawnZ = 10;
    }
}
