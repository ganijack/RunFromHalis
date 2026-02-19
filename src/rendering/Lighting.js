/**
 * Lighting.js — Scene lighting setup
 * 
 * Adds hemisphere, ambient, moonlight (directional), and
 * warm street-level fill light to create the night atmosphere.
 */

export default class Lighting {
    constructor(scene) {
        // Hemisphere light (sky vs ground tones)
        const hemiLight = new THREE.HemisphereLight(0x334466, 0x111122, 0.6);
        scene.add(hemiLight);

        // Ambient fill
        const ambientLight = new THREE.AmbientLight(0x556688, 0.4);
        scene.add(ambientLight);

        // Moonlight — cool directional from above
        const moonLight = new THREE.DirectionalLight(0x8899CC, 0.5);
        moonLight.position.set(-10, 25, 15);
        scene.add(moonLight);

        // Warm street-level fill
        const fillLight = new THREE.DirectionalLight(0xFFAA66, 0.3);
        fillLight.position.set(5, 3, -5);
        scene.add(fillLight);
    }
}
