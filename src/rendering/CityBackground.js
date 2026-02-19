/**
 * CityBackground.js — Procedural city skyline
 * 
 * Generates layered buildings on both sides of the track with
 * lit/unlit windows. Buildings recycle as the camera moves forward.
 */

import { COLORS } from '../core/Config.js';

export default class CityBackground {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.totalSpan = 200;

        // Shared materials (created once, reused for every building)
        this.buildMats = COLORS.BUILDING.map(c =>
            new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.15 })
        );
        this.winMat = new THREE.MeshStandardMaterial({
            color: 0xFFE4AA, emissive: 0xFFD699, emissiveIntensity: 0.9, roughness: 0.3
        });
        this.winDarkMat = new THREE.MeshStandardMaterial({ color: 0x151525, roughness: 0.9 });

        this.createCity();
    }

    createCity() {
        const layers = [
            { dist: 10, count: 12, hMin: 6, hMax: 18, wMin: 2.5, wMax: 5 },
            { dist: 18, count: 8, hMin: 12, hMax: 30, wMin: 4, wMax: 7 },
            { dist: 28, count: 6, hMin: 18, hMax: 45, wMin: 5, wMax: 9 }
        ];

        [-1, 1].forEach(side => {
            layers.forEach(layer => {
                for (let i = 0; i < layer.count; i++) {
                    const w = layer.wMin + Math.random() * (layer.wMax - layer.wMin);
                    const h = layer.hMin + Math.random() * (layer.hMax - layer.hMin);
                    const d = 3 + Math.random() * 4;
                    const bld = this._building(w, h, d);
                    const x = side * (layer.dist + Math.random() * 4);
                    const z = (i / layer.count) * this.totalSpan + Math.random() * 8;
                    bld.position.set(x, h / 2, z);
                    bld.userData.baseZ = z;
                    this.scene.add(bld);
                    this.buildings.push(bld);
                }
            });
        });
    }

    _building(w, h, d) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            this.buildMats[Math.floor(Math.random() * this.buildMats.length)]
        );
        g.add(body);

        // Windows on front face
        const wsY = 1.3, wsX = 1.0, ws = 0.35;
        const winGeom = new THREE.PlaneGeometry(ws, ws * 1.3);
        for (let y = -h / 2 + 2; y < h / 2 - 1; y += wsY) {
            for (let x = -w / 2 + 0.6; x < w / 2 - 0.4; x += wsX) {
                const lit = Math.random() > 0.35;
                const win = new THREE.Mesh(winGeom, lit ? this.winMat : this.winDarkMat);
                win.position.set(x, y, d / 2 + 0.02);
                g.add(win);
            }
        }
        return g;
    }

    /** Recycle buildings to keep them around the camera */
    update(camZ) {
        this.buildings.forEach(b => {
            while (b.position.z < camZ - 30) b.position.z += this.totalSpan;
            while (b.position.z > camZ + this.totalSpan + 30) b.position.z -= this.totalSpan;
        });
    }
}
