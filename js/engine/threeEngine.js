import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { config } from '../../config.js';
import { Logger } from '../utils/logger.js';

export class ThreeEngine {
    constructor() {
        this.logger = new Logger('ThreeEngine');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
    }
    
    async init(container, cameraConfig) {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                cameraConfig.fov,
                container.clientWidth / container.clientHeight,
                cameraConfig.near,
                cameraConfig.far
            );
            this.camera.position.set(
                cameraConfig.position.x,
                cameraConfig.position.y,
                cameraConfig.position.z
            );
            this.camera.lookAt(
                cameraConfig.lookAt.x,
                cameraConfig.lookAt.y,
                cameraConfig.lookAt.z
            );
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: config.renderer.antialias,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(Math.min(config.renderer.pixelRatio, 2));
            this.renderer.shadowMap.enabled = config.renderer.shadows;
            
            // Set tone mapping and output encoding
            if (config.renderer.toneMapping === 'ACESFilmic') {
                this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            } else if (config.renderer.toneMapping === 'Linear') {
                this.renderer.toneMapping = THREE.LinearToneMapping;
            } else if (config.renderer.toneMapping === 'Reinhard') {
                this.renderer.toneMapping = THREE.ReinhardToneMapping;
            } else if (config.renderer.toneMapping === 'Cineon') {
                this.renderer.toneMapping = THREE.CineonToneMapping;
            }
            
            if (config.renderer.outputEncoding === 'sRGB') {
                this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            } else if (config.renderer.outputEncoding === 'Linear') {
                this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
            }
            
            // Add renderer to container
            container.appendChild(this.renderer.domElement);
            
            // Create controls
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0x404040, 1);
            this.scene.add(ambientLight);
            
            // Add directional light
            const dirLight = new THREE.DirectionalLight(0xffffff, 1);
            dirLight.position.set(10, 10, 10);
            dirLight.castShadow = config.renderer.shadows;
            if (dirLight.castShadow) {
                dirLight.shadow.mapSize.width = config.renderer.shadowResolution;
                dirLight.shadow.mapSize.height = config.renderer.shadowResolution;
                const d = 20;
                dirLight.shadow.camera.left = -d;
                dirLight.shadow.camera.right = d;
                dirLight.shadow.camera.top = d;
                dirLight.shadow.camera.bottom = -d;
                dirLight.shadow.camera.near = 0.5;
                dirLight.shadow.camera.far = 50;
            }
            this.scene.add(dirLight);
            
            this.logger.info('ThreeEngine initialized successfully');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize ThreeEngine:', error);
            throw error;
        }
    }
    
    update() {
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    resize() {
        if (!this.camera || !this.renderer) return;
        
        const container = this.renderer.domElement.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    createObject(type, parameters = {}) {
        switch (type) {
            case 'box':
                const geometry = new THREE.BoxGeometry(
                    parameters.width || 1,
                    parameters.height || 1,
                    parameters.depth || 1
                );
                const material = new THREE.MeshStandardMaterial({
                    color: parameters.color || 0xffffff
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(parameters.position || new THREE.Vector3());
                mesh.castShadow = parameters.castShadow !== undefined ? parameters.castShadow : true;
                mesh.receiveShadow = parameters.receiveShadow !== undefined ? parameters.receiveShadow : true;
                
                if (parameters.addToScene !== false) {
                    this.scene.add(mesh);
                }
                
                return mesh;
                
            case 'plane':
                const planeGeometry = new THREE.PlaneGeometry(
                    parameters.width || 10,
                    parameters.height || 10
                );
                const planeMaterial = new THREE.MeshStandardMaterial({
                    color: parameters.color || 0xffffff,
                    side: THREE.DoubleSide
                });
                const plane = new THREE.Mesh(planeGeometry, planeMaterial);
                plane.rotation.x = -Math.PI / 2;
                plane.position.copy(parameters.position || new THREE.Vector3());
                plane.receiveShadow = parameters.receiveShadow !== undefined ? parameters.receiveShadow : true;
                
                if (parameters.addToScene !== false) {
                    this.scene.add(plane);
                }
                
                return plane;
                
            default:
                this.logger.warn(`Unknown object type: ${type}`);
                return null;
        }
    }
}

