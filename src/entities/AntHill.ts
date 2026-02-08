import Phaser from 'phaser'
import { Ant } from './Ant'
import type { Player } from './Player'
import { EffectsManager } from '../effects/VisualEffects'
import { AudioManager } from '../systems/AudioManager'

export class AntHill {
  private scene: Phaser.Scene
  private sprite: Phaser.GameObjects.Sprite
  private hp: number = 10
  private isDead: boolean = false
  private player: Player
  private spawnTimer: number = 0
  private readonly SPAWN_INTERVAL: number = 2.5 // seconds (2-3 seconds)
  private onAntSpawned?: (ant: Ant) => void
  private effectsManager: EffectsManager | null = null
  private audioManager: AudioManager | null = null

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: Player,
    onAntSpawned?: (ant: Ant) => void,
    effectsManager?: EffectsManager,
    audioManager?: AudioManager
  ) {
    this.scene = scene
    this.player = player
    this.onAntSpawned = onAntSpawned
    this.effectsManager = effectsManager || null
    this.audioManager = audioManager || null

    // Create anthill sprite using anthill-states spritesheet
    // Scale from 256px to ~48px (scale = 0.1875)
    this.sprite = scene.add.sprite(x, y, 'anthill-states', 0)
    this.sprite.setScale(0.1875)

    // Enable physics
    scene.physics.add.existing(this.sprite)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true)
    // Adjust physics body size to match scaled sprite (~48px)
    body.setSize(256, 256)
  }

  update(delta: number) {
    if (this.isDead) return

    // Update spawn timer
    const deltaSeconds = delta / 1000
    this.spawnTimer += deltaSeconds

    if (this.spawnTimer >= this.SPAWN_INTERVAL) {
      this.spawnTimer = 0
      this.spawnAnt()
    }
  }

  private spawnAnt() {
    // Spawn ant at a random position around the anthill
    const angle = Math.random() * Math.PI * 2
    const distance = 60 // Spawn 60px away from anthill
    const spawnX = this.sprite.x + Math.cos(angle) * distance
    const spawnY = this.sprite.y + Math.sin(angle) * distance

    const ant = new Ant(this.scene, spawnX, spawnY, this.player, this.effectsManager || undefined)

    // Notify parent scene about new ant
    if (this.onAntSpawned) {
      this.onAntSpawned(ant)
    }
  }

  /**
   * Take damage and return true if anthill was destroyed
   */
  takeDamage(amount: number): boolean {
    if (this.isDead) return false

    this.hp -= amount
    if (this.hp <= 0) {
      this.hp = 0
      this.die()
      return true
    }

    // Update visual based on new HP
    this.updateVisual()
    return false
  }

  /**
   * Update sprite frame based on current HP
   * Frame 0: Full HP (8-10)
   * Frame 1: Damaged (5-7)
   * Frame 2: Heavily damaged (2-4)
   * Frame 3: Nearly destroyed (1)
   */
  private updateVisual(): void {
    let frame: number
    if (this.hp >= 8) {
      frame = 0
    } else if (this.hp >= 5) {
      frame = 1
    } else if (this.hp >= 2) {
      frame = 2
    } else {
      frame = 3
    }
    this.sprite.setFrame(frame)
  }

  private die() {
    this.isDead = true

    // Play anthill destroy sound
    if (this.audioManager) {
      this.audioManager.playAnthillDestroy()
    }

    if (this.effectsManager) {
      // Add death effect and destroy sprite when effect completes
      this.effectsManager.addDeath(this.sprite.scene, this.sprite, () => {
        this.sprite.destroy()
      })
    } else {
      // Fallback: destroy immediately if no effects manager
      this.sprite.destroy()
    }
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite
  }

  getPosition(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  getIsDead(): boolean {
    return this.isDead
  }

  destroy() {
    if (!this.isDead) {
      this.sprite.destroy()
    }
  }
}
