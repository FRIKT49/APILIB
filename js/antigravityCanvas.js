/**
 * API Library - antigravityCanvas.js
 * High-performance, pixel-perfect Google Antigravity particle field powered by Three.js
 * 
 * Features:
 * - Powered by Three.js WebGL InstancedMesh with 3D Capsule Geometry
 * - Complete 360-degree uniform radial galaxy with natural organic twist
 * - Fixed burst origin (stationary - does NOT shift whole screen with cursor)
 * - Proximity-driven particle physics:
 *   - Localized Magnification (thickness expands up to 2.4x)
 *   - Localized Elongation (length stretches up to 3.2x along radial orientation)
 *   - Rhythmic Pulsing (harmonic oscillation frequency and amplitude under cursor)
 *   - Magnetic Lens Deflection (gentle radial push around pointer)
 * - Continuous Google chromatic spectrum (Cyan -> Magenta -> Amber -> Blue)
 * - Dual-theme support (deep glowing space in dark mode, crisp minimalism in light mode)
 */

import * as THREE from "./libs/three.module.js";

export function initAntigravityCanvas(canvasId = "antigravityCanvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrameId = null;

  // Mouse coordinates in Orthographic world space
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    isHovering: false
  };

  // Three.js Core
  const scene = new THREE.Scene();
  
  // Orthographic Camera gives 1:1 pixel coordinates mapping with DOM
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.position.z = 100;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);

  // Capsule geometry representing each spark/dash
  // CapsuleGeometry(radius, length, capSubdivisions, radialSegments)
  const baseGeom = new THREE.CapsuleGeometry(0.5, 1.0, 4, 8);

  // Custom ShaderMaterial extending MeshBasicMaterial with per-instance alpha
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
  let maxBurstRadius = 800;

  // Particle data structure
  class ParticleData {
    constructor(ringIndex, ringAngle, baseRadius, radialJitter, lengthJitter) {
      this.ringIndex = ringIndex;
      this.baseAngle = ringAngle;
      this.baseRadius = baseRadius + radialJitter;

      // Base dimensions in pixels: circular dots at rest, blooming into rays under cursor
      this.baseThickness = 2.8 + (baseRadius / 750) * 1.4;
      this.baseLength = this.baseThickness; // True circular dot at rest!
      this.maxStretch = 14 + (baseRadius / 750) * 18 + lengthJitter;

      this.currentLength = this.baseLength;
      this.currentThickness = this.baseThickness;

      this.currentAngle = this.baseAngle;
      this.targetAngle = this.baseAngle;
      this.repelX = 0;
      this.repelY = 0;
      this.hoverWeight = 0;
      this.phase = Math.random() * Math.PI * 2;

      // Normalised Angle to Hue (0 to 1) for Google Chromatic Spectrum
      let deg = (this.baseAngle * 180 / Math.PI) % 360;
      if (deg < 0) deg += 360;
      this.hue = ((deg + 200) % 360) / 360;
    }
  }

  function createParticles() {
    if (instancedMesh) {
      scene.remove(instancedMesh);
      instancedMesh.geometry.dispose();
      instancedMesh.dispose();
    }

    particles = [];
    const minDim = Math.min(width, height);
    maxBurstRadius = Math.max(width, height) * 0.75;

    // Concentric rings from inner radius 85px to maxBurstRadius
    const numRings = Math.max(18, Math.min(26, Math.floor(minDim / 38)));
    const innerRadius = 85;

    for (let ring = 1; ring <= numRings; ring++) {
      const ringRatio = ring / numRings;
      const baseRadius = innerRadius + Math.pow(ringRatio, 1.1) * (maxBurstRadius - innerRadius);

      const countInRing = Math.floor(12 + ring * 5.2);
      const ringTwist = ring * 0.14;

      for (let i = 0; i < countInRing; i++) {
        const ringAngle = (i / countInRing) * (Math.PI * 2) + ringTwist;
        const radialJitter = (Math.random() - 0.5) * 8;
        const lengthJitter = (Math.random() - 0.5) * 3;

        particles.push(new ParticleData(ring, ringAngle, baseRadius, radialJitter, lengthJitter));
      }
    }

    const totalCount = particles.length;
    const geom = baseGeom.clone();
    alphaArray = new Float32Array(totalCount).fill(1.0);
    alphaAttribute = new THREE.InstancedBufferAttribute(alphaArray, 1);
    geom.setAttribute("instanceAlpha", alphaAttribute);

    instancedMesh = new THREE.InstancedMesh(geom, material, totalCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);
  }

  // Handle Resize
  function handleResize() {
    const parent = canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };

    width = rect.width || window.innerWidth;
    height = rect.height || 650;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(dpr);

    // Update Orthographic camera view bounds (matching pixels)
    camera.left = -width * 0.5;
    camera.right = width * 0.5;
    camera.top = height * 0.5;
    camera.bottom = -height * 0.5;
    camera.updateProjectionMatrix();

    createParticles();
  }

  // Pointer Movement Handlers
  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Convert DOM screen pixels to Orthographic world coordinates
    mouse.targetX = sx - width * 0.5;
    mouse.targetY = -(sy - height * 0.5);
    mouse.isHovering = true;
  }

  function onPointerLeave() {
    mouse.isHovering = false;
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });
  document.addEventListener("mouseleave", onPointerLeave);

  handleResize();

  // Animation Loop
  const startTime = performance.now();

  function animate(currentTime) {
    const time = currentTime - startTime;

    // Smooth mouse coordinates lerping
    mouse.x += (mouse.targetX - mouse.x) * 0.14;
    mouse.y += (mouse.targetY - mouse.y) * 0.14;

    // FIXED Center Origin in Orthographic space:
    // (0, height * 0.08) places the center at 42% from top, matching hero layout
    const burstCenterX = 0;
    const burstCenterY = height * 0.08;

    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const isDark = currentTheme === "dark";

    const totalCount = particles.length;
    const influenceRadius = 220; // 220px proximity zone

    for (let i = 0; i < totalCount; i++) {
      const p = particles[i];

      // 1. Organic gentle resting breathing
      const breath = Math.sin(time * 0.0014 + p.ringIndex * 0.32 + p.phase) * 4;
      const r = p.baseRadius + breath;

      // Subtle resting angular drift
      const naturalAngle = p.baseAngle + Math.sin(time * 0.0006 + p.ringIndex * 0.18) * 0.02;

      // Undisturbed particle coordinate
      const bx = burstCenterX + Math.cos(naturalAngle) * r;
      const by = burstCenterY + Math.sin(naturalAngle) * r;

      // 2. Mouse Proximity Detection (Localised - does NOT shift whole screen)
      const dx = bx - mouse.x;
      const dy = by - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let targetHover = 0;
      if (mouse.isHovering && dist < influenceRadius) {
        // Smoothstep curve
        const t = Math.max(0, 1 - dist / influenceRadius);
        targetHover = t * t * (3 - 2 * t);
      }

      p.hoverWeight += (targetHover - p.hoverWeight) * 0.16;

      // 3. Magnification, Elongation & Pulsing Physics
      if (p.hoverWeight > 0.002) {
        // Dynamic rhythmic pulsing under cursor
        const pulsePhase = time * 0.009 + p.phase * 3;
        const pulseWave = Math.sin(pulsePhase);
        const pulseLengthAmp = p.hoverWeight * 8.5; // Elongation pulse
        const pulseThickAmp = p.hoverWeight * 1.3;  // Thickness pulse

        // Elongation: stretch from round dot into radiating beam
        const targetLength = p.baseLength + (p.maxStretch * p.hoverWeight) + (pulseWave * pulseLengthAmp);

        // Magnification: scale thickness up to 2.5x
        const thicknessMultiplier = 1 + p.hoverWeight * 1.5;
        const targetThickness = (p.baseThickness * thicknessMultiplier) + (Math.max(0, pulseWave) * pulseThickAmp);

        p.currentLength += (Math.max(p.baseLength, targetLength) - p.currentLength) * 0.22;
        p.currentThickness += (Math.max(p.baseThickness, targetThickness) - p.currentThickness) * 0.22;

        // Gentle local magnetic deflection / lens effect
        const angleFromCursor = Math.atan2(dy, dx);
        const push = p.hoverWeight * 22;
        const targetRepelX = Math.cos(angleFromCursor) * push;
        const targetRepelY = Math.sin(angleFromCursor) * push;

        p.repelX += (targetRepelX - p.repelX) * 0.15;
        p.repelY += (targetRepelY - p.repelY) * 0.15;

        // Radial ray alignment with subtle deflection flare
        p.targetAngle = naturalAngle + (angleFromCursor - naturalAngle) * (p.hoverWeight * 0.35);
      } else {
        // Idle return to baseline circular dot
        const idlePulse = Math.sin(time * 0.002 + p.phase) * 0.3;
        p.currentLength += (p.baseLength + idlePulse - p.currentLength) * 0.12;
        p.currentThickness += (p.baseThickness + idlePulse - p.currentThickness) * 0.12;

        p.repelX += (0 - p.repelX) * 0.08;
        p.repelY += (0 - p.repelY) * 0.08;
        p.targetAngle = naturalAngle;
      }

      p.currentAngle += (p.targetAngle - p.currentAngle) * 0.15;

      const curX = bx + p.repelX;
      const curY = by + p.repelY;

      // 4. Update Three.js 3D Instance Matrix
      dummy.position.set(curX, curY, p.hoverWeight * 12);
      // CapsuleGeometry is oriented along Y axis. Rotating by (currentAngle - PI/2) aligns length radially
      dummy.rotation.set(0, 0, p.currentAngle - Math.PI / 2);
      dummy.scale.set(p.currentThickness, p.currentLength, p.currentThickness);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);

      // 5. Dynamic Chromatic Color & Alpha
      const radiusRatio = Math.min(1, p.baseRadius / maxBurstRadius);
      const baseSat = isDark ? 0.92 : 0.88;
      const sat = Math.min(1.0, baseSat + p.hoverWeight * 0.08);

      const baseLight = isDark ? 0.64 : 0.48;
      const light = isDark
        ? Math.min(0.90, baseLight + p.hoverWeight * 0.22)
        : Math.max(0.36, baseLight - p.hoverWeight * 0.10);

      tempColor.setHSL(p.hue, sat, light);
      instancedMesh.setColorAt(i, tempColor);

      const baseAlpha = Math.max(0.28, Math.min(0.95, 1 - radiusRatio * 0.38));
      alphaArray[i] = Math.min(1.0, baseAlpha + p.hoverWeight * 0.55);
    }

    // Mark buffers for WebGL GPU upload
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    if (alphaAttribute) alphaAttribute.needsUpdate = true;

    renderer.render(scene, camera);

    animationFrameId = requestAnimationFrame(animate);
  }

  animationFrameId = requestAnimationFrame(animate);

  return function destroy() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("mouseleave", onPointerLeave);

    if (instancedMesh) {
      scene.remove(instancedMesh);
      instancedMesh.geometry.dispose();
      instancedMesh.dispose();
    }
    renderer.dispose();
  };
}
