/**
 * SceneManager.js — Three.js scene, renderer, and sky background
 * 
 * Initializes the WebGL renderer with PBR tone mapping, creates
 * the scene with fog, and generates the night-sky gradient background.
 */

import { CONFIG, COLORS } from '../core/Config.js';

export default class SceneManager {
    constructor(canvas) {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.setClearColor(COLORS.SKY_TOP);

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(CONFIG.FOG_COLOR, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);

        // Night sky gradient background
        this._createSkyBackground();
    }

    _createSkyBackground() {
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 2;
        skyCanvas.height = 256;
        const skyCtx = skyCanvas.getContext('2d');
        const grad = skyCtx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#050520');
        grad.addColorStop(0.3, '#0a0a3e');
        grad.addColorStop(0.55, '#1a1040');
        grad.addColorStop(0.8, '#2d1530');
        grad.addColorStop(1, '#1a0a20');
        skyCtx.fillStyle = grad;
        skyCtx.fillRect(0, 0, 2, 256);
        this.scene.background = new THREE.CanvasTexture(skyCanvas);
    }

    /** Handle browser resize */
    handleResize(camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /** Render one frame */
    render(camera) {
        this.renderer.render(this.scene, camera);
    }
}
