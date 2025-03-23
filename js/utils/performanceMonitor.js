import { config } from '../../config.js';

export class PerformanceMonitor {
    constructor() {
        this.fpsElement = document.getElementById('performance-stats');
        this.frames = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.frameTime = 0;
        this.memory = null;
        
        if (window.performance && window.performance.memory) {
            this.memory = window.performance.memory;
        }
    }
    
    start() {
        if (config.debug.showFPS) {
            this.fpsElement.style.display = 'block';
        } else {
            this.fpsElement.style.display = 'none';
        }
    }
    
    update() {
        this.frames++;
        const time = performance.now();
        const elapsed = time - this.lastTime;
        
        // Update FPS every second
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frameTime = elapsed / this.frames;
            this.frames = 0;
            this.lastTime = time;
            
            if (config.debug.showFPS) {
                let statsText = `FPS: ${this.fps} | Frame Time: ${this.frameTime.toFixed(2)}ms`;
                
                if (this.memory) {
                    const usedMemory = Math.round(this.memory.usedJSHeapSize / (1024 * 1024));
                    const totalMemory = Math.round(this.memory.totalJSHeapSize / (1024 * 1024));
                    statsText += ` | Memory: ${usedMemory}MB / ${totalMemory}MB`;
                }
                
                this.fpsElement.textContent = statsText;
            }
        }
    }
}

