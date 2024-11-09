import { BlurFilter, Graphics } from 'pixi.js';
import { IVector } from './IVector';
import { constrain, lerpColor, map, random, skewedRandom } from './math';

const generate = () => {
    const freq = random(0.05, 0.5);
    const phase = random(0, Math.PI * 2);

    return (t: number) => {
        return map(Math.sin(freq * t + phase), -1, 1, 0.5, 1);
    };
}

export const blurFilters = [
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter(),
    new BlurFilter()
];

blurFilters.forEach(filter => {
    filter.strength = random() > 0.1 ? skewedRandom(5, 50, 5) : 5;
    filter.quality = 4;
});

export class Particle {
    readonly graphics: Graphics = new Graphics();
    readonly blurFilterIndex: number = Math.floor(random(0, blurFilters.length));

    index: number = -1;
    pos: IVector;
    vel: IVector;
    acc: IVector;
    lifetime: number;
    timer: number = 0;

    readonly baseo: number;
    readonly breathing: (t: number) => number;
    readonly maxLifetime: number;
    readonly jump: boolean;
    readonly fadeIn: number;
    readonly fadeOut: number;
    readonly size: number;
    readonly color: number;

    constructor(x: number, y: number, jump: boolean) {
        this.pos = { x, y };
        this.jump = jump;

        let speed = skewedRandom(0.05, 0.5, 3) / 10;
        let angle = random(0, Math.PI * 2);
        this.vel = {
            x: speed * Math.cos(angle),
            y: speed * Math.sin(angle)
        };

        this.acc = { x: 0, y: 0 };

        let cr = random() < 0.5;

        this.baseo = cr ? 0.5 : skewedRandom(0.5, 1, 0.1);
        this.breathing = generate();
        this.maxLifetime = skewedRandom(30, 60, 0.5);
        this.lifetime = this.maxLifetime;
        this.fadeIn = this.maxLifetime * random(0.1, 0.15);
        this.fadeOut = this.maxLifetime * random(0.1, 0.15);

        this.size = 20 + random(0, 50) + skewedRandom(0, 100, 20);
        let v = cr ? 0x000000 : 0xffffff;
        this.color = random() < 0.2 ? lerpColor(v, 0x00ff00, skewedRandom(0, 1, 2)) : v;

        this.graphics.filters = [ blurFilters[this.blurFilterIndex] ];

        this.graphics
            .circle(0, 0, this.size)
            .fill({ color: this.color });

        this.graphics.position.set(this.pos.x, this.pos.y);
        this.graphics.alpha = 0;
    }

    get opacity() {
        // Start with breathing value
        let val = this.breathing(this.timer) * this.baseo;

        // Apply fade-in
        if (!this.jump && this.lifetime > this.maxLifetime - this.fadeIn) {
            const fadeInProgress = map(
                constrain(this.lifetime, this.maxLifetime - this.fadeIn, this.maxLifetime),
                this.maxLifetime - this.fadeIn,
                this.maxLifetime,
                1,
                0
            );
            val *= fadeInProgress;
        }

        // Apply fade-out
        if (this.lifetime < this.fadeOut) {
            const fadeOutProgress = map(
                constrain(this.lifetime, 0, this.fadeOut),
                this.fadeOut,
                0,
                1,
                0
            );
            val *= fadeOutProgress;
        }

        // Ensure val is within [0, 1]
        val = constrain(val, 0, 1);

        return val;
    }

    get dead() {
        return this.lifetime <= 0;
    }

    reduceLifetime() {
        if (this.lifetime > this.fadeOut && this.lifetime < this.maxLifetime - this.fadeIn) {
            this.lifetime = this.fadeOut;
        }
    }

    applyForce(force: IVector) {
        this.acc.x += force.x;
        this.acc.y += force.y;
    }

    update(dt: number) {
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.acc.x = 0;
        this.acc.y = 0;

        this.graphics.alpha = this.opacity;
        this.lifetime -= dt;
        this.timer += dt;

        this.graphics.position.set(this.pos.x, this.pos.y);
    }
}