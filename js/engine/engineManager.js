import { ThreeEngine } from './threeEngine.js';
import { BabylonEngine } from './babylonEngine.js';
import { config, cameraConfig } from '../../config.js';
import { Logger } from '../utils/logger.js';

export class EngineManager {
    constructor() {
        this.logger = new Logger('EngineManager');
        this.engine = null;
        this.camera = null;
        this.renderer = null;
        this.scene = null;
    }
    
    async init(container) {
        // Determine which engine to use
        const engine = this.determineEngine();
        this.logger.info(`Using ${engine} engine`);
        
        try {
            if (engine === 'three') {
                this.engine = new ThreeEngine();
            } else if (engine === 'babylon') {
                this.engine = new BabylonEngine();
            } else {
                throw new Error(`Unknown engine type: ${engine}`);
            }
            
            // Initialize the engine
            await this.engine.init(container, cameraConfig);
            
            // Store references to common objects
            this.camera = this.engine.camera;
            this.renderer = this.engine.renderer;
            this.scene = this.engine.scene;
            
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize engine:', error);
            
            // Fallback to another engine if the first choice fails
            if (engine === 'three' && config.renderer.engine !== 'babylon') {
                this.logger.warn('Falling back to Babylon.js engine');
                try {
                    this.engine = new BabylonEngine();
                    await this.engine.init(container, cameraConfig);
                    
                    this.camera = this.engine.camera;
                    this.renderer = this.engine.renderer;
                    this.scene = this.engine.scene;
                    
                    return true;
                } catch (fallbackError) {
                    throw new Error('Failed to initialize fallback engine: ' + fallbackError.message);
                }
            } else if (engine === 'babylon' && config.renderer.engine !== 'three') {
                this.logger.warn('Falling back to Three.js engine');
                try {
                    this.engine = new ThreeEngine();
                    await this.engine.init(container, cameraConfig);
                    
                    this.camera = this.engine.camera;
                    this.renderer = this.engine.renderer;
                    this.scene = this.engine.scene;
                    
                    return true;
                } catch (fallbackError) {
                    throw new Error('Failed to initialize fallback engine: ' + fallbackError.message);
                }
            }
            
            throw error;
        }
    }
    
    determineEngine() {
        if (config.renderer.engine === 'auto') {
            // Simple detection based on WebGL capabilities
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2');
                if (gl) {
                    return 'three'; // Default to Three.js if WebGL2 is available
                } else {
                    return 'babylon'; // Fall back to Babylon.js which might handle WebGL1 better
                }
            } catch (e) {
                return 'three'; // Default to Three.js
            }
        }
        
        return config.renderer.engine;
    }
    
    update() {
        if (this.engine) {
            this.engine.update();
        }
    }
    
    resize() {
        if (this.engine) {
            this.engine.resize();
        }
    }
    
    createObject(type, parameters) {
        if (this.engine) {
            return this.engine.createObject(type, parameters);
        }
        return null;
    }
}

