// A fast javascript implementation of simplex noise by Jonas Wagner
// Based on https://github.com/josephg/noisejs

export class SimplexNoise {
    constructor(seed) {
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];
        
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(this.randomWithSeed(seed) * 256);
        }
        
        // To remove the need for index wrapping, double the permutation table length
        this.perm = new Array(512);
        this.gradP = new Array(512);
        
        // This isn't a very good seeding function, but it works ok. It supports 2^16
        // different seed values. Write something better if you need more seeds.
        // Add the seed to the p array
        const seedValue = seed || 0;
        const random = this.randomWithSeed(seedValue);
        
        for (let i = 0; i < 256; i++) {
            let v;
            if (i & 1) {
                v = this.p[i] ^ (random * 255);
            } else {
                v = this.p[i] ^ ((random * 65280) & 0xFF);
            }
            
            this.perm[i] = this.perm[i + 256] = v;
            this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
        }
    }
    
    // Simple seeded random number generator (not very high quality)
    randomWithSeed(seed) {
        let value = seed || 0;
        return function() {
            value = Math.sin(value) * 10000;
            return value - Math.floor(value);
        }();
    }
    
    // 2D simplex noise
    noise2D(xin, yin) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        
        let n0, n1, n2; // Noise contributions from the three corners
        
        // Skew the input space to determine which simplex cell we're in
        const s = (xin + yin) * F2; // Hairy factor for 2D
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const x0 = xin - i + t; // The x,y distances from the cell origin
        const y0 = yin - j + t;
        
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
            i1 = 1;
            j1 = 0;
        } else { // upper triangle, YX order: (0,0)->(0,1)->(1,1)
            i1 = 0;
            j1 = 1;
        }
        
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1 + 2 * G2;
        
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot2(this.gradP[ii + this.perm[jj]], x0, y0);
        }
        
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot2(this.gradP[ii + i1 + this.perm[jj + j1]], x1, y1);
        }
        
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot2(this.gradP[ii + 1 + this.perm[jj + 1]], x2, y2);
        }
        
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70 * (n0 + n1 + n2);
    }
    
    // 2D dot product helper
    dot2(g, x, y) {
        return g[0] * x + g[1] * y;
    }
}

