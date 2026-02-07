import Phaser from 'phaser'
import type { Player } from './Player'

export class Ant {
  private sprite: Phaser.GameObjects.Rectangle
  private hp: number = 2
  private speed: number = 160 // 0.8 * player speed (200)
  private player: Player
  private isDead: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    this.player = player

    // Create red 24x24 square for ant
    this.sprite = scene.add.rectangle(x, y, 24, 24, 0xff0000)

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
    this.sprite.destroy()
  }

  getSprite(): Phaser.GameObjects.Rectangle {
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
