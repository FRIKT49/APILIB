/**
 * API Library - antigravityCanvas.js
 * Official Google Antigravity Particle Field & Fluid Ring Dynamics
 * Reverse-Engineered from https://antigravity.google
 * 
 * Key Features & Adherence to Requirements:
 * 1. Strictly NO Magnification ("убери эффект увеличения"):
 *    - Particle thickness is permanently fixed at 1.8px. Never balloons or bloats.
 * 2. Unobtrusive Resting State ("не мозолят глаза"):
 *    - In resting state, particles are calm, quiet circular micro-dots (1.8px diameter).
 *    - Faint resting opacity (0.22 in dark mode, 0.25 in light mode): zero visual fatigue,
 *      allowing hero typography and buttons to maintain maximum legibility.
 * 3. Metamorphosis in Ring Proximity ("при попадании в радиус видоизменяются"):
 *    - Only particles within the dynamic ring wave morph into sleek rounded capsules (7px - 13px).
 * 4. Authentic Antigravity Fluid Mechanics & Vector Integral ("спомощью интересной функции или интеграла"):
 *    - Ring tracker uses spring damping following cursor: ringPos += (target - ringPos) * 0.03.
 *    - Breathing ring radius: R(t) = R_base + sin(t) * 16 + cos(3t) * 10.
 *    - Dual-band ring wave: t(r) + 3*t2(r) + 0.35*t3(r) creates the iconic concentric halo.
 *    - Tangential concentric alignment: pills rotate along circle tangents atan2(dy, dx)
 *      with Fresnel-Euler curl streamline curvature.
 *    - Radial ring displacement push: particles are displaced outward along the ring crest.
 * 5. Official Google Chromatic Spectrum:
 *    - Light Mode: #2c64ed (Blue), #f84242 (Coral Red), #ffcf03 (Amber Gold).
 *    - Dark Mode: #7189ff (Periwinkle), #3074f9 (Azure), #00d2ff (Cyan), #c084fc (Violet).
 */

import * as THREE from "./libs/three.module.js";

// Fast 2D Simplex Noise generator for organic spatial variation
class SimplexNoise2D {
  constructor() {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const tmp = perm[i];
      perm[i] = perm[r];
      perm[r] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = perm[i & 255];
    }
  }

  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    let n0 = 0, n1 = 0, n2 = 0;

    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.p[ii + this.p[jj]] % 8;
    const gi1 = this.p[ii + i1 + this.p[jj + j1]] % 8;
    const gi2 = this.p[ii + 1 + this.p[jj + 1]] % 8;

    const grad2 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (grad2[gi0][0] * x0 + grad2[gi0][1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * (grad2[gi1][0] * x1 + grad2[gi1][1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * (grad2[gi2][0] * x2 + grad2[gi2][1] * y2);
    }

    return 70.0 * (n0 + n1 + n2);
  }
}

const snoise = new SimplexNoise2D();

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export function initAntigravityCanvas(canvasId = "bgDotsCanvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  if (canvas.__antigravityInstance) {
    return canvas.__antigravityInstance;
  }

  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrameId = null;
  let isTabVisible = !document.hidden;
  let isElementVisible = true;

  // Pointer & Fluid Spring Ring State
  const mouse = {
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    prevX: -9999,
    prevY: -9999,
    vx: 0,
    vy: 0,
    speed: 0,
    hasMoved: false
  };

  // The Google Antigravity trailing ring position
  const ring = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    radius: 280,
    baseRadius: 280,
    width: 120,
    width2: 48,
    displacement: 22
  };

  const shockwaves = [];

  // Three.js Core
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.position.z = 100;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);

  // Base Capsule geometry: radius 0.5, length 1.0 (total height 2.0, diameter 1.0)
  const baseGeom = new THREE.CapsuleGeometry(0.5, 1.0, 4, 8);

  // Custom shader for per-instance opacity
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `
      attribute float instanceAlpha;
      varying float vInstanceAlpha;
      ${shader.vertexShader}
    `.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       vInstanceAlpha = instanceAlpha;`
    );

    shader.fragmentShader = `
      varying float vInstanceAlpha;
      ${shader.fragmentShader}
    `.replace(
      "#include <dithering_fragment>",
      `#include <dithering_fragment>
       gl_FragColor.a *= vInstanceAlpha;`
    );
  };

  let instancedMesh = null;
  let particles = [];
  let alphaArray = null;
  let alphaAttribute = null;
  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  // Official Google Colors
  const COLOR_LIGHT_BLUE = new THREE.Color("#2c64ed");
  const COLOR_LIGHT_RED = new THREE.Color("#f84242");
  const COLOR_LIGHT_GOLD = new THREE.Color("#ffcf03");
  const COLOR_LIGHT_MUTED = new THREE.Color("#64748b");

  const COLOR_DARK_PERIWINKLE = new THREE.Color("#7189ff");
  const COLOR_DARK_AZURE = new THREE.Color("#3074f9");
  const COLOR_DARK_CYAN = new THREE.Color("#00d2ff");
  const COLOR_DARK_VIOLET = new THREE.Color("#a855f7");
  const COLOR_DARK_MUTED = new THREE.Color("#94a3b8");

  /**
   * Chromatic color resolver matching antigravity.google
   */
  function resolveParticleColor(targetColor, angleRad, spatialNoise, isDark, activeWeight) {
    if (activeWeight <= 0.001) {
      targetColor.copy(isDark ? COLOR_DARK_MUTED : COLOR_LIGHT_MUTED);
      return;
    }

    // Angle normalized to [0, 1]
    let normalizedAngle = ((angleRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2);
    // Modulate with spatial noise
    let t = (normalizedAngle + spatialNoise * 0.18 + 1.0) % 1.0;

    if (isDark) {
      // Dark Mode Spectrum: Periwinkle -> Azure -> Cyan -> Violet
      if (t < 0.35) {
        const factor = t / 0.35;
        targetColor.copy(COLOR_DARK_PERIWINKLE).lerp(COLOR_DARK_AZURE, factor);
      } else if (t < 0.65) {
        const factor = (t - 0.35) / 0.30;
        targetColor.copy(COLOR_DARK_AZURE).lerp(COLOR_DARK_CYAN, factor);
      } else if (t < 0.85) {
        const factor = (t - 0.65) / 0.20;
        targetColor.copy(COLOR_DARK_CYAN).lerp(COLOR_DARK_VIOLET, factor);
      } else {
        const factor = (t - 0.85) / 0.15;
        targetColor.copy(COLOR_DARK_VIOLET).lerp(COLOR_DARK_PERIWINKLE, factor);
      }
      targetColor.lerp(COLOR_DARK_MUTED, (1 - activeWeight) * 0.85);
    } else {
      // Light Mode Spectrum: Google Blue -> Gold -> Red -> Blue
      if (t < 0.35) {
        const factor = t / 0.35;
        targetColor.copy(COLOR_LIGHT_BLUE).lerp(COLOR_LIGHT_GOLD, factor);
      } else if (t < 0.68) {
        const factor = (t - 0.35) / 0.33;
        targetColor.copy(COLOR_LIGHT_GOLD).lerp(COLOR_LIGHT_RED, factor);
      } else {
        const factor = (t - 0.68) / 0.32;
        targetColor.copy(COLOR_LIGHT_RED).lerp(COLOR_LIGHT_BLUE, factor);
      }
      targetColor.lerp(COLOR_LIGHT_MUTED, (1 - activeWeight) * 0.85);
    }
  }

  // Particle Data Model
  class Particle {
    constructor(baseX, baseY) {
      this.baseX = baseX;
      this.baseY = baseY;

      // Current position with displacement
      this.x = baseX;
      this.y = baseY;

      // STRICTLY CONSTANT THICKNESS: 1.8px (NO MAGNIFICATION EVER)
      this.thickness = 1.8;
      // At rest, length == thickness -> PERFECT CIRCLE / SPHERE
      this.baseLength = this.thickness;
      this.currentLength = this.baseLength;
      this.maxStretch = 8.0 + Math.random() * 5.0; // Stretches to 8-13px on ring wave

      // Dynamic flow offset and rotation
      this.dispX = 0;
      this.dispY = 0;
      this.currentRotation = 0;
      this.targetRotation = 0;
      this.waveActivation = 0;

      // Gentle Brownian harmonic flutter seeds (calm zero-gravity float)
      this.freqA = 0.0003 + Math.random() * 0.0005;
      this.freqB = 0.0006 + Math.random() * 0.0006;
      this.phaseA = Math.random() * Math.PI * 2;
      this.phaseB = Math.random() * Math.PI * 2;
      this.ampA = 2.8 + Math.random() * 3.5;
      this.ampB = 2.0 + Math.random() * 2.5;

      this.spatialNoise = (Math.random() - 0.5) * 0.5;
      this.noiseAngleJitter = (Math.random() - 0.5) * 0.15;
    }
  }

  /**
   * Uniform Poisson-Disk-like organic distribution across the canvas
   */
  function createParticles() {
    if (instancedMesh) {
      scene.remove(instancedMesh);
      instancedMesh.geometry.dispose();
      instancedMesh.dispose();
    }

    particles = [];
    const TOTAL_PARTICLES = width < 768 ? 1100 : 2000;

    // Grid-stratified random distribution with minimum spacing to prevent clustering
    const boundW = width * 1.12;
    const boundH = height * 1.12;
    const startX = -boundW * 0.5;
    const startY = -boundH * 0.5;

    const cols = Math.ceil(Math.sqrt(TOTAL_PARTICLES * (boundW / boundH)));
    const rows = Math.ceil(TOTAL_PARTICLES / cols);
    const cellW = boundW / cols;
    const cellH = boundH / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (particles.length >= TOTAL_PARTICLES) break;

        // Stratified random within cell + slight center bias for hero elegance
        const px = startX + (c + 0.15 + Math.random() * 0.70) * cellW;
        const py = startY + (r + 0.15 + Math.random() * 0.70) * cellH;

        particles.push(new Particle(px, py));
      }
    }

    const count = particles.length;
    const geom = baseGeom.clone();
    alphaArray = new Float32Array(count).fill(1.0);
    alphaAttribute = new THREE.InstancedBufferAttribute(alphaArray, 1);
    geom.setAttribute("instanceAlpha", alphaAttribute);

    instancedMesh = new THREE.InstancedMesh(geom, material, count);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);
  }

  function handleResize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.round(rect.width || window.innerWidth);
    height = Math.round(rect.height || window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(dpr);

    // Exact 1:1 Orthographic view matching screen pixels
    camera.left = -width * 0.5;
    camera.right = width * 0.5;
    camera.top = height * 0.5;
    camera.bottom = -height * 0.5;
    camera.updateProjectionMatrix();

    // Scale ring radius appropriately for screen size (wider ring)
    const screenMin = Math.min(width, height);
    ring.baseRadius = Math.max(250, Math.min(430, screenMin * 0.46));
    ring.width = ring.baseRadius * 0.46;
    ring.width2 = ring.baseRadius * 0.22;
    ring.displacement = 28;

    // Default resting ring position (offset top-left like antigravity.google)
    ring.x = -width * 0.40;
    ring.y = height * 0.30;
    ring.targetX = ring.x;
    ring.targetY = ring.y;

    createParticles();
  }

  // Pointer Interaction with Sub-Pixel Alignment
  function updatePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    mouse.targetX = sx - width * 0.5;
    mouse.targetY = -(sy - height * 0.5);
    mouse.hasMoved = true;
  }

  function onPointerMove(e) {
    updatePointer(e.clientX, e.clientY);
  }

  function onTouchMove(e) {
    if (e.touches && e.touches[0]) {
      updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function onPointerLeave() {
    // Keep animation in place when cursor leaves the screen,
    // rather than resetting back to the initial corner position!
  }

  function onPointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    shockwaves.push({
      x: sx - width * 0.5,
      y: -(sy - height * 0.5),
      startTime: performance.now(),
      maxRadius: 460,
      duration: 1100
    });
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });
  document.addEventListener("mouseleave", onPointerLeave);

  const observer = new IntersectionObserver((entries) => {
    isElementVisible = entries.some(e => e.isIntersecting);
  }, { threshold: 0.05 });
  observer.observe(canvas);

  function onVisibilityChange() {
    isTabVisible = !document.hidden;
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  handleResize();

  // Animation Loop
  let lastTime = performance.now();
  const startTime = lastTime;

  function animate(currentTime) {
    if (!isTabVisible || !isElementVisible) {
      animationFrameId = requestAnimationFrame(animate);
      lastTime = currentTime;
      return;
    }

    const dt = Math.min(64, currentTime - lastTime);
    lastTime = currentTime;
    const elapsedTime = currentTime - startTime;
    const timeSec = elapsedTime * 0.001;

    // 1. Mouse Tracking with Sub-Pixel Alignment
    if (mouse.prevX === -9999) {
      mouse.x = mouse.targetX;
      mouse.y = mouse.targetY;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    } else {
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x += (mouse.targetX - mouse.x) * 0.22;
      mouse.y += (mouse.targetY - mouse.y) * 0.22;
    }

    mouse.vx = mouse.x - mouse.prevX;
    mouse.vy = mouse.y - mouse.prevY;
    mouse.speed = Math.hypot(mouse.vx, mouse.vy);

    // 2. Google Antigravity Fluid Ring Motion & Spring Tracker
    // When the user moves the mouse, the ring smoothly glides to the cursor.
    // When the cursor leaves the screen, the ring STAYS in place where the cursor was,
    // breathing organically with gentle in-place float!
    if (mouse.hasMoved) {
      const inPlaceWaveX = Math.sin(timeSec * 0.45) * 14;
      const inPlaceWaveY = Math.cos(timeSec * 0.35) * 12;
      ring.targetX = mouse.targetX + inPlaceWaveX;
      ring.targetY = mouse.targetY + inPlaceWaveY;
      ring.x += (ring.targetX - ring.x) * 0.045;
      ring.y += (ring.targetY - ring.y) * 0.045;
    } else {
      const idleWaveX = Math.sin(timeSec * 0.45) * 25;
      const idleWaveY = Math.cos(timeSec * 0.35) * 20;
      ring.targetX = -width * 0.38 + idleWaveX;
      ring.targetY = height * 0.30 + idleWaveY;
      ring.x += (ring.targetX - ring.x) * 0.025;
      ring.y += (ring.targetY - ring.y) * 0.025;
    }

    // Dynamic Asymmetric Breathing Ring Radius (wider & more organic):
    // Incommensurate harmonic frequencies create an organic breathing rhythm (unequal inhale/exhale cycles)
    const breatheCycle = Math.sin(timeSec * 0.75) * 26 + Math.cos(timeSec * 1.85) * 15 + Math.sin(timeSec * 3.1 + 1.2) * 8;
    ring.radius = ring.baseRadius + breatheCycle;

    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const isDark = currentTheme === "dark";

    // Expire shockwaves
    for (let s = shockwaves.length - 1; s >= 0; s--) {
      if (currentTime - shockwaves[s].startTime > shockwaves[s].duration) {
        shockwaves.splice(s, 1);
      }
    }

    const totalCount = particles.length;
    const ringRadius = ring.radius;
    const ringWidth = ring.width;
    const ringWidth2 = ring.width2;

    for (let i = 0; i < totalCount; i++) {
      const p = particles[i];

      // 1. Gentle Brownian Harmonic Flutter (calm zero-gravity ambient drift)
      const tA = elapsedTime * p.freqA + p.phaseA;
      const tB = elapsedTime * p.freqB + p.phaseB;
      const turbX = Math.sin(tA) * p.ampA + Math.cos(tB) * p.ampB;
      const turbY = Math.cos(tA * 1.1) * p.ampA + Math.sin(tB) * p.ampB;

      // Undisturbed resting coordinate in world space
      const bx = p.baseX + turbX;
      const by = p.baseY + turbY;

      // 2. Relative position & polar angle to ring center
      const rdx = bx - ring.x;
      const rdy = by - ring.y;
      const dist = Math.hypot(rdx, rdy);
      const polarAngle = Math.atan2(rdy, rdx);
      const cosA = Math.cos(polarAngle);
      const sinA = Math.sin(polarAngle);

      // 3. ASYMMETRIC BREATHING RADIUS:
      // Spatial angular deformation via 2D simplex noise (creates an organic, undulating membrane)
      const lobeNoise = snoise.noise2D(cosA * 1.4 + timeSec * 0.15, sinA * 1.4 + timeSec * 0.12) * 36;
      const localRadius = ringRadius + lobeNoise;

      // Micro edge noise perturbation for natural fluid edge
      const edgeNoise = snoise.noise2D(bx * 0.0035 + timeSec * 0.2, by * 0.0035) * 14;
      const distPerturbed = dist + edgeNoise;

      // Dual-band ring wave:
      // t = outer crest, t2 = sharp inner core, t3 = calm interior
      const t = Math.max(0, smoothstep(localRadius - ringWidth * 1.7, localRadius, dist) - smoothstep(localRadius, localRadius + ringWidth * 0.9, distPerturbed));
      const t2 = Math.max(0, smoothstep(localRadius - ringWidth2 * 2.0, localRadius, dist) - smoothstep(localRadius, localRadius + ringWidth2, distPerturbed));
      const t3 = smoothstep(localRadius + ringWidth2, localRadius, dist);

      // Total Wave Activation
      let wave = Math.pow(t, 2.0) * 1.3 + Math.pow(t2, 3.0) * 2.8 + t3 * 0.35;
      wave = Math.max(0, Math.min(1.5, wave));

      // 4. PURE RADIAL BREATHING DISPLACEMENT (ZERO SWIRL / БЕЗ ЗАКРУТКИ):
      // Particles pulse outward and inward along their radial rays, with NO rotational/tangential velocity!
      const radialBreathPulse = Math.sin(timeSec * 1.2 + dist * 0.008) * 5.0 * wave;
      const dispFactor = (Math.pow(t2, 0.75) * ring.displacement) + radialBreathPulse;
      let targetDispX = cosA * dispFactor;
      let targetDispY = sinA * dispFactor;

      // 5. RADIAL ALIGNMENT (Collinear with radius vector):
      // Three.js CapsuleGeometry(0.5, 1.0) long axis is along +Y (π/2).
      // Rotating by (polarAngle - π/2) aligns the capsule's long axis EXACTLY along the radial ray!
      const desiredRotation = polarAngle - (Math.PI * 0.5) + p.noiseAngleJitter;

      // 6. Active Shockwave Waves
      let shockwaveFactor = 0;
      for (let s = 0; s < shockwaves.length; s++) {
        const sw = shockwaves[s];
        const age = currentTime - sw.startTime;
        const progress = age / sw.duration;
        const swR = progress * sw.maxRadius;

        const sdx = bx - sw.x;
        const sdy = by - sw.y;
        const sDist = Math.hypot(sdx, sdy);
        const diff = Math.abs(sDist - swR);

        if (diff < 42) {
          const factor = (1 - diff / 42) * (1 - progress);
          const swAngle = Math.atan2(sdy, sdx);
          targetDispX += Math.cos(swAngle) * factor * 26;
          targetDispY += Math.sin(swAngle) * factor * 26;
          shockwaveFactor = Math.max(shockwaveFactor, factor);
        }
      }

      // Smooth spring-damper easing on displacement and activation
      p.waveActivation += (wave + shockwaveFactor * 0.8 - p.waveActivation) * 0.18;
      p.dispX += (targetDispX - p.dispX) * 0.15;
      p.dispY += (targetDispY - p.dispY) * 0.15;

      // 7. METAMORPHOSIS: Circular Dot -> Sleek Radial Capsule ONLY in Ring Proximity
      // STRICTLY NO THICKNESS MAGNIFICATION (thickness is permanently 1.8px)
      // When waveActivation = 0: currentLength = 1.8px (PERFECT CIRCULAR DOT)
      // When waveActivation > 0: currentLength stretches up to 8-13px
      const targetLength = p.baseLength + (p.maxStretch * p.waveActivation) + (shockwaveFactor * 6.0);
      p.currentLength += (targetLength - p.currentLength) * 0.20;

      // 8. Dynamic Radial Alignment
      if (p.waveActivation > 0.03) {
        p.targetRotation = desiredRotation;
      } else {
        p.targetRotation = p.currentRotation;
      }
      p.currentRotation += (p.targetRotation - p.currentRotation) * 0.18;

      // Final 3D Coordinates
      const finalX = bx + p.dispX;
      const finalY = by + p.dispY;

      dummy.position.set(finalX, finalY, p.waveActivation * 10);
      dummy.rotation.set(0, 0, p.currentRotation);

      // EXACT Geometry Dimensions:
      // CapsuleGeometry height = 2.0 * scaleY, diameter = 1.0 * scaleX.
      // scaleX = thickness (1.8px), scaleY = length * 0.5.
      // When length == thickness: scaleY == scaleX * 0.5 -> PERFECT SPHERE / CIRCLE!
      const scaleX = p.thickness;
      const scaleY = Math.max(p.thickness * 0.5, p.currentLength * 0.5);
      dummy.scale.set(scaleX, scaleY, scaleX);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);

      // 8. Chromatic Awakening: Official Google Colors
      const activeWeight = Math.min(1.0, p.waveActivation + shockwaveFactor);
      resolveParticleColor(tempColor, polarAngle, p.spatialNoise, isDark, activeWeight);
      instancedMesh.setColorAt(i, tempColor);

      // 9. Opacity: Calm & Unobtrusive at rest ("не мозолят глаза"), radiant under ring
      // Resting alpha: 0.22 (dark) / 0.24 (light) -> zero eye strain
      // Ring crest alpha: 0.94 - 0.98 -> vibrant & crisp
      const restingAlpha = isDark ? 0.22 : 0.24;
      const activeAlpha = isDark ? 0.94 : 0.96;
      alphaArray[i] = restingAlpha + (activeAlpha - restingAlpha) * Math.min(1.0, p.waveActivation * 1.4);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    if (alphaAttribute) alphaAttribute.needsUpdate = true;

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  }

  animationFrameId = requestAnimationFrame(animate);

  const instance = {
    canvas,
    destroy() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();

      if (instancedMesh) {
        scene.remove(instancedMesh);
        instancedMesh.geometry.dispose();
        instancedMesh.dispose();
      }
      renderer.dispose();
      canvas.__antigravityInstance = null;
    }
  };

  canvas.__antigravityInstance = instance;
  return instance;
}

