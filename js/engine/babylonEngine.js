import * as BABYLON from 'babylon';
import { config } from '../../config.js';
import { Logger } from '../utils/logger.js';

export class BabylonEngine {
    constructor() {
        this.logger = new Logger('BabylonEngine');
        this.scene = null;
        this.camera = null;
        this.engine = null;
        this.canvas = null;
    }
    
    async init(container, cameraConfig) {
        try {
            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
            
            // Create engine
            this.engine = new BABYLON.Engine(this.canvas, config.renderer.antialias, {
                preserveDrawingBuffer: true,
                stencil: true
            });
            
            // Create scene
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color3(0.53, 0.81, 0.92); // Sky blue
            
            // Create camera
            this.camera = new BABYLON.ArcRotateCamera(
                'camera',
                -Math.PI / 2,
                Math.PI / 3,
                cameraConfig.position.z,
                new BABYLON.Vector3(cameraConfig.lookAt.x, cameraConfig.lookAt.y, cameraConfig.lookAt.z),
                this.scene
            );
            this.camera.setPosition(new BABYLON.Vector3(cameraConfig.position.x, cameraConfig.position.y, cameraConfig.position.z));
            this.camera.attachControl(this.canvas, true);
            this.camera.lowerRadiusLimit = 1;
            this.camera.upperRadiusLimit = 100;
            
            // Add lights
            const ambientLight = new BABYLON.HemisphericLight(
                'ambientLight',
                new BABYLON.Vector3(0, 1, 0),
                this.scene
            );
            ambientLight.intensity = 0.5;
            
            const dirLight = new BABYLON.DirectionalLight(
                'dirLight',
                new BABYLON.Vector3(-1, -1, -1),
                this.scene
            );
            dirLight.position = new BABYLON.Vector3(10, 10, 10);
            dirLight.intensity = 0.7;
            
            // Setup shadows if enabled
            if (config.renderer.shadows) {
                const shadowGenerator = new BABYLON.ShadowGenerator(
                    config.renderer.shadowResolution,
                    dirLight
                );
                shadowGenerator.useBlurExponentialShadowMap = true;
                shadowGenerator.blurKernel = 32;
                this.shadowGenerator = shadowGenerator;
            }
            
            // Set up resize handler
            this.engine.onResizeObservable.add(() => {
                this.engine.resize();
            });
            
            this.logger.info('BabylonEngine initialized successfully');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize BabylonEngine:', error);
            throw error;
        }
    }
    
    update() {
        if (this.scene && this.engine) {
            this.scene.render();
        }
    }
    
    resize() {
        if (this.engine) {
            this.engine.resize();
        }
    }
    
    createObject(type, parameters = {}) {
        switch (type) {
            case 'box':
                const box = BABYLON.MeshBuilder.CreateBox('box', {
                    width: parameters.width || 1,
                    height: parameters.height || 1,
                    depth: parameters.depth || 1
                }, this.scene);
                
                const material = new BABYLON.StandardMaterial('material', this.scene);
                if (parameters.color) {
                    const color = new BABYLON.Color3.FromHexString(parameters.color.toString(16));
                    material.diffuseColor = color;
                }
                box.material = material;
                
                if (parameters.position) {
                    box.position = new BABYLON.Vector3(
                        parameters.position.x || 0,
                        parameters.position.y || 0,
                        parameters.position.z || 0
                    );
                }
                
                if (config.renderer.shadows && this.shadowGenerator && parameters.castShadow !== false) {
                    this.shadowGenerator.addShadowCaster(box);
                }
                
                return box;
                
            case 'plane':
                const plane = BABYLON.MeshBuilder.CreateGround('plane', {
                    width: parameters.width || 10,
                    height: parameters.height || 10
                }, this.scene);
                
                const planeMaterial = new BABYLON.StandardMaterial('material', this.scene);
                if (parameters.color) {
                    const color = new BABYLON.Color3.FromHexString(parameters.color.toString(16));
                    planeMaterial.diffuseColor = color;
                }
                plane.material = planeMaterial;
                
                if (parameters.position) {
                    plane.position = new BABYLON.Vector3(
                        parameters.position.x || 0,
                        parameters.position.y || 0,
                        parameters.position.z || 0
                    );
                }
                
                if (parameters.receiveShadow !== false) {
                    plane.receiveShadows = true;
                }
                
                return plane;
                
            default:
                this.logger.warn(`Unknown object type: ${type}`);
                return null;
        }
    }
}

