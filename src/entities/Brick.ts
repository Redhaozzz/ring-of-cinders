import Phaser from 'phaser'

export class Brick {
  private sprite: Phaser.GameObjects.Rectangle
  private isGlowing: boolean = false
  private readonly NORMAL_COLOR: number = 0x888888
  private readonly GLOW_COLOR: number = 0xff6600

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Create gray 32x32 square
    this.sprite = scene.add.rectangle(x, y, 32, 32, this.NORMAL_COLOR)

    // Enable physics on the brick
    scene.physics.add.existing(this.sprite)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true)
  }

  getSprite(): Phaser.GameObjects.Rectangle {
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
      // Orange/red glow for furnace mode
      this.sprite.setFillStyle(this.GLOW_COLOR)
    } else {
      // Reset to normal gray
      this.sprite.setFillStyle(this.NORMAL_COLOR)
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
