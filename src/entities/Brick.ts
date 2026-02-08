import Phaser from 'phaser'

export class Brick {
  private sprite: Phaser.GameObjects.Sprite
  private isGlowing: boolean = false
  private readonly NORMAL_FRAME: number = 0
  private readonly BURNING_FRAME: number = 2

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Create sprite from spritesheet (starts with normal state)
    this.sprite = scene.add.sprite(x, y, 'brick', this.NORMAL_FRAME)
    this.sprite.setScale(0.03125) // Scale down from 341x1024 to approximately 32x32 (32/1024 ≈ 0.03125)

    // Enable physics on the brick
    scene.physics.add.existing(this.sprite)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true)
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite
  }

  /**
   * Get brick position
   */
  getPosition(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  /**
   * Set furnace glow effect
   */
  setGlowing(glowing: boolean) {
    if (this.isGlowing === glowing) return

    this.isGlowing = glowing
    if (glowing) {
      // Switch to burning frame for furnace mode
      this.sprite.setFrame(this.BURNING_FRAME)
    } else {
      // Reset to normal frame
      this.sprite.setFrame(this.NORMAL_FRAME)
    }
  }

  /**
   * Check if brick is currently glowing
   */
  getIsGlowing(): boolean {
    return this.isGlowing
  }

  destroy() {
    this.sprite.destroy()
  }
}
