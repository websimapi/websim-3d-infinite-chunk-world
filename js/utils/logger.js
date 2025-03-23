import { config } from '../../config.js';

export class Logger {
    constructor(context) {
        this.context = context;
        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            none: 4
        };
        this.currentLevel = this.logLevels[config.debug.logLevel] || this.logLevels.warn;
    }
    
    debug(...args) {
        if (this.currentLevel <= this.logLevels.debug) {
            console.debug(`[${this.context}]`, ...args);
        }
    }
    
    info(...args) {
        if (this.currentLevel <= this.logLevels.info) {
            console.info(`[${this.context}]`, ...args);
        }
    }
    
    warn(...args) {
        if (this.currentLevel <= this.logLevels.warn) {
            console.warn(`[${this.context}]`, ...args);
        }
    }
    
    error(...args) {
        if (this.currentLevel <= this.logLevels.error) {
            console.error(`[${this.context}]`, ...args);
        }
    }
}

