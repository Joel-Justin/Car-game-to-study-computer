import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const CarRacingGame = () => {
  const mountRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue

    console.log('CarRacingGame mounted');

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Add helper axes to debug view
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Track (simple oval shape)
    const trackPoints = [];
    const trackRadius = 20;
    const trackWidth = 8;

    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      const x = Math.cos(angle) * trackRadius;
      const z = Math.sin(angle) * trackRadius;
      trackPoints.push(new THREE.Vector3(x, 0.1, z));
    }

    const trackGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(trackPoints),
      100,
      trackWidth / 2,
      8,
      true
    );
    const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.receiveShadow = true;
    scene.add(track);

    // Car
    const carGroup = new THREE.Group();

    // Car exterior chassis
    const chassisGeometry = new THREE.BoxGeometry(2.2, 0.4, 4.2);
    const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0xdc143c, metalness: 0.4, roughness: 0.2 });
    const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // Car roof and windows
    const roofGeometry = new THREE.BoxGeometry(1.5, 0.25, 2.2);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.3 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 0.8, 0);
    roof.castShadow = true;
    carGroup.add(roof);

    const carWindowGeometry = new THREE.BoxGeometry(1.4, 0.18, 1.8);
    const carWindowMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2, opacity: 0.5, transparent: true });
    const carWindowMesh = new THREE.Mesh(carWindowGeometry, carWindowMaterial);
    carWindowMesh.position.set(0, 0.8, 0);
    carGroup.add(carWindowMesh);

    // Front bumper and hood
    const bumperGeometry = new THREE.BoxGeometry(2.3, 0.2, 0.5);
    const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const bumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
    bumper.position.set(0, 0.35, 2.1);
    bumper.castShadow = true;
    carGroup.add(bumper);

    // Rear spoiler
    const spoilerGeometry = new THREE.BoxGeometry(1.4, 0.1, 0.2);
    const spoilerMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const spoiler = new THREE.Mesh(spoilerGeometry, spoilerMaterial);
    spoiler.position.set(0, 0.8, -1.9);
    spoiler.castShadow = true;
    carGroup.add(spoiler);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.4, 20);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.5 });
    const rimGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.42, 16);
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xdadada, metalness: 0.8, roughness: 0.25 });

    const wheelPositions = [
      [-0.95, 0.3, 1.3],
      [0.95, 0.3, 1.3],
      [-0.95, 0.3, -1.3],
      [0.95, 0.3, -1.3]
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;

      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.set(pos[0], pos[1], pos[2]);
      rim.rotation.z = Math.PI / 2;

      carGroup.add(wheel);
      carGroup.add(rim);
    });

    scene.add(carGroup);

    // Game state
    const gameState = {
      carPosition: new THREE.Vector3(0, 0, 0),
      carRotation: 0,
      speed: 0,
      maxSpeed: 0.5,
      acceleration: 0.01,
      deceleration: 0.005,
      turnSpeed: 0.03,
      keys: {
        forward: false,
        backward: false,
        left: false,
        right: false
      }
    };

    // Input handling
    const handleKeyDown = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          gameState.keys.forward = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          gameState.keys.backward = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          gameState.keys.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          gameState.keys.right = true;
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          gameState.keys.forward = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          gameState.keys.backward = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          gameState.keys.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          gameState.keys.right = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Car movement
      if (gameState.keys.forward) {
        gameState.speed = Math.min(gameState.speed + gameState.acceleration, gameState.maxSpeed);
      } else if (gameState.keys.backward) {
        gameState.speed = Math.max(gameState.speed - gameState.acceleration, -gameState.maxSpeed / 2);
      } else {
        if (gameState.speed > 0) {
          gameState.speed = Math.max(gameState.speed - gameState.deceleration, 0);
        } else if (gameState.speed < 0) {
          gameState.speed = Math.min(gameState.speed + gameState.deceleration, 0);
        }
      }

      // The car model faces -Z in world space; invert the forward direction for movement.
      const movementSpeed = -gameState.speed;

      // Determine turning direction based on forward/reverse.
      const turnDirection = gameState.speed >= 0 ? 1 : -1;
      const turnAmount = gameState.turnSpeed * (Math.abs(gameState.speed) / gameState.maxSpeed);

      if (gameState.keys.left && gameState.speed !== 0) {
        // Left input should rotate left when moving forward, and right when reversing.
        gameState.carRotation += turnAmount * turnDirection;
      }
      if (gameState.keys.right && gameState.speed !== 0) {
        // Right input should rotate right when moving forward, and left when reversing.
        gameState.carRotation -= turnAmount * turnDirection;
      }

      // Update car position
      gameState.carPosition.x += Math.sin(gameState.carRotation) * movementSpeed;
      gameState.carPosition.z += Math.cos(gameState.carRotation) * movementSpeed;

      // Apply position and rotation to car
      carGroup.position.copy(gameState.carPosition);
      carGroup.rotation.y = gameState.carRotation;

      // Camera follow
      const cameraOffset = new THREE.Vector3(0, 8, 12);
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), gameState.carRotation);
      camera.position.copy(gameState.carPosition).add(cameraOffset);
      camera.lookAt(gameState.carPosition);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        zIndex: 100
      }}>
        <h2>Car Racing Game</h2>
        <p>Use WASD or Arrow Keys to drive</p>
        <p>W/↑: Accelerate | S/↓: Brake | A/←: Turn Left | D/→: Turn Right</p>
      </div>
    </div>
  );
};

export default CarRacingGame;
