/**
 * Player.js — Player entity
 * 
 * Manages the 3D player model, running/jumping/sliding states,
 * lane switching with eased interpolation, and hitbox calculation.
 * Uses Three.js global (loaded via CDN).
 */

import { CONFIG, COLORS } from '../core/Config.js';
import { easeOutQuad, easeInQuad, easeOutCubic, lerp } from '../utils/helpers.js';

export default class Player {
    constructor(scene) {
        this.scene = scene;
        this.lane = 1;  // 0 = left, 1 = center, 2 = right
        this.x = CONFIG.LANE_POSITIONS[1];
        this.y = CONFIG.GROUND_Y;
        this.z = 0;

        this.targetLane = 1;
        this.targetX = this.x;

        // Vertical state: RUNNING | JUMPING | SLIDING
        this.state = 'RUNNING';
        this.stateTime = 0;

        this.jumpVelocity = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.isChangingLane = false;
        this.laneChangeTime = 0;

        this.animationTime = 0;

        this.createModel();
    }

    // ===== Model Construction =====

    createModel() {
        this.group = new THREE.Group();

        // PBR materials
        const skinMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_SKIN, roughness: 0.7, metalness: 0.05 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_SHIRT, roughness: 0.5, metalness: 0.1 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_PANTS, roughness: 0.6, metalness: 0.05 });
        const shoesMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_SHOES, roughness: 0.4, metalness: 0.15 });

        // Head
        const headGeom = new THREE.SphereGeometry(0.3, 24, 24);
        this.head = new THREE.Mesh(headGeom, skinMat);
        this.head.position.y = 1.5;
        this.group.add(this.head);

        // Cap / beanie
        const capMat = new THREE.MeshStandardMaterial({ color: 0xE74C3C, roughness: 0.8, metalness: 0.0 });
        const capGeom = new THREE.SphereGeometry(0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cap = new THREE.Mesh(capGeom, capMat);
        cap.position.y = 1.52;
        cap.rotation.x = -0.1;
        this.group.add(cap);

        // Cap brim
        const brimGeom = new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16);
        const brim = new THREE.Mesh(brimGeom, capMat);
        brim.position.set(0, 1.5, 0.15);
        brim.rotation.x = 0.2;
        this.group.add(brim);

        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
        const eyeGeom = new THREE.SphereGeometry(0.06, 8, 8);
        const pupilGeom = new THREE.SphereGeometry(0.035, 8, 8);
        [-0.1, 0.1].forEach(xOff => {
            const eye = new THREE.Mesh(eyeGeom, eyeMat);
            eye.position.set(xOff, 1.55, 0.26);
            this.group.add(eye);
            const pupil = new THREE.Mesh(pupilGeom, pupilMat);
            pupil.position.set(xOff, 1.55, 0.3);
            this.group.add(pupil);
        });

        // Torso
        const torsoGeom = new THREE.BoxGeometry(0.5, 0.8, 0.3);
        this.torso = new THREE.Mesh(torsoGeom, shirtMat);
        this.torso.position.y = 0.9;
        this.group.add(this.torso);

        // Legs
        const legGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
        this.leftLeg = new THREE.Mesh(legGeom, pantsMat);
        this.leftLeg.position.set(-0.15, 0.45, 0);
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeom, pantsMat);
        this.rightLeg.position.set(0.15, 0.45, 0);
        this.group.add(this.rightLeg);

        // Arms
        const armGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 12);
        this.leftArm = new THREE.Mesh(armGeom, shirtMat);
        this.leftArm.position.set(-0.35, 1.0, 0);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeom, shirtMat);
        this.rightArm.position.set(0.35, 1.0, 0);
        this.group.add(this.rightArm);

        // Shoes
        const shoeGeom = new THREE.BoxGeometry(0.15, 0.1, 0.25);
        this.leftShoe = new THREE.Mesh(shoeGeom, shoesMat);
        this.leftShoe.position.set(-0.15, 0.05, 0.05);
        this.group.add(this.leftShoe);

        this.rightShoe = new THREE.Mesh(shoeGeom, shoesMat);
        this.rightShoe.position.set(0.15, 0.05, 0.05);
        this.group.add(this.rightShoe);

        this.group.position.set(this.x, this.y, this.z);
        this.scene.add(this.group);
    }

    // ===== Update Loop =====

    update(deltaTime, currentZ) {
        this.stateTime += deltaTime;
        this.animationTime += deltaTime;
        this.z = currentZ;

        // Lane changes are independent of vertical state
        if (this.isChangingLane) {
            this.processLaneChange(deltaTime);
        }

        // Vertical state machine
        switch (this.state) {
            case 'RUNNING': this.updateRunning(deltaTime); break;
            case 'JUMPING': this.updateJumping(deltaTime); break;
            case 'SLIDING': this.updateSliding(deltaTime); break;
        }

        this.group.position.set(this.x, this.y, this.z);
    }

    updateRunning(deltaTime) {
        const cycle = (this.animationTime % 0.3) / 0.3;
        const bobHeight = Math.sin(cycle * Math.PI * 2) * 0.15;
        this.group.position.y = this.y + bobHeight;

        const armAngle = Math.sin(cycle * Math.PI * 2) * 0.5;
        this.leftArm.rotation.x = armAngle;
        this.rightArm.rotation.x = -armAngle;

        const legAngle = Math.sin(cycle * Math.PI * 2) * 0.3;
        this.leftLeg.rotation.x = legAngle;
        this.rightLeg.rotation.x = -legAngle;
    }

    updateJumping(deltaTime) {
        if (this.stateTime >= CONFIG.JUMP_DURATION / 1000) {
            this.state = 'RUNNING';
            this.y = CONFIG.GROUND_Y;
            this.isJumping = false;
            this.stateTime = 0;
            return;
        }

        const progress = this.stateTime / (CONFIG.JUMP_DURATION / 1000);
        let height;
        if (progress < 0.45) {
            height = easeOutQuad(progress / 0.45) * CONFIG.JUMP_HEIGHT;
        } else {
            height = CONFIG.JUMP_HEIGHT * (1 - easeInQuad((progress - 0.45) / 0.55));
        }

        this.y = CONFIG.GROUND_Y + height;

        // Jump pose
        this.leftArm.rotation.x = -0.5;
        this.rightArm.rotation.x = -0.5;
        this.leftLeg.rotation.x = 0.3;
        this.rightLeg.rotation.x = 0.3;
    }

    updateSliding(deltaTime) {
        if (this.stateTime >= CONFIG.SLIDE_DURATION / 1000) {
            this.state = 'RUNNING';
            this.group.scale.y = 1;
            this.isSliding = false;
            this.stateTime = 0;
            return;
        }

        this.group.scale.y = 0.6;
        this.torso.rotation.x = 0.5;
        this.leftLeg.rotation.x = 0.5;
        this.rightLeg.rotation.x = -0.2;
    }

    // ===== Lane Change =====

    processLaneChange(deltaTime) {
        this.laneChangeTime += deltaTime;

        if (this.laneChangeTime >= CONFIG.LANE_CHANGE_DURATION / 1000) {
            this.lane = this.targetLane;
            this.x = this.targetX;
            this.isChangingLane = false;
            this.laneChangeTime = 0;
            this.group.rotation.z = 0;
            return;
        }

        const progress = this.laneChangeTime / (CONFIG.LANE_CHANGE_DURATION / 1000);
        const easedProgress = easeOutCubic(progress);
        const startX = CONFIG.LANE_POSITIONS[this.lane];
        this.x = lerp(startX, this.targetX, easedProgress);

        // Lean into turn
        const direction = this.targetX > startX ? 1 : -1;
        this.group.rotation.z = Math.sin(progress * Math.PI) * 0.2 * direction;
    }

    // ===== Input Actions =====

    moveLeft() {
        if (this.isChangingLane || this.lane <= 0) return;
        this.targetLane = this.lane - 1;
        this.targetX = CONFIG.LANE_POSITIONS[this.targetLane];
        this.laneChangeTime = 0;
        this.isChangingLane = true;
    }

    moveRight() {
        if (this.isChangingLane || this.lane >= 2) return;
        this.targetLane = this.lane + 1;
        this.targetX = CONFIG.LANE_POSITIONS[this.targetLane];
        this.laneChangeTime = 0;
        this.isChangingLane = true;
    }

    jump() {
        if (this.isJumping || this.isSliding) return;
        this.state = 'JUMPING';
        this.stateTime = 0;
        this.isJumping = true;
    }

    slide() {
        if (this.isJumping || this.isSliding) return;
        this.state = 'SLIDING';
        this.stateTime = 0;
        this.isSliding = true;
    }

    // ===== Hitbox =====

    getHitbox() {
        const width = 0.8;
        const depth = 0.6;
        let height = 1.6;
        if (this.isSliding) height = 0.6;

        return {
            x: this.x,
            y: this.y,
            z: this.z,
            width,
            height,
            depth
        };
    }

    // ===== Reset =====

    reset() {
        this.lane = 1;
        this.targetLane = 1;
        this.x = CONFIG.LANE_POSITIONS[1];
        this.targetX = this.x;
        this.y = CONFIG.GROUND_Y;
        this.z = 0;
        this.state = 'RUNNING';
        this.stateTime = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.isChangingLane = false;
        this.laneChangeTime = 0;
        this.group.scale.y = 1;
        this.group.rotation.z = 0;
        this.torso.rotation.x = 0;
    }
}
