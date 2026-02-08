import Phaser from 'phaser'
import type { Player } from './Player'
import { EffectsManager } from '../effects/VisualEffects'
import { AudioManager } from '../systems/AudioManager'

export class Ant {
  private sprite: Phaser.GameObjects.Sprite
  private hp: number = 2
  private speed: number = 160 // 0.8 * player speed (200)
  private player: Player
  private isDead: boolean = false
  private effectsManager: EffectsManager | null = null
  private audioManager: AudioManager | null = null

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: Player,
    effectsManager?: EffectsManager,
    audioManager?: AudioManager
  ) {
    this.player = player
    this.effectsManager = effectsManager || null
    this.audioManager = audioManager || null

    // Create sprite from spritesheet
    this.sprite = scene.add.sprite(x, y, 'ant', 0)
    this.sprite.setScale(0.09375) // Scale down from 256x256 to 24x24 (24/256 = 0.09375)
    this.sprite.play('ant-walk')

    // Enable physics
    scene.physics.add.existing(this.sprite)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
  }

  update(_delta: number) {
    if (this.isDead) return

    const playerSprite = this.player.getSprite()
    const body = this.sprite.body as Phaser.Physics.Arcade.Body

    // Calculate direction to player
    const dx = playerSprite.x - this.sprite.x
    const dy = playerSprite.y - this.sprite.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0) {
      // Normalize and apply speed
      body.setVelocity(
        (dx / distance) * this.speed,
        (dy / distance) * this.speed
      )
    } else {
      body.setVelocity(0, 0)
    }
  }

  /**
   * Take damage and return true if ant died
   */
  takeDamage(amount: number): boolean {
    if (this.isDead) return false

    this.hp -= amount
    if (this.hp <= 0) {
      this.hp = 0
      this.die()
      return true
    }
    return false
  }

  private die() {
    this.isDead = true

    // Play death sound
    if (this.audioManager) {
      this.audioManager.playAntDeath()
    }

    // Play death animation
    this.sprite.play('ant-death')

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
