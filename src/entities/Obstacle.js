/**
 * Obstacle.js — Obstacle spawning, management, and collision detection
 * 
 * Handles barriers, trains, and overhead obstacles. Manages spawn patterns
 * with distance-based difficulty scaling and AABB collision detection.
 */

import { CONFIG, COLORS } from '../core/Config.js';

export default class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.nextSpawnZ = 20;
        this.minGap = 10;
        this.maxGap = 30;
    }

    // ===== Obstacle Factories =====

    createBarrier(lane, zPosition) {
        const width = 2.4;
        const height = 1.5;
        const depth = 1.0;

        const geom = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
            color: COLORS.BARRIER, roughness: 0.5, metalness: 0.2,
            emissive: 0xFF3300, emissiveIntensity: 0.15
        });
        const barrier = new THREE.Mesh(geom, mat);

        // Warning stripes
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0xFFFF00, roughness: 0.5,
            emissive: 0xFFFF00, emissiveIntensity: 0.1
        });
        for (let sx = -width / 2 + 0.4; sx < width / 2; sx += 0.8) {
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, height + 0.02, depth + 0.02),
                stripeMat
            );
            stripe.position.x = sx;
            barrier.add(stripe);
        }

        barrier.position.set(CONFIG.LANE_POSITIONS[lane], height / 2, zPosition);
        barrier.userData = {
            type: 'BARRIER', lane, canJump: true,
            width, height, depth
        };

        this.obstacles.push(barrier);
        this.scene.add(barrier);
    }

    createTrain(lane, zPosition) {
        const width = 2.4;
        const height = 3.5;
        const length = 20;

        const geom = new THREE.BoxGeometry(width, height, length);
        const mat = new THREE.MeshStandardMaterial({
            color: COLORS.TRAIN, roughness: 0.4, metalness: 0.5
        });
        const train = new THREE.Mesh(geom, mat);
        train.position.set(CONFIG.LANE_POSITIONS[lane], height / 2, zPosition + length / 2);

        // Glowing windows
        const windowGeom = new THREE.BoxGeometry(0.4, 0.6, 2);
        const windowMat = new THREE.MeshStandardMaterial({
            color: 0xAADDFF, emissive: 0x88BBEE, emissiveIntensity: 0.7,
            roughness: 0.2, metalness: 0.1
        });
        for (let i = -length / 2 + 2; i < length / 2 - 2; i += 4) {
            const win = new THREE.Mesh(windowGeom, windowMat);
            win.position.set(width / 2 + 0.01, 1.5, i);
            train.add(win);
        }

        // Headlight
        const lightGeom = new THREE.SphereGeometry(0.2, 8, 8);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFAA, emissive: 0xFFFF88, emissiveIntensity: 1.0
        });
        const headlight = new THREE.Mesh(lightGeom, lightMat);
        headlight.position.set(0, 1, length / 2 + 0.1);
        train.add(headlight);

        train.userData = {
            type: 'TRAIN', lane, canJump: false,
            width, height, depth: length
        };

        this.obstacles.push(train);
        this.scene.add(train);
    }

    createOverhead(zPosition) {
        const width = CONFIG.TRACK_WIDTH;
        const height = 0.5;
        const depth = 0.5;
        const yPos = 1.5;

        const geom = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
            color: COLORS.OVERHEAD, roughness: 0.6, metalness: 0.3,
            emissive: 0x115511, emissiveIntensity: 0.2
        });
        const overhead = new THREE.Mesh(geom, mat);
        overhead.position.set(0, yPos, zPosition);

        overhead.userData = {
            type: 'OVERHEAD', canSlide: true,
            width, height, depth, yPosition: yPos
        };

        this.obstacles.push(overhead);
        this.scene.add(overhead);
    }

    // ===== Spawn Patterns =====

    spawnPattern(currentZ, distance) {
        const patterns = [
            // Single barrier
            () => {
                const lane = Math.floor(Math.random() * 3);
                this.createBarrier(lane, this.nextSpawnZ);
            },
            // Double barrier
            () => {
                const lane1 = Math.floor(Math.random() * 3);
                let lane2 = Math.floor(Math.random() * 3);
                while (lane2 === lane1) lane2 = Math.floor(Math.random() * 3);
                this.createBarrier(lane1, this.nextSpawnZ);
                this.createBarrier(lane2, this.nextSpawnZ);
            },
            // Overhead
            () => {
                this.createOverhead(this.nextSpawnZ);
            },
            // Train
            () => {
                const lane = Math.floor(Math.random() * 3);
                this.createTrain(lane, this.nextSpawnZ);
            }
        ];

        // Difficulty ramp based on distance
        let availablePatterns = [patterns[0]];
        if (distance > 200) availablePatterns.push(patterns[1]);
        if (distance > 400) availablePatterns.push(patterns[2]);
        if (distance > 600) availablePatterns.push(patterns[3]);

        const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        pattern();

        this.nextSpawnZ += this.minGap + Math.random() * (this.maxGap - this.minGap);
    }

    // ===== Update =====

    update(deltaTime, speed, currentZ, distance) {
        // Remove obstacles behind camera
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.position.z < currentZ - 20) {
                this.scene.remove(obstacle);
                return false;
            }
            return true;
        });

        // Spawn new obstacles ahead
        while (this.nextSpawnZ < currentZ + CONFIG.VISIBLE_DISTANCE) {
            this.spawnPattern(currentZ, distance);
        }
    }

    // ===== Collision Detection =====

    checkCollision(playerHitbox, currentZ) {
        for (let obstacle of this.obstacles) {
            const obsData = obstacle.userData;
            const obsZ = obstacle.position.z;

            // Z overlap
            if (Math.abs(obsZ - currentZ) > obsData.depth / 2 + playerHitbox.depth / 2) {
                continue;
            }

            // X overlap (lane)
            if (Math.abs(obstacle.position.x - playerHitbox.x) > obsData.width / 2 + playerHitbox.width / 2) {
                continue;
            }

            // Y overlap — type-specific
            if (obsData.type === 'OVERHEAD') {
                if (playerHitbox.y + playerHitbox.height > obsData.yPosition) {
                    return true;
                }
            } else if (obsData.type === 'BARRIER') {
                if (playerHitbox.y < obsData.height) {
                    return true;
                }
            } else if (obsData.type === 'TRAIN') {
                if (playerHitbox.y < obsData.height) {
                    return true;
                }
            }
        }
        return false;
    }

    // ===== Reset =====

    reset() {
        this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
        this.obstacles = [];
        this.nextSpawnZ = 20;
    }
}
