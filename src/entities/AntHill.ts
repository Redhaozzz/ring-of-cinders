import Phaser from 'phaser'
import { Ant } from './Ant'
import type { Player } from './Player'

export class AntHill {
  private scene: Phaser.Scene
  private sprite: Phaser.GameObjects.Rectangle
  private hp: number = 10
  private isDead: boolean = false
  private player: Player
  private spawnTimer: number = 0
  private readonly SPAWN_INTERVAL: number = 2.5 // seconds (2-3 seconds)
  private onAntSpawned?: (ant: Ant) => void

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: Player,
    onAntSpawned?: (ant: Ant) => void
  ) {
    this.scene = scene
    this.player = player
    this.onAntSpawned = onAntSpawned

    // Create 48x48 square for anthill (design spec color: #bc4749)
    this.sprite = scene.add.rectangle(x, y, 48, 48, 0xbc4749)

    // Enable physics
    scene.physics.add.existing(this.sprite)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true)
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

    const ant = new Ant(this.scene, spawnX, spawnY, this.player)

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
