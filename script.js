import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Seamless background music – robust fallback for browser autoplay policies
const bgm = document.getElementById('bgm');
let audioStarted = false;

function initAudio() {
    if (audioStarted) return;

    // Set to 10 seconds if metadata is loaded, or wait for it
    if (bgm.readyState >= 1) {
        if (bgm.currentTime < 10) bgm.currentTime = 10;
    } else {
        bgm.addEventListener('loadedmetadata', () => {
            bgm.currentTime = 10;
        }, { once: true });
    }

    const playPromise = bgm.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            audioStarted = true;
            ['click', 'touchstart', 'scroll', 'keydown', 'wheel'].forEach(evt => {
                window.removeEventListener(evt, initAudio, { capture: true });
            });
        }).catch(err => {
            console.log("Audio play requires user interaction:", err);
        });
    }
}

// Bind to all possible interactions to seamlessly unlock audio
['click', 'touchstart', 'scroll', 'keydown', 'wheel'].forEach(evt => {
    window.addEventListener(evt, initAudio, { capture: true, passive: true });
});

// Try to autoplay immediately (will likely be blocked until gesture)
initAudio();

// Custom loop: 10s to 45s
bgm.addEventListener('timeupdate', () => {
    if (bgm.currentTime >= 45) {
        bgm.currentTime = 10;
        bgm.play().catch(e => console.log('Loop play blocked:', e));
    }
});

let scrollY = 0;
let targetScrollY = 0;

window.addEventListener('scroll', () => { targetScrollY = window.scrollY; });
function lerp(a, b, t) { return a + (b - a) * t; }

const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();

// Soft-medium pastel gradient sky
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 2;
skyCanvas.height = 512;
const skyCtx = skyCanvas.getContext('2d');
const grad = skyCtx.createLinearGradient(0, 0, 0, 512);
grad.addColorStop(0, '#fce4ec');     // Blush pink top
grad.addColorStop(0.15, '#f8bbd0'); // Soft rose
grad.addColorStop(0.3, '#ffcdd2');  // Light coral
grad.addColorStop(0.45, '#ffe0b2'); // Warm peach
grad.addColorStop(0.55, '#fff3e0'); // Soft cream
grad.addColorStop(0.7, '#ffcdd2');  // Coral again
grad.addColorStop(0.85, '#f3e5f5'); // Light lavender
grad.addColorStop(1, '#e1bee7');    // Lavender bottom
skyCtx.fillStyle = grad;
skyCtx.fillRect(0, 0, 2, 512);
const skyTexture = new THREE.CanvasTexture(skyCanvas);
scene.background = skyTexture;
scene.fog = new THREE.FogExp2('#ffe8d6', 0.005);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 3, 20);

// Soft bloom for warmth
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.4;
bloomPass.strength = 0.6;
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Warm Indian lighting
const ambientLight = new THREE.AmbientLight('#fff5eb', 0.9);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight('#ffcc80', 1.2);
sunLight.position.set(5, 15, 10);
scene.add(sunLight);
const warmPoint = new THREE.PointLight('#ff9933', 2, 60);
warmPoint.position.set(0, 8, 15);
scene.add(warmPoint);

const objectsToAnimate = [];

// ---- INDIAN MANDAPAM ARCH ----
function createArch(zPos) {
    const group = new THREE.Group();

    // Saffron pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#ff9933', metalness: 0.4, roughness: 0.3 });
    const pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 10, 32);
    const pL = new THREE.Mesh(pillarGeo, pillarMat);
    pL.position.set(-7, 5, 0);
    const pR = new THREE.Mesh(pillarGeo, pillarMat);
    pR.position.set(7, 5, 0);

    // Pillar tops (kalash shape = sphere on cylinder)
    const kalashMat = new THREE.MeshStandardMaterial({ color: '#d4145a', metalness: 0.5, roughness: 0.2 });
    const kalashGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const kL = new THREE.Mesh(kalashGeo, kalashMat);
    kL.position.set(-7, 10.5, 0);
    const kR = new THREE.Mesh(kalashGeo, kalashMat);
    kR.position.set(7, 10.5, 0);

    // Main arch (torus)
    const archMat = new THREE.MeshStandardMaterial({ color: '#e8725a', metalness: 0.3, roughness: 0.4 });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(7, 0.5, 32, 64, Math.PI), archMat);
    arch.position.y = 10;

    // Inner decorative ring (marigold orange glow)
    const marigoldMat = new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff9933', emissiveIntensity: 0.6 });
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.12, 16, 64, Math.PI), marigoldMat);
    innerRing.position.y = 10;

    // Hanging lotus decoration (torus knot)
    const lotusMat = new THREE.MeshStandardMaterial({ color: '#ff69b4', emissive: '#ff69b4', emissiveIntensity: 0.4 });
    const lotus = new THREE.Mesh(new THREE.TorusKnotGeometry(1.5, 0.25, 100, 16), lotusMat);
    lotus.position.set(0, 12, 0);
    objectsToAnimate.push({ mesh: lotus, type: 'lotus' });

    group.add(pL, pR, kL, kR, arch, innerRing, lotus);
    group.position.z = zPos;
    scene.add(group);
}

// ---- MARIGOLD GARLAND STRING ----
function createMarigoldString(zStart, zEnd) {
    const count = 30;
    for (let i = 0; i < count; i++) {
        const t = i / count;
        const z = zStart + (zEnd - zStart) * t;
        const side = (i % 2 === 0) ? -1 : 1;
        const x = side * (6 + Math.sin(t * Math.PI * 4) * 1.5);
        const y = 8 + Math.sin(t * Math.PI * 6) * 1.5;

        const colors = ['#ff9933', '#ffb347', '#ffd700', '#ff6347'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mat);
        flower.position.set(x, y, z);
        scene.add(flower);
    }
}

// ---- 3D DEEPAM (oil lamp) ----
function createDeepam(x, z) {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({ color: '#cd7f32', metalness: 0.8, roughness: 0.15 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.25, 16), goldMat);
    base.position.y = 0.12;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 1, 16), goldMat);
    stem.position.y = 0.75;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.12, 0.25, 16), goldMat);
    cup.position.y = 1.4;

    const flameMat = new THREE.MeshStandardMaterial({ color: '#ffeb3b', emissive: '#ff6600', emissiveIntensity: 2.5 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 8), flameMat);
    flame.position.y = 1.8;
    objectsToAnimate.push({ mesh: flame, type: 'flame', speed: Math.random() * 5 + 4 });

    // Warm point light per deepam
    const light = new THREE.PointLight('#ff9933', 0.8, 8);
    light.position.y = 2;

    group.add(base, stem, cup, flame, light);
    group.position.set(x, 0, z);
    scene.add(group);
}

// ---- RANGOLI FLOOR PATTERN ----
function createRangoli(z) {
    const colors = ['#d4145a', '#ff9933', '#138808', '#ffeb3b']; // Indian tricolor + gold
    for (let r = 0; r < 4; r++) {
        const radius = 1.5 + r * 1.2;
        const dots = 12 + r * 6;
        const mat = new THREE.MeshStandardMaterial({ color: colors[r], emissive: colors[r], emissiveIntensity: 0.3 });
        for (let d = 0; d < dots; d++) {
            const angle = (d / dots) * Math.PI * 2;
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat);
            dot.position.set(Math.cos(angle) * radius, 0.05, z + Math.sin(angle) * radius);
            scene.add(dot);
        }
    }
}

// ---- BUILD THE WORLD ----
for (let i = 0; i < 25; i++) {
    const z = 15 - i * 18;
    createArch(z);
    if (i > 0) {
        createDeepam(-5, z + 9);
        createDeepam(5, z + 9);
    }
    if (i % 3 === 0) {
        createRangoli(z);
    }
}

// Marigold garlands along the corridor
createMarigoldString(15, -200);
createMarigoldString(-200, -430);

// Floating petals
const petalColors = ['#ff9999', '#ffcccc', '#ff69b4', '#fff', '#ffb347'];
for (let i = 0; i < 250; i++) {
    const color = petalColors[Math.floor(Math.random() * petalColors.length)];
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
    const size = Math.random() * 0.15 + 0.05;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(size, 6, 6), mat);
    petal.position.set((Math.random() - 0.5) * 35, Math.random() * 18, 20 - Math.random() * 460);
    scene.add(petal);
    objectsToAnimate.push({ mesh: petal, type: 'petal', angle: Math.random() * Math.PI * 2, drift: Math.random() * 2 + 1 });
}

// 3D Flower clusters scattered in background
function createFlower(x, y, z, scale) {
    const group = new THREE.Group();
    const centerMat = new THREE.MeshStandardMaterial({ color: '#ffeb3b', emissive: '#ffcc00', emissiveIntensity: 0.3 });
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 12, 12), centerMat);
    group.add(center);
    const petalMats = [
        new THREE.MeshStandardMaterial({ color: '#ff69b4', emissive: '#ff69b4', emissiveIntensity: 0.15 }),
        new THREE.MeshStandardMaterial({ color: '#ff9933', emissive: '#ff9933', emissiveIntensity: 0.15 }),
        new THREE.MeshStandardMaterial({ color: '#f48fb1', emissive: '#f48fb1', emissiveIntensity: 0.15 }),
        new THREE.MeshStandardMaterial({ color: '#e91e63', emissive: '#e91e63', emissiveIntensity: 0.15 }),
    ];
    for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const pGeo = new THREE.SphereGeometry(0.22 * scale, 8, 8);
        pGeo.scale(1, 0.5, 1); // Flatten into petal shape
        const pm = new THREE.Mesh(pGeo, petalMats[p % petalMats.length]);
        pm.position.set(Math.cos(angle) * 0.5 * scale, 0, Math.sin(angle) * 0.5 * scale);
        group.add(pm);
    }
    group.position.set(x, y, z);
    group.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.5);
    scene.add(group);
    objectsToAnimate.push({ mesh: group, type: 'flower', rotSpeed: Math.random() * 0.005 + 0.002 });
}

// Scatter flowers throughout the corridor
for (let i = 0; i < 80; i++) {
    const x = (Math.random() - 0.5) * 30;
    const y = Math.random() * 14 + 1;
    const z = 15 - Math.random() * 460;
    const scale = Math.random() * 1.5 + 0.5;
    createFlower(x, y, z, scale);
}

// ---- TORAN (door garland) at entrance ----
function createToran(zPos) {
    const toranGroup = new THREE.Group();
    const beadCount = 20;
    for (let i = 0; i < beadCount; i++) {
        const t = i / (beadCount - 1);
        const x = -7 + 14 * t;
        const sag = Math.sin(t * Math.PI) * 2.5;
        const y = 10.5 - sag;
        const colors = ['#ff9933', '#d4145a', '#138808', '#ffeb3b', '#ff69b4'];
        const color = colors[i % colors.length];
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 });
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat);
        bead.position.set(x, y, 0);
        toranGroup.add(bead);
        // Hanging leaf/mango shape on some beads
        if (i % 3 === 0) {
            const leafMat = new THREE.MeshStandardMaterial({ color: '#138808', emissive: '#138808', emissiveIntensity: 0.2 });
            const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), leafMat);
            leaf.position.set(x, y - 0.4, 0);
            leaf.rotation.x = Math.PI;
            toranGroup.add(leaf);
        }
    }
    toranGroup.position.z = zPos;
    scene.add(toranGroup);
}

// Add torans to every other arch near the start
for (let i = 0; i < 6; i++) {
    createToran(15 - i * 18);
}

// ---- FLOATING SPARKLES near intro ----
const sparkleMat = new THREE.MeshStandardMaterial({ color: '#ffd700', emissive: '#ffd700', emissiveIntensity: 1.5 });
for (let i = 0; i < 120; i++) {
    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 6, 6), sparkleMat);
    sparkle.position.set(
        (Math.random() - 0.5) * 25,
        Math.random() * 16,
        20 - Math.random() * 80
    );
    scene.add(sparkle);
    objectsToAnimate.push({ mesh: sparkle, type: 'sparkle', speed: Math.random() * 3 + 1, baseY: sparkle.position.y });
}

// ---- LOTUS BOWLS at pillar bases near start ----
function createLotusBowl(x, z) {
    const bowlGroup = new THREE.Group();
    const bowlMat = new THREE.MeshStandardMaterial({ color: '#cd7f32', metalness: 0.7, roughness: 0.2 });
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), bowlMat);
    bowl.rotation.x = Math.PI;
    bowl.position.y = 0.4;
    bowlGroup.add(bowl);

    // Water surface
    const waterMat = new THREE.MeshStandardMaterial({ color: '#4fc3f7', emissive: '#0288d1', emissiveIntensity: 0.2, transparent: true, opacity: 0.7 });
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.75, 16), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.35;
    bowlGroup.add(water);

    // Floating lotus
    const lotusPetalMat = new THREE.MeshStandardMaterial({ color: '#ff69b4', emissive: '#ff69b4', emissiveIntensity: 0.3 });
    for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const petalGeo = new THREE.SphereGeometry(0.15, 6, 6);
        petalGeo.scale(1, 0.3, 1);
        const petal = new THREE.Mesh(petalGeo, lotusPetalMat);
        petal.position.set(Math.cos(angle) * 0.25, 0.42, Math.sin(angle) * 0.25);
        bowlGroup.add(petal);
    }
    const centerMat = new THREE.MeshStandardMaterial({ color: '#ffeb3b', emissive: '#ffcc00', emissiveIntensity: 0.5 });
    const lotusCenter = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), centerMat);
    lotusCenter.position.y = 0.45;
    bowlGroup.add(lotusCenter);

    bowlGroup.position.set(x, 0, z);
    scene.add(bowlGroup);
}

// Place lotus bowls near starting arches
for (let i = 0; i < 4; i++) {
    const z = 15 - i * 18;
    createLotusBowl(-3, z + 5);
    createLotusBowl(3, z + 5);
}

// ---- RESIZE ----
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// ---- ANIMATION LOOP ----
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    scrollY = lerp(scrollY, targetScrollY, 0.07);

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = scrollY / maxScroll;

    camera.position.z = 20 - (progress * 450);
    camera.position.y = 4 + Math.sin(progress * Math.PI * 20) * 0.6;
    camera.position.x = Math.sin(progress * Math.PI * 8) * 1.5;
    camera.rotation.z = Math.sin(progress * Math.PI * 12) * 0.03;

    // Animate objects
    objectsToAnimate.forEach(obj => {
        if (obj.type === 'petal') {
            obj.mesh.position.y += Math.sin(t * obj.drift + obj.angle) * 0.008;
            obj.mesh.position.x += Math.cos(t * 0.5 + obj.angle) * 0.003;
        } else if (obj.type === 'lotus') {
            obj.mesh.rotation.y += 0.015;
            obj.mesh.rotation.x += 0.008;
        } else if (obj.type === 'flame') {
            const s = 1 + Math.sin(t * obj.speed) * 0.15;
            obj.mesh.scale.set(s, s, s);
        } else if (obj.type === 'flower') {
            obj.mesh.rotation.y += obj.rotSpeed;
        } else if (obj.type === 'sparkle') {
            obj.mesh.position.y = obj.baseY + Math.sin(t * obj.speed) * 0.5;
            obj.mesh.scale.setScalar(0.6 + Math.sin(t * obj.speed * 2) * 0.4);
        }
    });

    // UI scene transitions
    const intro = document.getElementById('scene-intro');
    const story = document.getElementById('scene-story');
    const family = document.getElementById('scene-family');
    const details = document.getElementById('scene-details');

    if (progress < 0.15) {
        intro.style.display = 'flex';
        intro.style.opacity = 1 - (progress / 0.15);
        intro.style.transform = `scale(${1 + progress})`;
    } else {
        intro.style.display = 'none';
    }

    if (progress >= 0.15 && progress < 0.4) {
        story.style.display = 'flex';
        let fade = 1;
        if (progress < 0.2) fade = (progress - 0.15) / 0.05;
        if (progress > 0.35) fade = 1 - ((progress - 0.35) / 0.05);
        story.style.opacity = fade;
        story.style.transform = `translateY(${(1 - fade) * 40}px)`;
    } else {
        story.style.display = 'none';
    }

    if (progress >= 0.4 && progress < 0.65) {
        family.style.display = 'flex';
        let fade = 1;
        if (progress < 0.45) fade = (progress - 0.4) / 0.05;
        if (progress > 0.6) fade = 1 - ((progress - 0.6) / 0.05);
        family.style.opacity = fade;
        family.style.transform = `translateY(${(1 - fade) * 40}px)`;
    } else {
        family.style.display = 'none';
    }

    if (progress >= 0.65) {
        details.style.display = 'flex';
        const rawP = Math.min(1, Math.max(0, (progress - 0.65) / 0.15));
        details.style.opacity = rawP;
        details.style.transform = `translateY(${(1 - rawP) * 50}px)`;
    } else {
        details.style.display = 'none';
    }

    composer.render();
}
animate();
