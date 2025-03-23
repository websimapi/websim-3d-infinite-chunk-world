import { config, cameraConfig } from '../config.js';
import { EngineManager } from './engine/engineManager.js';
import { ChunkManager } from './world/chunkManager.js';
import { PerformanceMonitor } from './utils/performanceMonitor.js';
import { initSettingsPanel } from './ui/settingsPanel.js';

// Main Application Class
class Application {
    constructor() {
        // Initialize engine manager
        this.engineManager = new EngineManager();
        
        // Create necessary managers and systems
        this.performanceMonitor = new PerformanceMonitor();
        
        // Setup DOM elements
        this.container = document.getElementById('renderCanvas');
        this.loadingElement = document.getElementById('loading');
        
        // Setup event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    async init() {
        try {
            // Initialize the rendering engine
            await this.engineManager.init(this.container);
            
            // Initialize the chunk manager
            this.chunkManager = new ChunkManager(
                this.engineManager,
                config.world.chunkSize,
                config.world.renderDistance,
                config.world.seed
            );
            
            // Setup settings panel
            if (config.debug.tweakpane) {
                await initSettingsPanel(this);
            }
            
            // Hide loading screen
            this.loadingElement.style.opacity = '0';
            setTimeout(() => {
                this.loadingElement.style.display = 'none';
            }, 500);
            
            // Start the render loop
            this.performanceMonitor.start();
            this.update();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.loadingElement.textContent = 'Error loading: ' + error.message;
        }
    }
    
    update() {
        // Update performance stats
        this.performanceMonitor.update();
        
        // Update chunk manager
        this.chunkManager.update(this.engineManager.camera.position);
        
        // Update and render the engine
        this.engineManager.update();
        
        // Schedule next frame
        requestAnimationFrame(this.update.bind(this));
    }
    
    onWindowResize() {
        // Handle window resize
        this.engineManager.resize();
    }
}

// Initialize and start the application
const app = new Application();
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

