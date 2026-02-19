/**
 * Train.js — Track/rail system
 * 
 * Generates and recycles infinite track segments including ground,
 * lane markings, rails, ties, and side walls.
 * (Named "Train" per the requested file structure; contains TrackSystem.)
 */

import { CONFIG, COLORS } from '../core/Config.js';

export default class TrackSystem {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.segmentLength = 50;
        this.currentZ = 0;

        this.createInitialSegments();
    }

    createInitialSegments() {
        for (let i = 0; i < 4; i++) {
            this.createSegment(i * this.segmentLength);
        }
    }

    createSegment(zPosition) {
        const segment = new THREE.Group();

        // Ground — dark asphalt
        const groundGeom = new THREE.PlaneGeometry(CONFIG.TRACK_WIDTH, this.segmentLength);
        const groundMat = new THREE.MeshStandardMaterial({
            color: COLORS.GROUND, roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.z = zPosition + this.segmentLength / 2;
        segment.add(ground);

        // Lane markings (white dashed lines)
        const markingMat = new THREE.MeshStandardMaterial({
            color: 0xCCCCCC, roughness: 0.5,
            emissive: 0x333333, emissiveIntensity: 0.2
        });
        for (let lane = 0; lane < 2; lane++) {
            const lx = (CONFIG.LANE_POSITIONS[lane] + CONFIG.LANE_POSITIONS[lane + 1]) / 2;
            for (let mz = 0; mz < this.segmentLength; mz += 4) {
                const markGeom = new THREE.PlaneGeometry(0.12, 1.5);
                const mark = new THREE.Mesh(markGeom, markingMat);
                mark.rotation.x = -Math.PI / 2;
                mark.position.set(lx, 0.02, zPosition + mz);
                segment.add(mark);
            }
        }

        // Rails — metallic
        for (let i = 0; i < 3; i++) {
            const railGeom = new THREE.BoxGeometry(0.1, 0.1, this.segmentLength);
            const railMat = new THREE.MeshStandardMaterial({
                color: COLORS.RAIL, roughness: 0.3, metalness: 0.8
            });
            const rail = new THREE.Mesh(railGeom, railMat);
            rail.position.set(CONFIG.LANE_POSITIONS[i], 0.05, zPosition + this.segmentLength / 2);
            segment.add(rail);
        }

        // Ties (cross planks)
        const tieMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a, roughness: 0.85, metalness: 0.1
        });
        for (let z = 0; z < this.segmentLength; z += 2) {
            const tieGeom = new THREE.BoxGeometry(CONFIG.TRACK_WIDTH * 0.9, 0.15, 0.3);
            const tie = new THREE.Mesh(tieGeom, tieMat);
            tie.position.set(0, 0.02, zPosition + z);
            segment.add(tie);
        }

        // Side walls — concrete urban walls
        const wallHeight = 4;
        const wallGeom = new THREE.BoxGeometry(0.5, wallHeight, this.segmentLength);
        const wallMat = new THREE.MeshStandardMaterial({
            color: COLORS.WALL, roughness: 0.9, metalness: 0.05
        });

        const leftWall = new THREE.Mesh(wallGeom, wallMat);
        leftWall.position.set(-CONFIG.TRACK_WIDTH / 2 - 0.5, wallHeight / 2, zPosition + this.segmentLength / 2);
        segment.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeom, wallMat);
        rightWall.position.set(CONFIG.TRACK_WIDTH / 2 + 0.5, wallHeight / 2, zPosition + this.segmentLength / 2);
        segment.add(rightWall);

        segment.userData.zPosition = zPosition;
        this.segments.push(segment);
        this.scene.add(segment);
    }

    // ===== Update (recycle segments) =====

    update(deltaTime, speed) {
        this.currentZ += speed * deltaTime;

        // Remove segments behind camera
        this.segments = this.segments.filter(segment => {
            if (segment.userData.zPosition < this.currentZ - this.segmentLength) {
                this.scene.remove(segment);
                return false;
            }
            return true;
        });

        // Add segments ahead
        const furthestZ = Math.max(...this.segments.map(s => s.userData.zPosition));
        if (furthestZ < this.currentZ + CONFIG.VISIBLE_DISTANCE) {
            this.createSegment(furthestZ + this.segmentLength);
        }
    }

    // ===== Reset =====

    reset() {
        this.segments.forEach(segment => this.scene.remove(segment));
        this.segments = [];
        this.currentZ = 0;
        this.createInitialSegments();
    }
}
