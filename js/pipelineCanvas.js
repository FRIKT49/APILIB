/**
 * API Library - pipelineCanvas.js
 * High-Performance Three.js 3D WebGL Pipeline Visualization
 * Features:
 * - 4 3D Node Clusters (Ingress, Gateway, Compiler, Agent Runtime)
 * - Dynamic 3D Spline Curve with Translucent Conduit
 * - Volumetric Data Packet Streams (InstancedMesh capsules)
 * - Interactive Packet Burst System
 * - Scroll-Scrubbed Camera Choreography & Smooth Damped Mouse Parallax
 * - High-Tech Non-AI Developer Telemetry Aesthetic (Antigravity / Linear)
 * - 60fps Optimization: Offscreen Pause, Proper Matrix Updates, Zero Memory Leaks
 */

import * as THREE from "./libs/three.module.js";

export class PipelineCanvas {
  constructor(canvasId = "pipelineCanvas") {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`[PipelineCanvas] Canvas #${canvasId} not found.`);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this.isVisible = true;

    // Progression state
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.activeStage = 0;
    this.speedMultiplier = 1.0;

    // Mouse parallax tracking
    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };

    // 3D Objects
    this.nodes = [];
    this.spline = null;
    this.conduitMesh = null;
    this.packetSystem = null;
    this.burstPackets = [];
    this.dustParticles = null;

    // Colors
    this.stageColors = [
      new THREE.Color(0x6366f1), // Indigo (Ingress)
      new THREE.Color(0x06b6d4), // Cyan (Gateway)
      new THREE.Color(0xa855f7), // Violet (Compiler)
      new THREE.Color(0x10b981)  // Emerald (Agent Runtime)
    ];

    this.lastTime = performance.now();
    this.startTime = performance.now();

    this.init();
  }

  init() {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(-12, 3, 11);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x818cf8, 2.5, 60);
    pointLight.position.set(0, 10, 15);
    this.scene.add(pointLight);

    // 5. Build Spline Curve
    this.createSpline();

    // 6. Build 4 Stage Nodes
    this.createStageNodes();

    // 7. Build Packet Streams
    this.createPacketStreams();

    // 8. Build Ambient Data Dust
    this.createAmbientDust();

    // 9. Event Listeners
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    window.addEventListener("resize", this.boundOnResize, { passive: true });
    window.addEventListener("mousemove", this.boundOnMouseMove, { passive: true });

    // 10. Visibility Observer to throttle RAF when scrolled away
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
          });
        },
        { threshold: 0.05 }
      );
      this.observer.observe(this.canvas);
    }

    // 11. Start Loop
    this.animate();
  }

  createSpline() {
    this.splinePoints = [
      new THREE.Vector3(-22, 5, 2),
      new THREE.Vector3(-14, 2, -1),   // Stage 0: Ingress
      new THREE.Vector3(-9, 0, -3),
      new THREE.Vector3(-4, -2, -4),  // Stage 1: Gateway
      new THREE.Vector3(1, 1.2, -5),
      new THREE.Vector3(6, 2.2, -4),  // Stage 2: Compiler
      new THREE.Vector3(10.5, 0, -2),
      new THREE.Vector3(15, -2, 0),   // Stage 3: Agent Runtime
      new THREE.Vector3(21, -1, 2)
    ];

    this.spline = new THREE.CatmullRomCurve3(this.splinePoints, false, "catmullrom", 0.35);

    // Wireframe glowing tube along spline
    const tubeGeometry = new THREE.TubeGeometry(this.spline, 140, 0.15, 8, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    this.conduitMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    this.scene.add(this.conduitMesh);
  }

  createStageNodes() {
    // 4 Nodes corresponding to indices 1, 3, 5, 7 on spline
    const stageIndices = [1, 3, 5, 7];

    stageIndices.forEach((pointIndex, stageId) => {
      const pos = this.splinePoints[pointIndex];
      const color = this.stageColors[stageId];
      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(pos);

      // Outer wireframe cage
      let geom;
      if (stageId === 0) {
        geom = new THREE.OctahedronGeometry(1.2, 0);
      } else if (stageId === 1) {
        geom = new THREE.TorusGeometry(1.1, 0.08, 12, 32);
      } else if (stageId === 2) {
        geom = new THREE.BoxGeometry(1.4, 1.4, 1.4);
      } else {
        geom = new THREE.IcosahedronGeometry(1.2, 0);
      }

      const cageMat = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.75
      });
      const cageMesh = new THREE.Mesh(geom, cageMat);
      nodeGroup.add(cageMesh);

      // Inner glowing core
      const coreGeom = new THREE.SphereGeometry(0.42, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.95
      });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      nodeGroup.add(coreMesh);

      // Dual holographic orbital rings
      const ringGeom = new THREE.RingGeometry(1.5, 1.54, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      });

      const ring1 = new THREE.Mesh(ringGeom, ringMat);
      ring1.rotation.x = Math.PI * 0.45;
      nodeGroup.add(ring1);

      const ring2 = new THREE.Mesh(ringGeom, ringMat.clone());
      ring2.rotation.y = Math.PI * 0.35;
      ring2.rotation.x = -Math.PI * 0.2;
      nodeGroup.add(ring2);

      // Beacon halo light
      const nodeLight = new THREE.PointLight(color.getHex(), 1.5, 8);
      nodeGroup.add(nodeLight);

      this.scene.add(nodeGroup);
      this.nodes.push({
        group: nodeGroup,
        cage: cageMesh,
        core: coreMesh,
        ring1,
        ring2,
        light: nodeLight,
        baseColor: color,
        targetScale: 1.0,
        currentScale: 1.0
      });
    });
  }

  createPacketStreams() {
    this.packetCount = 180;
    // We use InstancedMesh with capsule / small rounded box geometry for volumetric high-tech look
    const geom = new THREE.BoxGeometry(0.12, 0.12, 0.45);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });

    this.packetInstanced = new THREE.InstancedMesh(geom, mat, this.packetCount);
    this.packetInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Color array for instances
    this.packetColors = new Float32Array(this.packetCount * 3);

    // Particle metadata
    this.packets = [];
    for (let i = 0; i < this.packetCount; i++) {
      const t = Math.random();
      const speed = 0.04 + Math.random() * 0.05;
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.12 + Math.random() * 0.22;

      this.packets.push({
        t,
        speed,
        angle,
        radius,
        scale: 0.8 + Math.random() * 0.5
      });
    }

    this.scene.add(this.packetInstanced);

    // InstancedMesh for high-energy glowing packet bursts
    this.maxBurstPackets = 70;
    const burstGeom = new THREE.SphereGeometry(0.24, 12, 12);
    const burstMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    this.burstInstanced = new THREE.InstancedMesh(burstGeom, burstMat, this.maxBurstPackets);
    this.burstInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < this.maxBurstPackets; i++) {
      this.burstInstanced.setMatrixAt(i, dummy.matrix);
    }
    this.burstInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(this.burstInstanced);
  }

  createAmbientDust() {
    const dustCount = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 55;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  triggerPacketBurst(fromStageIdx = this.activeStage) {
    const stageStartProgress = [0.03, 0.32, 0.58, 0.82];
    const baseT = stageStartProgress[Math.max(0, Math.min(3, fromStageIdx))] ?? 0.03;
    const burstColor = this.stageColors[Math.max(0, Math.min(3, fromStageIdx))] || new THREE.Color(0x38bdf8);

    // Generate 25 bright, fast-moving packet particles along spline
    const count = 25;
    for (let i = 0; i < count; i++) {
      if (this.burstPackets.length >= this.maxBurstPackets) {
        this.burstPackets.shift();
      }
      this.burstPackets.push({
        t: Math.min(0.99, baseT + Math.random() * 0.04),
        speed: 0.22 + Math.random() * 0.12,
        angle: Math.random() * Math.PI * 2,
        radius: 0.14 + Math.random() * 0.28,
        life: 1.0,
        color: burstColor
      });
    }

    // Pulse active node light
    if (this.nodes[this.activeStage]) {
      this.nodes[this.activeStage].light.intensity = 4.2;
    }
  }

  setScrollProgress(progress) {
    this.targetScrollProgress = Math.max(0, Math.min(1, progress));
  }

  setActiveStage(stageIndex) {
    this.activeStage = Math.max(0, Math.min(3, stageIndex));
    this.nodes.forEach((node, i) => {
      node.targetScale = i === this.activeStage ? 1.35 : 1.0;
    });
  }

  previewStage(stageIndex) {
    const idx = Math.max(0, Math.min(3, stageIndex));
    this.nodes.forEach((node, i) => {
      if (i === idx) {
        node.targetScale = 1.45;
        node.light.intensity = 3.0;
      } else if (i === this.activeStage) {
        node.targetScale = 1.15;
      } else {
        node.targetScale = 0.95;
      }
    });
  }

  revertPreview() {
    this.setActiveStage(this.activeStage);
  }

  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = Math.max(0, multiplier);
  }

  onMouseMove(e) {
    // Normalize mouse coords (-1 to +1)
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    this.targetMouse.x = nx;
    this.targetMouse.y = ny;
  }

  onResize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getWaypointP(progress) {
    // Smooth piecewise mapping from scroll progress [0, 1] to waypoint segment parameter [0, 3]
    // Aligned with stage switch thresholds [0.25, 0.50, 0.75]
    const smooth = (t) => t * t * (3 - 2 * t);

    if (progress <= 0.18) return 0.0;
    if (progress < 0.32) {
      const t = (progress - 0.18) / 0.14;
      return smooth(t);
    }
    if (progress <= 0.43) return 1.0;
    if (progress < 0.57) {
      const t = (progress - 0.43) / 0.14;
      return 1.0 + smooth(t);
    }
    if (progress <= 0.68) return 2.0;
    if (progress < 0.82) {
      const t = (progress - 0.68) / 0.14;
      return 2.0 + smooth(t);
    }
    return 3.0;
  }

  updateCamera(delta) {
    // Smooth damped lerp for scroll progress
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

    // Smooth damped mouse parallax
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.06;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.06;

    // 4 Camera Vantage Waypoints along the protocol pipeline journey
    // Targets are positioned so the nodes have breathing room and avoid panel overlap
    const waypoints = [
      { pos: new THREE.Vector3(-12.5, 3.2, 11.5), target: new THREE.Vector3(-13.2, 1.8, -1) },
      { pos: new THREE.Vector3(-2.8, 0.8, 9.8),   target: new THREE.Vector3(-3.4, -1.6, -4) },
      { pos: new THREE.Vector3(7.2, 3.0, 9.6),     target: new THREE.Vector3(6.2, 2.0, -4) },
      { pos: new THREE.Vector3(16.5, 0.8, 11.2),  target: new THREE.Vector3(14.0, -1.8, -0.5) }
    ];

    // Compute continuous segment index based on corrected waypoint mapping
    const p = this.getWaypointP(this.scrollProgress);
    const idx = Math.min(Math.floor(p), waypoints.length - 2);
    const subT = p - idx;

    // Cubic ease interpolation between camera waypoints
    const easeT = subT * subT * (3 - 2 * subT);

    const camPos = new THREE.Vector3().lerpVectors(waypoints[idx].pos, waypoints[idx + 1].pos, easeT);
    const lookTarget = new THREE.Vector3().lerpVectors(waypoints[idx].target, waypoints[idx + 1].target, easeT);

    // Apply subtle mouse parallax
    camPos.x += this.mouse.x * 1.2;
    camPos.y += this.mouse.y * 0.8;
    lookTarget.x += this.mouse.x * 0.4;

    this.camera.position.copy(camPos);
    this.camera.lookAt(lookTarget);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    if (!this.isVisible) return;

    const currentTime = performance.now();
    const delta = Math.min((currentTime - this.lastTime) * 0.001, 0.1);
    this.lastTime = currentTime;
    const elapsedTime = (currentTime - this.startTime) * 0.001;

    // 1. Update Camera
    this.updateCamera(delta);

    // 2. Animate Stage Nodes
    this.nodes.forEach((node, i) => {
      // Rotation
      node.cage.rotation.x += 0.008 * (i % 2 === 0 ? 1 : -1);
      node.cage.rotation.y += 0.012;
      node.ring1.rotation.z += 0.01;
      node.ring2.rotation.z -= 0.012;

      // Active scale lerp
      node.currentScale += (node.targetScale - node.currentScale) * 0.1;
      node.group.scale.setScalar(node.currentScale);

      // Core pulsing
      const pulse = 1 + 0.1 * Math.sin(elapsedTime * 4 + i);
      node.core.scale.setScalar(pulse);

      // Light relaxation back to normal
      if (node.light.intensity > 1.6) {
        node.light.intensity += (1.5 - node.light.intensity) * 0.05;
      }
    });

    // 3. Animate Instanced Packets
    const dummy = new THREE.Object3D();
    const upVector = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < this.packetCount; i++) {
      const pkt = this.packets[i];

      if (this.speedMultiplier > 0) {
        pkt.t = (pkt.t + delta * pkt.speed * this.speedMultiplier) % 1.0;
      }

      const point = this.spline.getPointAt(pkt.t);
      const tangent = this.spline.getTangentAt(pkt.t).normalize();

      // Normal offset around spline
      const binormal = new THREE.Vector3().crossVectors(tangent, upVector).normalize();
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      const offset = binormal.clone().multiplyScalar(Math.cos(pkt.angle + pkt.t * 12) * pkt.radius)
        .add(normal.clone().multiplyScalar(Math.sin(pkt.angle + pkt.t * 12) * pkt.radius));

      dummy.position.copy(point).add(offset);

      // Align capsule orientation with tangent
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      dummy.scale.set(pkt.scale, pkt.scale, pkt.scale * (1 + this.speedMultiplier * 0.5));
      dummy.updateMatrix();

      this.packetInstanced.setMatrixAt(i, dummy.matrix);

      // Color based on progression t
      let color;
      if (pkt.t < 0.25) {
        color = this.stageColors[0];
      } else if (pkt.t < 0.5) {
        color = this.stageColors[1];
      } else if (pkt.t < 0.75) {
        color = this.stageColors[2];
      } else {
        color = this.stageColors[3];
      }
      this.packetInstanced.setColorAt(i, color);
    }

    this.packetInstanced.instanceMatrix.needsUpdate = true;
    if (this.packetInstanced.instanceColor) {
      this.packetInstanced.instanceColor.needsUpdate = true;
    }

    // 4. Animate Burst Packets
    const burstDummy = new THREE.Object3D();
    const burstUpVector = new THREE.Vector3(0, 1, 0);

    for (let i = this.burstPackets.length - 1; i >= 0; i--) {
      const bp = this.burstPackets[i];
      const speedFactor = Math.max(0.4, this.speedMultiplier);
      bp.t += delta * bp.speed * speedFactor;
      bp.life -= delta * 0.55;

      if (bp.t >= 1.0 || bp.life <= 0) {
        this.burstPackets.splice(i, 1);
      }
    }

    if (this.burstInstanced) {
      for (let i = 0; i < this.maxBurstPackets; i++) {
        if (i < this.burstPackets.length) {
          const bp = this.burstPackets[i];
          const clampedT = Math.min(0.999, Math.max(0.001, bp.t));
          const point = this.spline.getPointAt(clampedT);
          const tangent = this.spline.getTangentAt(clampedT).normalize();

          const binormal = new THREE.Vector3().crossVectors(tangent, burstUpVector).normalize();
          const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

          const offset = binormal.clone().multiplyScalar(Math.cos(bp.angle + bp.t * 16) * bp.radius)
            .add(normal.clone().multiplyScalar(Math.sin(bp.angle + bp.t * 16) * bp.radius));

          burstDummy.position.copy(point).add(offset);
          burstDummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
          const scale = Math.max(0.01, bp.life * 1.6);
          burstDummy.scale.set(scale, scale, scale * 1.8);
          burstDummy.updateMatrix();

          this.burstInstanced.setMatrixAt(i, burstDummy.matrix);
          this.burstInstanced.setColorAt(i, bp.color);
        } else {
          burstDummy.scale.set(0, 0, 0);
          burstDummy.updateMatrix();
          this.burstInstanced.setMatrixAt(i, burstDummy.matrix);
        }
      }
      this.burstInstanced.instanceMatrix.needsUpdate = true;
      if (this.burstInstanced.instanceColor) {
        this.burstInstanced.instanceColor.needsUpdate = true;
      }
    }

    // 5. Rotate Ambient Dust
    if (this.dustParticles) {
      this.dustParticles.rotation.y = elapsedTime * 0.02;
      this.dustParticles.rotation.x = Math.sin(elapsedTime * 0.015) * 0.05;
    }

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
    window.removeEventListener("resize", this.boundOnResize);
    window.removeEventListener("mousemove", this.boundOnMouseMove);

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.forceContextLoss) {
        this.renderer.forceContextLoss();
      }
    }
  }
}

export function initPipelineCanvas(canvasId = "pipelineCanvas") {
  return new PipelineCanvas(canvasId);
}
