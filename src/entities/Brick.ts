import Phaser from 'phaser'

export class Brick {
  private sprite: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Create gray 32x32 square
    this.sprite = scene.add.rectangle(x, y, 32, 32, 0x888888)

    // Enable physics on the brick
    scene.physics.add.existing(this.sprite)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true)
  }

  getSprite(): Phaser.GameObjects.Rectangle {
    return this.sprite
  }

  destroy() {
    this.sprite.destroy()
  }
}
