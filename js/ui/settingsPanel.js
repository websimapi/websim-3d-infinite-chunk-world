import { config, cameraConfig } from '../../config.js';
import { Pane } from 'tweakpane';

export async function initSettingsPanel(app) {
    const settingsContainer = document.getElementById('settings-panel');
    
    // Create Tweakpane
    const pane = new Pane({
        container: settingsContainer,
        title: 'Engine Settings'
    });
    
    // Renderer settings
    const rendererFolder = pane.addFolder({ title: 'Renderer' });
    
    rendererFolder.addInput(config.renderer, 'engine', {
        options: {
            Auto: 'auto',
            'Three.js': 'three',
            'Babylon.js': 'babylon'
        },
        label: 'Engine'
    });
    
    rendererFolder.addInput(config.renderer, 'antialias', { label: 'Antialiasing' });
    rendererFolder.addInput(config.renderer, 'shadows', { label: 'Shadows' });
    rendererFolder.addInput(config.renderer, 'shadowResolution', {
        min: 512,
        max: 4096,
        step: 512,
        label: 'Shadow Res.'
    });
    
    rendererFolder.addInput(config.renderer, 'toneMapping', {
        options: {
            None: 'None',
            Linear: 'Linear',
            Reinhard: 'Reinhard',
            Cineon: 'Cineon',
            ACESFilmic: 'ACESFilmic'
        },
        label: 'Tone Mapping'
    });
    
    // World settings
    const worldFolder = pane.addFolder({ title: 'World Generation' });
    
    worldFolder.addInput(config.world, 'seed', {
        label: 'Seed',
        min: 0,
        max: 99999,
        step: 1
    });
    
    worldFolder.addInput(config.world, 'chunkSize', {
        label: 'Chunk Size',
        min: 8,
        max: 64,
        step: 8
    });
    
    worldFolder.addInput(config.world, 'renderDistance', {
        label: 'Render Distance',
        min: 1,
        max: 15,
        step: 1
    });
    
    worldFolder.addInput(config.world, 'terrainHeight', {
        label: 'Terrain Height',
        min: 1,
        max: 50,
        step: 1
    });
    
    worldFolder.addInput(config.world, 'generateTerrain', { label: 'Generate Terrain' });
    
    // Performance settings
    const performanceFolder = pane.addFolder({ title: 'Performance' });
    
    performanceFolder.addInput(config.performance, 'targetFPS', {
        label: 'Target FPS',
        min: 30,
        max: 144,
        step: 1
    });
    
    performanceFolder.addInput(config.performance, 'useLOD', { label: 'Use LOD' });
    performanceFolder.addInput(config.performance, 'throttleChunkGeneration', { label: 'Throttle Chunks' });
    
    // Debug settings
    const debugFolder = pane.addFolder({ title: 'Debug' });
    
    debugFolder.addInput(config.debug, 'showFPS', { label: 'Show FPS' });
    debugFolder.addInput(config.debug, 'showChunkBorders', { label: 'Show Chunks' });
    debugFolder.addInput(config.debug, 'logLevel', {
        options: {
            Debug: 'debug',
            Info: 'info',
            Warning: 'warn',
            Error: 'error',
            None: 'none'
        },
        label: 'Log Level'
    });
    
    // Add a button to restart the engine
    pane.addButton({ title: 'Restart Engine' }).on('click', () => {
        location.reload();
    });
    
    // Apply changes immediately
    pane.on('change', () => {
        // Update FPS display settings
        if (app.performanceMonitor) {
            if (config.debug.showFPS) {
                document.getElementById('performance-stats').style.display = 'block';
            } else {
                document.getElementById('performance-stats').style.display = 'none';
            }
        }
    });
    
    return pane;
}

