import { SimplexNoise } from '../utils/simplexNoise.js';
import { config } from '../../config.js';
import { Logger } from '../utils/logger.js';

export class ChunkManager {
    constructor(engineManager, chunkSize, renderDistance, seed) {
        this.logger = new Logger('ChunkManager');
        this.engineManager = engineManager;
        this.chunkSize = chunkSize;
        this.renderDistance = renderDistance;
        this.seed = seed;
        
        this.chunks = new Map(); // Map to store loaded chunks
        this.chunkQueue = []; // Queue for chunks to be generated
        this.noise = new SimplexNoise(seed);
        
        this.lastPlayerChunkPos = { x: Infinity, z: Infinity };
        
        this.logger.info(`ChunkManager initialized with chunk size ${chunkSize}, render distance ${renderDistance}`);
    }
    
    update(cameraPosition) {
        // Get the chunk coordinates of the camera
        const chunkX = Math.floor(cameraPosition.x / this.chunkSize);
        const chunkZ = Math.floor(cameraPosition.z / this.chunkSize);
        
        // If player moved to a new chunk, update visible chunks
        if (chunkX !== this.lastPlayerChunkPos.x || chunkZ !== this.lastPlayerChunkPos.z) {
            this.lastPlayerChunkPos = { x: chunkX, z: chunkZ };
            this.updateVisibleChunks(chunkX, chunkZ);
        }
        
        // Process chunk generation queue
        this.processChunkQueue();
    }
    
    updateVisibleChunks(centerX, centerZ) {
        // Create a set of chunk positions that should be visible
        const visibleChunks = new Set();
        
        for (let x = centerX - this.renderDistance; x <= centerX + this.renderDistance; x++) {
            for (let z = centerZ - this.renderDistance; z <= centerZ + this.renderDistance; z++) {
                const key = `${x},${z}`;
                visibleChunks.add(key);
                
                // If the chunk doesn't exist, add it to the generation queue
                if (!this.chunks.has(key)) {
                    this.chunkQueue.push({ x, z });
                }
            }
        }
        
        // Unload chunks that are no longer visible
        for (const [key, chunk] of this.chunks.entries()) {
            if (!visibleChunks.has(key)) {
                // Remove the chunk from the scene
                if (chunk.mesh) {
                    this.engineManager.scene.remove(chunk.mesh);
                }
                this.chunks.delete(key);
                this.logger.debug(`Unloaded chunk at ${key}`);
            }
        }
        
        // Sort the chunk queue by distance to the player for priority loading
        this.chunkQueue.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - centerX, 2) + Math.pow(a.z - centerZ, 2));
            const distB = Math.sqrt(Math.pow(b.x - centerX, 2) + Math.pow(b.z - centerZ, 2));
            return distA - distB;
        });
    }
    
    processChunkQueue() {
        if (this.chunkQueue.length === 0) return;
        
        // Process a limited number of chunks per frame to avoid freezing
        const maxChunksPerFrame = config.performance.throttleChunkGeneration ? 1 : Infinity;
        let chunksProcessed = 0;
        
        while (this.chunkQueue.length > 0 && chunksProcessed < maxChunksPerFrame) {
            const { x, z } = this.chunkQueue.shift();
            this.generateChunk(x, z);
            chunksProcessed++;
        }
    }
    
    generateChunk(x, z) {
        const key = `${x},${z}`;
        
        // Skip if the chunk already exists
        if (this.chunks.has(key)) return;
        
        // Create a chunk with terrain based on noise
        const worldX = x * this.chunkSize;
        const worldZ = z * this.chunkSize;
        
        // Create a plane for the chunk
        const chunk = {
            x,
            z,
            key,
            worldX,
            worldZ,
            mesh: null
        };
        
        if (config.world.generateTerrain) {
            // Create a heightmap for the terrain
            const resolution = 1; // Points per world unit
            const verticesPerSide = this.chunkSize * resolution + 1;
            
            // Create vertices
            const vertices = [];
            const colors = [];
            
            for (let i = 0; i <= verticesPerSide; i++) {
                for (let j = 0; j <= verticesPerSide; j++) {
                    const xPos = worldX + (i / resolution);
                    const zPos = worldZ + (j / resolution);
                    
                    // Generate height using noise
                    let height = this.noise.noise2D(xPos * 0.05, zPos * 0.05);
                    height = (height + 1) * 0.5 * config.world.terrainHeight;
                    
                    vertices.push(xPos, height, zPos);
                    
                    // Add color based on height
                    if (height < 1) {
                        // Deep water
                        colors.push(0.1, 0.3, 0.6);
                    } else if (height < 2) {
                        // Shallow water
                        colors.push(0.2, 0.5, 0.7);
                    } else if (height < 3) {
                        // Sand
                        colors.push(0.95, 0.9, 0.6);
                    } else if (height < 7) {
                        // Grass
                        const t = (height - 3) / 4;
                        colors.push(0.2 + 0.1 * t, 0.6 - 0.2 * t, 0.2);
                    } else {
                        // Rock
                        const t = Math.min((height - 7) / 3, 1);
                        colors.push(0.5 - 0.15 * t, 0.5 - 0.15 * t, 0.5 - 0.1 * t);
                    }
                }
            }
            
            // Create faces
            const indices = [];
            
            for (let i = 0; i < verticesPerSide - 1; i++) {
                for (let j = 0; j < verticesPerSide - 1; j++) {
                    const a = i * (verticesPerSide) + j;
                    const b = i * (verticesPerSide) + (j + 1);
                    const c = (i + 1) * (verticesPerSide) + j;
                    const d = (i + 1) * (verticesPerSide) + (j + 1);
                    
                    indices.push(a, b, c);
                    indices.push(c, b, d);
                }
            }
            
            // Create mesh based on the engine being used
            if (this.engineManager.engine.constructor.name === 'ThreeEngine') {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                geometry.setIndex(indices);
                geometry.computeVertexNormals();
                
                const material = new THREE.MeshStandardMaterial({
                    vertexColors: true,
                    roughness: 0.8,
                    metalness: 0.2
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                this.engineManager.scene.add(mesh);
                chunk.mesh = mesh;
            } else if (this.engineManager.engine.constructor.name === 'BabylonEngine') {
                // Create Babylon.js custom mesh
                const vertexData = new BABYLON.VertexData();
                vertexData.positions = vertices;
                vertexData.indices = indices;
                
                // Convert colors to Babylon format
                const babylonColors = [];
                for (let i = 0; i < colors.length; i += 3) {
                    babylonColors.push(colors[i], colors[i + 1], colors[i + 2], 1);
                }
                vertexData.colors = babylonColors;
                
                // Compute normals
                BABYLON.VertexData.ComputeNormals(vertices, indices, vertexData.normals);
                
                const mesh = new BABYLON.Mesh(`chunk-${key}`, this.engineManager.scene);
                vertexData.applyToMesh(mesh);
                
                const material = new BABYLON.StandardMaterial(`chunk-material-${key}`, this.engineManager.scene);
                material.useVertexColors = true;
                material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                mesh.material = material;
                
                chunk.mesh = mesh;
            }
        } else {
            // Create a flat plane for the chunk
            const parameters = {
                width: this.chunkSize,
                height: this.chunkSize,
                position: { x: worldX + this.chunkSize / 2, y: 0, z: worldZ + this.chunkSize / 2 },
                color: 0x44aa44
            };
            
            chunk.mesh = this.engineManager.createObject('plane', parameters);
        }
        
        // Debug visualization of chunk borders
        if (config.debug.showChunkBorders) {
            // Add wireframe helper to visualize chunk borders
            if (this.engineManager.engine.constructor.name === 'ThreeEngine') {
                const borderGeometry = new THREE.EdgesGeometry(chunk.mesh.geometry);
                const borderMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
                const wireframe = new THREE.LineSegments(borderGeometry, borderMaterial);
                chunk.mesh.add(wireframe);
            }
        }
        
        // Store the chunk
        this.chunks.set(key, chunk);
        this.logger.debug(`Generated chunk at ${key}`);
    }
}

