import Phaser from 'phaser';

/**
 * Slash trail effect using Graphics for 3-frame fade
 */
class SlashTrail {
    private graphics: Phaser.GameObjects.Graphics[];
    private scene: Phaser.Scene;
    private colors = [0xe9c46a, 0xe76f51];
    private frameCount = 3;
    private tween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, angle: number, radius: number = 40) {
        this.scene = scene;
        this.graphics = [];

        // Create graphics for each frame
        for (let i = 0; i < this.frameCount; i++) {
            const graphic = scene.add.graphics();
            graphic.setPosition(x, y);
            this.graphics.push(graphic);
        }

        this.drawArc(angle, radius);
        this.startAnimation();
    }

    private drawArc(angle: number, radius: number) {
        const arcAngle = Phaser.Math.DegToRad(120); // 120 degrees
        const startAngle = angle - arcAngle / 2;
        const endAngle = angle + arcAngle / 2;

        this.graphics.forEach((graphic, index) => {
            const alpha = 1 - (index * 0.3);
            const colorIndex = index % this.colors.length;
            graphic.lineStyle(4 - index, this.colors[colorIndex], alpha);
            graphic.beginPath();
            graphic.arc(0, 0, radius - (index * 5), startAngle, endAngle);
            graphic.strokePath();
        });
    }

    private startAnimation() {
        this.tween = this.scene.tweens.add({
            targets: this.graphics,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
    }

    private destroy() {
        this.graphics.forEach(graphic => graphic.destroy());
        this.graphics = [];
        if (this.tween) {
            this.tween.destroy();
            this.tween = null;
        }
    }
}

/**
 * Death effect with flash, scale and particles
 */
class DeathEffect {
    private scene: Phaser.Scene;
    private gameObject: Phaser.GameObjects.GameObject;
    private onComplete?: () => void;

    constructor(scene: Phaser.Scene, gameObject: Phaser.GameObjects.GameObject, onComplete?: () => void) {
        this.scene = scene;
        this.gameObject = gameObject;
        this.onComplete = onComplete;

        this.playEffect();
    }

    private playEffect() {
        const sprite = this.gameObject as Phaser.GameObjects.Sprite;

        // Flash white effect
        this.scene.tweens.add({
            targets: sprite,
            tint: 0xffffff,
            duration: 25,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                // Scale down animation
                this.scene.tweens.add({
                    targets: sprite,
                    scaleX: 0,
                    scaleY: 0,
                    duration: 150,
                    ease: 'Power2',
                    onComplete: () => {
                        if (this.onComplete) {
                            this.onComplete();
                        }
                    }
                });
            }
        });

        // Create particles
        this.createDeathParticles();
    }

    private createDeathParticles() {
        const sprite = this.gameObject as Phaser.GameObjects.Sprite;
        const x = sprite.x;
        const y = sprite.y;

        // Create 7 particles spreading outward
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            const particle = this.scene.add.rectangle(x, y, 4, 4, 0xbc4749);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 300 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}

/**
 * Fire system using Phaser particle emitter
 */
class FireSystem {
    private scene: Phaser.Scene;
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private colors = [0xfca311, 0xe85d04, 0xd00000];
    private id: string;
    private isActive = false;

    constructor(scene: Phaser.Scene, id: string, x: number, y: number, width: number = 50) {
        this.scene = scene;
        this.id = id;
        this.createFireEffect(x, y, width);
    }

    private createFireEffect(x: number, y: number, width: number) {
        // Create a simple texture for particles if not exists
        if (!this.scene.textures.exists('fire-particle')) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xffffff);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('fire-particle', 8, 8);
            graphics.destroy();
        }

        // Phaser 3.60+ uses direct particle emitter creation
        this.emitter = this.scene.add.particles(x, y, 'fire-particle', {
            speed: { min: 30, max: 50 },
            lifespan: { min: 800, max: 1200 },
            quantity: 2,
            scale: { start: 0.3, end: 0.1 },
            alpha: { start: 1, end: 0 },
            tint: this.colors,
            emitZone: new Phaser.GameObjects.Particles.Zones.RandomZone(
                new Phaser.Geom.Rectangle(-width/2, -10, width, 20) as Phaser.Types.GameObjects.Particles.RandomZoneSource
            ),
            gravityY: -100, // Fire rises upward
            frequency: 100
        });

        this.emitter.stop(); // Start deactivated
    }

    activate() {
        if (this.emitter && !this.isActive) {
            this.emitter.start();
            this.isActive = true;
        }
    }

    deactivate() {
        if (this.emitter && this.isActive) {
            this.emitter.stop();
            this.isActive = false;
        }
    }

    getId(): string {
        return this.id;
    }

    destroy() {
        if (this.emitter) {
            this.emitter.destroy();
            this.emitter = null;
        }
    }
}

/**
 * Main effects manager class
 */
export class EffectsManager {
    private fireSystems: Map<string, FireSystem> = new Map();

    constructor(_scene: Phaser.Scene) {
        // Scene stored for potential future use
    }

    /**
     * Add slash trail effect
     */
    addSlash(scene: Phaser.Scene, x: number, y: number, angle: number, radius: number = 40) {
        new SlashTrail(scene, x, y, angle, radius);
    }

    /**
     * Add death effect to game object
     */
    addDeath(scene: Phaser.Scene, gameObject: Phaser.GameObjects.GameObject, onComplete?: () => void) {
        new DeathEffect(scene, gameObject, onComplete);
    }

    /**
     * Create fire effect for furnace
     */
    createFire(scene: Phaser.Scene, id: string, x: number, y: number, width: number = 50): FireSystem {
        const fireSystem = new FireSystem(scene, id, x, y, width);
        this.fireSystems.set(id, fireSystem);
        return fireSystem;
    }

    /**
     * Activate fire effect by id
     */
    activateFire(id: string) {
        const fireSystem = this.fireSystems.get(id);
        if (fireSystem) {
            fireSystem.activate();
        }
    }

    /**
     * Deactivate fire effect by id
     */
    deactivateFire(id: string) {
        const fireSystem = this.fireSystems.get(id);
        if (fireSystem) {
            fireSystem.deactivate();
        }
    }

    /**
     * Update method for any time-based effects
     */
    update(_delta: number) {
        // Currently no time-based updates needed
        // Can be extended for future effects that need per-frame updates
    }

    /**
     * Cleanup all effects
     */
    destroy() {
        this.fireSystems.forEach(fireSystem => {
            fireSystem.destroy();
        });
        this.fireSystems.clear();
    }
}