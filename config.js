// Game Engine Configuration
export const config = {
    // Rendering Engine
    renderer: {
        engine: 'three', // Options: 'three', 'babylon', 'auto'
        antialias: true,
        shadows: true,
        shadowResolution: 1024,
        pixelRatio: window.devicePixelRatio || 1,
        toneMapping: 'ACESFilmic', // Options: 'None', 'Linear', 'Reinhard', 'Cineon', 'ACESFilmic'
        outputEncoding: 'sRGB', // Options: 'Linear', 'sRGB', 'Gamma'
    },
    
    // Physics Engine
    physics: {
        engine: 'none', // Options: 'cannon-es', 'rapier', 'ammo', 'physx', 'babylon-physics', 'none'
        gravity: { x: 0, y: -9.81, z: 0 },
        enableDebugRenderer: false,
    },

    // World Generation
    world: {
        chunkSize: 16, // Size of each chunk in world units
        renderDistance: 5, // Number of chunks to render in each direction from the camera
        seed: 12345, // Seed for procedural generation
        terrainHeight: 10, // Maximum terrain height
        generateTerrain: true, // Whether to generate terrain or flat chunks
    },
    
    // Performance
    performance: {
        targetFPS: 60,
        useLOD: true, // Level of Detail for distant objects
        useOctree: true, // Use octree for scene organization
        useFrustumCulling: true,
        useInstancing: true, // Use instanced meshes for similar objects
        throttleChunkGeneration: true, // Spread chunk generation over multiple frames
    },
    
    // Debug and Development
    debug: {
        showFPS: true,
        showChunkBorders: false,
        logLevel: 'warn', // Options: 'debug', 'info', 'warn', 'error', 'none'
        tweakpane: true, // Show settings panel
    }
};

// Default camera settings
export const cameraConfig = {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 15, z: 25 },
    lookAt: { x: 0, y: 0, z: 0 },
    movementSpeed: 10,
    rotationSpeed: 2,
};

