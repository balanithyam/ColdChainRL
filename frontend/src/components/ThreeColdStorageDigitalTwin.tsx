import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Wind,
  ShieldCheck,
  ShieldAlert,
  DoorOpen,
  Flame,
  Zap,
  Info,
  Sparkles,
  Eye,
  Camera
} from 'lucide-react';

interface ThreeColdStorageDigitalTwinProps {
  productName: string;
  temperature: number;
  safeMin: number;
  safeMax: number;
  humidity: number;
  spoilagePercent: number;
  coolingLevel: number;
  coolingCapacity?: number;
  actionName?: string;
  disturbanceType?: string | null;
  onInjectDisturbance?: (type: string) => void;
  isLiveMode?: boolean;
  activeUnitId?: string;
  onToggleMode?: (mode: 'live' | 'replay') => void;
  currentStep?: number;
  totalSteps?: number;
}

export const ThreeColdStorageDigitalTwin: React.FC<ThreeColdStorageDigitalTwinProps> = ({
  productName,
  temperature,
  safeMin,
  safeMax,
  humidity,
  spoilagePercent,
  coolingLevel,
  coolingCapacity = 100,
  actionName = 'Maintain Cooling',
  disturbanceType = null,
  onInjectDisturbance,
  isLiveMode = true,
  activeUnitId = 'WH-DAIRY-01',
  onToggleMode,
  currentStep,
  totalSteps,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(true);
  const isOrbitingRef = useRef<boolean>(true);
  const [cameraView, setCameraView] = useState<'perspective' | 'overhead' | 'front'>('perspective');

  const fanBladesRef = useRef<THREE.Group[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const doorMeshRef = useRef<THREE.Mesh | null>(null);
  const chamberLightRef = useRef<THREE.PointLight | null>(null);
  const cargoGroupRef = useRef<THREE.Group | null>(null);
  const agvRobotRef = useRef<THREE.Group | null>(null);
  const buildCargoModelsRef = useRef<((name: string) => void) | null>(null);

  const tempRef = useRef(temperature);
  const coolingLevelRef = useRef(coolingLevel);
  const disturbanceRef = useRef(disturbanceType);
  const spoilageRef = useRef(spoilagePercent);
  const productRef = useRef(productName);

  useEffect(() => {
    isOrbitingRef.current = isOrbiting;
  }, [isOrbiting]);

  useEffect(() => {
    tempRef.current = temperature;
    coolingLevelRef.current = coolingLevel;
    disturbanceRef.current = disturbanceType;
    spoilageRef.current = spoilagePercent;
    productRef.current = productName;
    if (buildCargoModelsRef.current) {
      buildCargoModelsRef.current(productName);
    }
  }, [temperature, coolingLevel, disturbanceType, spoilagePercent, productName]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = 480;

    // 1. Three.js Scene Setup (Bright Modern Industrial Digital Twin)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1726); // Bright clear slate navy
    scene.fog = new THREE.FogExp2(0x0e1726, 0.02);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(11, 8.5, 13);
    camera.lookAt(0, 1.8, 0);

    // 3. Renderer with Anti-Aliasing & Soft Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mountRef.current.appendChild(renderer.domElement);

    // 4. Studio Lighting System (High Visibility & Clear Realism)
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 35;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // Dynamic Central Atmospheric Point Light (Changes color with temperature)
    const chamberPointLight = new THREE.PointLight(0x06b6d4, 4.0, 22);
    chamberPointLight.position.set(0, 4.8, 0);
    scene.add(chamberPointLight);
    chamberLightRef.current = chamberPointLight;

    // 5. Architectural Warehouse Room
    // Floor (Polished Industrial Epoxy Floor)
    const floorGeo = new THREE.PlaneGeometry(18, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.5,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Markings & Safety Yellow Walkways
    const grid = new THREE.GridHelper(18, 18, 0x38bdf8, 0x334155);
    grid.position.y = 0.01;
    scene.add(grid);

    // Insulated Wall Panels with Metallic Sheen
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.6,
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 0.4), wallMat);
    backWall.position.set(0, 3.5, -9);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 18), wallMat);
    leftWall.position.set(-9, 3.5, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Wall Digital LED Display Board (Back Wall)
    const ledBoard = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 1.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.2, metalness: 0.8 })
    );
    ledBoard.position.set(0, 5.8, -8.75);
    scene.add(ledBoard);

    // 6. Sliding Warehouse Loading Door (Right Side)
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 5.5, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    doorFrame.position.set(8.8, 2.75, 0);
    scene.add(doorFrame);

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 5.2, 4.4),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.6 })
    );
    doorPanel.position.set(8.7, 2.75, 0);
    doorPanel.castShadow = true;
    scene.add(doorPanel);
    doorMeshRef.current = doorPanel;

    // 7. Overhead Industrial Evaporator Chiller & Dual Motorized Fans
    const chillerBody = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 1.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 })
    );
    chillerBody.position.set(0, 5.6, -7.0);
    chillerBody.castShadow = true;
    scene.add(chillerBody);

    // Glowing Cold Cooling Grill
    const grill = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 })
    );
    grill.position.set(0, 5.6, -5.88);
    scene.add(grill);

    // Dual 3D High-RPM Fan Rotors
    fanBladesRef.current = [];
    [-1.4, 1.4].forEach((xOffset) => {
      const fanGroup = new THREE.Group();
      fanGroup.position.set(xOffset, 5.6, -5.82);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
      );
      hub.rotation.x = Math.PI / 2;
      fanGroup.add(hub);

      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 0.15, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
        );
        blade.rotation.z = (i * Math.PI) / 2;
        blade.position.x = 0.42 * Math.cos((i * Math.PI) / 2);
        blade.position.y = 0.42 * Math.sin((i * Math.PI) / 2);
        fanGroup.add(blade);
      }

      scene.add(fanGroup);
      fanBladesRef.current.push(fanGroup);
    });

    // 8. Industrial Steel Pallet Racks (Heavy Industrial Blue & Orange)
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.7, roughness: 0.3 });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.6, roughness: 0.4 });

    const rackBays = [-4.2, 3.2];
    rackBays.forEach((xPos) => {
      [-2.2, 2.2].forEach((dz) => {
        [-1.8, 1.8].forEach((dx) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.6, 0.15), rackMat);
          post.position.set(xPos + dx, 2.3, dz);
          post.castShadow = true;
          scene.add(post);
        });
      });

      [0.2, 2.3].forEach((yLevel) => {
        const beamFront = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 0.1), beamMat);
        beamFront.position.set(xPos, yLevel, 2.2);
        scene.add(beamFront);

        const beamBack = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 0.1), beamMat);
        beamBack.position.set(xPos, yLevel, -2.2);
        scene.add(beamBack);
      });
    });

    // 9. Realistic Dynamic 3D Cargo Product Pallets
    const cargoGroup = new THREE.Group();
    scene.add(cargoGroup);
    cargoGroupRef.current = cargoGroup;

    const palletLocations = [
      { x: -5.1, y: 0.4, z: 0 },
      { x: -3.3, y: 0.4, z: 0 },
      { x: -5.1, y: 2.5, z: 0 },
      { x: -3.3, y: 2.5, z: 0 },
      { x: 2.3, y: 0.4, z: 0 },
      { x: 4.1, y: 0.4, z: 0 },
      { x: 2.3, y: 2.5, z: 0 },
      { x: 4.1, y: 2.5, z: 0 },
    ];

    const woodPalletMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });

    // Function to build product-specific 3D meshes for all 15 categories
    const buildCargoModels = (prodName: string) => {
      // Clear existing
      while (cargoGroup.children.length > 0) {
        cargoGroup.remove(cargoGroup.children[0]);
      }

      palletLocations.forEach((loc, idx) => {
        const palletGroup = new THREE.Group();
        palletGroup.position.set(loc.x, loc.y, loc.z);

        // Wood EUR Pallet Base
        const pBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 1.4), woodPalletMat);
        pBase.position.y = -0.15;
        pBase.castShadow = true;
        pBase.receiveShadow = true;
        palletGroup.add(pBase);

        // Render distinct product 3D geometry based on all 15 product types
        const lowerName = prodName.toLowerCase();

        if (lowerName.includes('milk') || lowerName.includes('dairy')) {
          // 1. Pasteurized Milk & Dairy
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
              const crate = new THREE.Mesh(
                new THREE.BoxGeometry(0.58, 0.42, 0.58),
                new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 })
              );
              crate.position.set((r - 0.5) * 0.62, 0.18 + idx * 0.02, (c - 0.5) * 0.62);
              crate.castShadow = true;
              palletGroup.add(crate);

              const jug = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8),
                new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
              );
              jug.position.set((r - 0.5) * 0.62, 0.45, (c - 0.5) * 0.62);
              palletGroup.add(jug);
            }
          }
        } else if (lowerName.includes('strawberr') || lowerName.includes('berry')) {
          // 2. Fresh Strawberries & Berries
          for (let layer = 0; layer < 2; layer++) {
            const crate = new THREE.Mesh(
              new THREE.BoxGeometry(1.2, 0.32, 1.2),
              new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
            );
            crate.position.y = layer * 0.36 + 0.15;
            palletGroup.add(crate);

            for (let fi = 0; fi < 6; fi++) {
              const berry = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
              );
              berry.position.set((fi % 3 - 1) * 0.35, layer * 0.36 + 0.36, (Math.floor(fi / 3) - 0.5) * 0.4);
              palletGroup.add(berry);
            }
          }
        } else if (lowerName.includes('salmon') || (lowerName.includes('seafood') && !lowerName.includes('deep-frozen'))) {
          // 3. Chilled Atlantic Salmon
          const crate = new THREE.Mesh(
            new THREE.BoxGeometry(1.25, 0.7, 1.25),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 })
          );
          crate.position.y = 0.35;
          palletGroup.add(crate);

          const ice = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.12, 1.2),
            new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.1, transparent: true, opacity: 0.85 })
          );
          ice.position.y = 0.72;
          palletGroup.add(ice);

          // Salmon fillet cuts (coral/orange)
          for (let i = 0; i < 3; i++) {
            const fish = new THREE.Mesh(
              new THREE.BoxGeometry(0.28, 0.08, 0.8),
              new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 })
            );
            fish.position.set((i - 1) * 0.38, 0.8, 0);
            palletGroup.add(fish);
          }
        } else if (lowerName.includes('beef') || lowerName.includes('poultry') || lowerName.includes('meat')) {
          // 4. Fresh Beef & Poultry
          const baseCrate = new THREE.Mesh(
            new THREE.BoxGeometry(1.25, 0.5, 1.25),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
          );
          baseCrate.position.y = 0.25;
          palletGroup.add(baseCrate);

          for (let i = 0; i < 4; i++) {
            const meatPack = new THREE.Mesh(
              new THREE.BoxGeometry(0.5, 0.16, 0.5),
              new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.3 })
            );
            meatPack.position.set((i % 2 - 0.5) * 0.55, 0.58, (Math.floor(i / 2) - 0.5) * 0.55);
            palletGroup.add(meatPack);
          }
        } else if (lowerName.includes('apple') || lowerName.includes('pear')) {
          // 5. Apples & Pears
          const crate = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.5, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
          );
          crate.position.y = 0.25;
          palletGroup.add(crate);

          for (let i = 0; i < 6; i++) {
            const isRed = i % 2 === 0;
            const apple = new THREE.Mesh(
              new THREE.SphereGeometry(0.13, 8, 8),
              new THREE.MeshStandardMaterial({ color: isRed ? 0xdc2626 : 0x84cc16, roughness: 0.3 })
            );
            apple.position.set((i % 3 - 1) * 0.35, 0.58, (Math.floor(i / 3) - 0.5) * 0.45);
            palletGroup.add(apple);
          }
        } else if (lowerName.includes('green') || lowerName.includes('broccoli')) {
          // 6. Leafy Greens & Broccoli
          const crate = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.55, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.5 })
          );
          crate.position.y = 0.28;
          palletGroup.add(crate);

          for (let i = 0; i < 5; i++) {
            const broccoli = new THREE.Mesh(
              new THREE.DodecahedronGeometry(0.16),
              new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
            );
            broccoli.position.set(((i % 3) - 1) * 0.36, 0.65, (Math.floor(i / 3) - 0.5) * 0.45);
            palletGroup.add(broccoli);
          }
        } else if (lowerName.includes('cheese') || lowerName.includes('butter')) {
          // 7. Artisan Cheese & Butter
          for (let i = 0; i < 3; i++) {
            const cheeseWheel = new THREE.Mesh(
              new THREE.CylinderGeometry(0.24, 0.24, 0.22, 16),
              new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
            );
            cheeseWheel.position.set((i - 1) * 0.42, 0.12, -0.2);
            palletGroup.add(cheeseWheel);

            const butterBox = new THREE.Mesh(
              new THREE.BoxGeometry(0.3, 0.2, 0.3),
              new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.2, metalness: 0.3 })
            );
            butterBox.position.set((i - 1) * 0.42, 0.12, 0.3);
            palletGroup.add(butterBox);
          }
        } else if (lowerName.includes('banana') || lowerName.includes('tropical')) {
          // 8. Bananas & Tropical Fruit
          const bananaBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.6, 1.2),
            new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.6 })
          );
          bananaBox.position.y = 0.3;
          palletGroup.add(bananaBox);

          for (let i = 0; i < 4; i++) {
            const banana = new THREE.Mesh(
              new THREE.TorusGeometry(0.18, 0.06, 6, 12, Math.PI * 0.8),
              new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 })
            );
            banana.rotation.x = Math.PI / 2;
            banana.position.set((i % 2 - 0.5) * 0.45, 0.65, (Math.floor(i / 2) - 0.5) * 0.45);
            palletGroup.add(banana);
          }
        } else if (lowerName.includes('ice cream') || lowerName.includes('gelato')) {
          // 9. Ice Cream & Gelato (Sub-Zero Frost)
          const freezerTubCrate = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.65, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.5 })
          );
          freezerTubCrate.position.y = 0.32;
          palletGroup.add(freezerTubCrate);

          for (let i = 0; i < 4; i++) {
            const tub = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.15, 0.35, 12),
              new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.6 })
            );
            tub.position.set((i % 2 - 0.5) * 0.5, 0.72, (Math.floor(i / 2) - 0.5) * 0.5);
            palletGroup.add(tub);
          }
        } else if (lowerName.includes('deep-frozen') || lowerName.includes('tuna')) {
          // 10. Deep-Frozen Seafood & Tuna
          const metalCrate = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 0.5, 1.3),
            new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 })
          );
          metalCrate.position.y = 0.25;
          palletGroup.add(metalCrate);

          const tunaBody = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.9, 8),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.2 })
          );
          tunaBody.rotation.z = Math.PI / 2;
          tunaBody.position.set(0, 0.55, 0);
          palletGroup.add(tunaBody);
        } else if (lowerName.includes('vaccine') || lowerName.includes('biologics')) {
          // 11. mRNA Vaccines & Biologics (Ultra-Cold Cryogenic Dewar)
          const cryoDewar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.45, 0.85, 16),
            new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9, roughness: 0.1 })
          );
          cryoDewar.position.y = 0.42;
          palletGroup.add(cryoDewar);

          const ledHalo = new THREE.Mesh(
            new THREE.TorusGeometry(0.46, 0.03, 8, 24),
            new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.0 })
          );
          ledHalo.rotation.x = Math.PI / 2;
          ledHalo.position.y = 0.85;
          palletGroup.add(ledHalo);
        } else if (lowerName.includes('insulin') || lowerName.includes('pharma')) {
          // 12. Insulin & Specialty Pharma
          const pharmaBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.1, 0.7, 1.1),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.5 })
          );
          pharmaBox.position.y = 0.35;
          palletGroup.add(pharmaBox);

          const cross1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.1, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.8 })
          );
          cross1.position.set(0, 0.35, 0.56);
          pharmaBox.add(cross1);
          const cross2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.4, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.8 })
          );
          cross2.position.set(0, 0.35, 0.56);
          pharmaBox.add(cross2);
        } else if (lowerName.includes('plasma') || lowerName.includes('blood') || lowerName.includes('serum')) {
          // 13. Blood Plasma & Serums
          const plasmaCrate = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.75, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
          );
          plasmaCrate.position.y = 0.38;
          palletGroup.add(plasmaCrate);

          const bioBadge = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.25, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0xe11d48, emissiveIntensity: 0.7 })
          );
          bioBadge.position.set(0, 0.4, 0.61);
          palletGroup.add(bioBadge);
        } else if (lowerName.includes('chocolate') || lowerName.includes('confection')) {
          // 14. Fine Chocolates & Confections
          for (let layer = 0; layer < 2; layer++) {
            const chocBox = new THREE.Mesh(
              new THREE.BoxGeometry(1.1, 0.3, 1.1),
              new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 })
            );
            chocBox.position.y = layer * 0.32 + 0.15;
            palletGroup.add(chocBox);

            const goldRibbon = new THREE.Mesh(
              new THREE.BoxGeometry(1.12, 0.06, 0.2),
              new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
            );
            goldRibbon.position.set(0, layer * 0.32 + 0.15, 0);
            palletGroup.add(goldRibbon);
          }
        } else if (lowerName.includes('floral') || lowerName.includes('flower')) {
          // 15. Fresh Cut Florals (Hydro-Chilled Buckets)
          for (let i = 0; i < 4; i++) {
            const bucket = new THREE.Mesh(
              new THREE.CylinderGeometry(0.2, 0.16, 0.45, 12),
              new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
            );
            bucket.position.set((i % 2 - 0.5) * 0.5, 0.22, (Math.floor(i / 2) - 0.5) * 0.5);
            palletGroup.add(bucket);

            const flowerStem = new THREE.Mesh(
              new THREE.SphereGeometry(0.14, 8, 8),
              new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xf43f5e : 0xd946ef, roughness: 0.5 })
            );
            flowerStem.position.set((i % 2 - 0.5) * 0.5, 0.56, (Math.floor(i / 2) - 0.5) * 0.5);
            palletGroup.add(flowerStem);
          }
        } else {
          // Default Cold Storage Corrugated Cartons
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.85, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4, metalness: 0.2 })
          );
          box.position.y = 0.4;
          box.castShadow = true;
          palletGroup.add(box);
        }

        // 3D Glowing Status Beacon above Pallet
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x10b981 })
        );
        beacon.position.y = 1.05;
        palletGroup.add(beacon);

        cargoGroup.add(palletGroup);
      });
    };

    cargoGroupRef.current = cargoGroup;
    buildCargoModelsRef.current = buildCargoModels;
    buildCargoModels(productName);

    // 10. Automated Guided Vehicle (AGV Floor Robot Moving in Warehouse)
    const agv = new THREE.Group();
    agv.position.set(0, 0.25, 3.5);

    const agvBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 })
    );
    agv.add(agvBody);

    const agvLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    agvLight.position.set(0.7, 0.15, 0);
    agv.add(agvLight);

    scene.add(agv);
    agvRobotRef.current = agv;

    // 11. Cold Airflow Floating Particle Mist (Chiller Stream)
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 12;
      particlePos[i + 1] = Math.random() * 5 + 0.6;
      particlePos[i + 2] = (Math.random() - 0.5) * 12;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.16,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 12. Interactive Orbit & Mouse Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraAngle = 0.85;
    let cameraRadius = 17;
    let cameraHeight = 8.5;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraAngle += deltaX * 0.007;
      cameraHeight = Math.max(2.5, Math.min(14, cameraHeight - deltaY * 0.04));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRadius = Math.max(9, Math.min(26, cameraRadius + e.deltaY * 0.015));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // 13. Active 60FPS Render & Physics Loop
    let animationFrameId: number;
    let agvDirection = 1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentTemp = tempRef.current;
      const currentCooling = coolingLevelRef.current;
      const currentDist = disturbanceRef.current;

      // Smooth Auto-Orbiting if active and not manual dragging
      if (isOrbitingRef.current && !isDragging) {
        cameraAngle += 0.007;
      }

      camera.position.x = Math.sin(cameraAngle) * cameraRadius;
      camera.position.z = Math.cos(cameraAngle) * cameraRadius;
      camera.position.y = cameraHeight;
      camera.lookAt(0, 1.8, 0);

      // Fast Industrial Fan Rotation
      let fanSpeed = 0.15;
      if (currentCooling === 1) fanSpeed = 0.35;
      if (currentCooling === 2) fanSpeed = 0.70;
      if (currentCooling === 3) fanSpeed = 1.25;

      fanBladesRef.current.forEach((fan) => {
        fan.rotation.z += fanSpeed;
      });

      // Airflow Mist Particles Drifting Downward
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < particleCount * 3; i += 3) {
          positions[i] -= (0.035 + currentCooling * 0.045);
          if (positions[i] < 0.2) {
            positions[i] = 5.6; // reset to ceiling chiller level
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // AGV Robot Path Patrol Animation
      if (agvRobotRef.current) {
        agvRobotRef.current.position.x += 0.045 * agvDirection;
        if (agvRobotRef.current.position.x > 4.5) agvDirection = -1;
        if (agvRobotRef.current.position.x < -4.5) agvDirection = 1;
      }

      // Warehouse Sliding Door Animation
      if (doorMeshRef.current) {
        const targetDoorY = (currentDist === 'Door Opening' || currentDist === 'Temperature Spike') ? 5.6 : 2.75;
        doorMeshRef.current.position.y += (targetDoorY - doorMeshRef.current.position.y) * 0.08;
      }

      // Dynamic Thermal Lighting
      if (chamberLightRef.current) {
        if (currentTemp > safeMax + 2.0) {
          chamberLightRef.current.color.setHex(0xef4444); // Crimson Hot Hazard
          chamberLightRef.current.intensity = 5.0 + Math.sin(Date.now() * 0.008) * 2.0;
        } else if (currentTemp > safeMax) {
          chamberLightRef.current.color.setHex(0xf59e0b); // Amber Warning
          chamberLightRef.current.intensity = 4.2;
        } else if (currentTemp < safeMin) {
          chamberLightRef.current.color.setHex(0x6366f1); // Deep Cold
          chamberLightRef.current.intensity = 3.6;
        } else {
          chamberLightRef.current.color.setHex(0x06b6d4); // Optimal Cyan/Ice
          chamberLightRef.current.intensity = 4.0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer) return;
      const newWidth = mountRef.current.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [productName, safeMin, safeMax]);

  const isTooHot = temperature > safeMax;
  const isCriticallyHot = temperature > safeMax + 2.5;
  const isOptimal = temperature >= safeMin && temperature <= safeMax;

  return (
    <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-white">
      {/* 3D Header Bar with Real-Time Telemetry Controls */}
      <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10 relative backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Interactive 3D Cold Storage Digital Twin</span>
              {isLiveMode ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE 1-HZ STREAM ({activeUnitId})</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                  STEP REPLAY: T+{(currentStep ?? 0)} / {totalSteps ?? 100}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-300">
              Active Commodity: <strong className="text-cyan-300">{productName}</strong> | Safe Thermal Bounds: {safeMin}°C ~ {safeMax}°C
            </p>
          </div>
        </div>

        {/* Orbit, Mode & Status Controls */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {onToggleMode && (
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => onToggleMode('live')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  isLiveMode
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-slate-950' : 'bg-slate-500'}`} />
                <span>Live Feed</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleMode('replay')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  !isLiveMode
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Replay</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOrbiting(!isOrbiting)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isOrbiting
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isOrbiting ? 'Auto-Orbiting' : 'Orbit Paused'}</span>
          </button>

          <div className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 ${
            isOptimal
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : isCriticallyHot
              ? 'bg-rose-500/30 text-rose-300 border-rose-500/50 animate-pulse'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {isOptimal ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{isOptimal ? 'Optimal State' : isCriticallyHot ? 'Thermal Hazard' : 'Warning'}</span>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div className="relative w-full h-[480px] cursor-grab active:cursor-grabbing" ref={mountRef}>
        {/* Floating 3D Telemetry HUD (Left) */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2.5">
          <div className="bg-slate-950/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/90 shadow-2xl min-w-[180px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">3D Sensor Temp</span>
            <div className={`text-2xl font-mono font-black ${
              isOptimal ? 'text-cyan-400' : isCriticallyHot ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {temperature.toFixed(2)} °C
            </div>
            <span className="text-[10px] text-slate-400">
              Safe Band: {safeMin}°C ~ {safeMax}°C
            </span>
          </div>

          <div className="bg-slate-950/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/90 shadow-2xl min-w-[180px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evaporator Action</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {actionName}
            </div>
            <span className="text-[10px] text-slate-400">
              Chiller: <strong className="text-cyan-300">Level {coolingLevel} ({coolingLevel === 3 ? 'Turbo' : coolingLevel === 2 ? 'High' : coolingLevel === 1 ? 'Eco' : 'Off'})</strong>
            </span>
          </div>
        </div>

        {/* Floating Spoilage & Humidity HUD (Right) */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none flex flex-col gap-2.5">
          <div className="bg-slate-950/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/90 shadow-2xl text-right min-w-[170px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cumulative Spoilage</span>
            <div className="text-2xl font-mono font-black text-purple-400">
              {Math.min(100, Math.max(0, spoilagePercent > 1 ? spoilagePercent : spoilagePercent * 100)).toFixed(2)} %
            </div>
            <span className="text-[10px] text-slate-400">
              Chamber Humidity: <strong className="text-teal-300">{humidity.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* 3D Drag Guide Pill (Bottom) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-4 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-slate-700/90 text-xs text-slate-300 flex items-center gap-2 shadow-xl">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Click & Drag to Orbit 3D Room • Scroll Wheel to Zoom</span>
        </div>
      </div>

      {/* Interactive Physical Disturbance Bar (Bottom) */}
      {onInjectDisturbance && (
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">3D Interactive Hazards:</span>
            <button
              onClick={() => onInjectDisturbance('Door Opening')}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Slide Door Open (+4°C)</span>
            </button>
            <button
              onClick={() => onInjectDisturbance('Temperature Spike')}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>External Heatwave (+6°C)</span>
            </button>
            <button
              onClick={() => onInjectDisturbance('Cooling Capacity Reduction')}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Compressor Brownout 50%</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Evaporator Health: <strong className="text-slate-200">{coolingCapacity.toFixed(0)}%</strong>
          </div>
        </div>
      )}
    </div>
  );
};
