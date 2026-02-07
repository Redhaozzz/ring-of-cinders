import Phaser from 'phaser'

export class Player {
  private scene: Phaser.Scene
  private sprite: Phaser.GameObjects.Rectangle
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }
  private speed: number = 200

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene

    // Create white 32x32 square
    this.sprite = scene.add.rectangle(x, y, 32, 32, 0xffffff)

    // Setup input
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.wasdKeys = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }
  }

  update() {
    const delta = this.scene.game.loop.delta / 1000 // Convert to seconds
    let velocityX = 0
    let velocityY = 0

    // Check for input (WASD or Arrow keys)
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      velocityX = -this.speed
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      velocityX = this.speed
    }

    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      velocityY = -this.speed
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      velocityY = this.speed
    }

    // Apply movement
    this.sprite.x += velocityX * delta
    this.sprite.y += velocityY * delta

    // Boundary collision (keep player within game bounds)
    const halfWidth = 16 // Half of 32px
    const halfHeight = 16

    const gameWidth = this.scene.game.config.width as number
    const gameHeight = this.scene.game.config.height as number

    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, halfWidth, gameWidth - halfWidth)
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, halfHeight, gameHeight - halfHeight)
  }
}
