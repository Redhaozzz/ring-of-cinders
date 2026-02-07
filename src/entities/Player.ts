import Phaser from 'phaser'

type Direction = 'up' | 'down' | 'left' | 'right'

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
  private spaceKey: Phaser.Input.Keyboard.Key
  private speed: number = 200
  private facing: Direction = 'down'
  private attackBox: Phaser.GameObjects.Rectangle | null = null
  private attackCooldown: number = 0
  private readonly ATTACK_COOLDOWN_TIME: number = 0.5 // seconds
  private readonly ATTACK_DURATION: number = 0.2 // seconds

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
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  }

  enablePhysics() {
    // Enable physics body on the sprite
    this.scene.physics.add.existing(this.sprite)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
  }

  update() {
    const delta = this.scene.game.loop.delta / 1000 // Convert to seconds
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null

    let velocityX = 0
    let velocityY = 0

    // Check for input (WASD or Arrow keys)
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      velocityX = -this.speed
      this.facing = 'left'
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      velocityX = this.speed
      this.facing = 'right'
    }

    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      velocityY = -this.speed
      this.facing = 'up'
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      velocityY = this.speed
      this.facing = 'down'
    }

    // Apply movement using physics or direct position
    if (body) {
      body.setVelocity(velocityX, velocityY)
    } else {
      // Fallback to direct position update if physics not enabled
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

    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta
    }

    // Handle attack input
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.attackCooldown <= 0) {
      this.attack()
    }
  }

  private attack() {
    // Set cooldown
    this.attackCooldown = this.ATTACK_COOLDOWN_TIME

    // Calculate attack box position based on facing direction
    let attackX = this.sprite.x
    let attackY = this.sprite.y
    let attackWidth = 32
    let attackHeight = 16

    switch (this.facing) {
      case 'up':
        attackY = this.sprite.y - 24 // 16 (half player) + 8 (half attack height)
        attackWidth = 32
        attackHeight = 16
        break
      case 'down':
        attackY = this.sprite.y + 24
        attackWidth = 32
        attackHeight = 16
        break
      case 'left':
        attackX = this.sprite.x - 24
        attackWidth = 16
        attackHeight = 32
        break
      case 'right':
        attackX = this.sprite.x + 24
        attackWidth = 16
        attackHeight = 32
        break
    }

    // Create attack hitbox
    this.attackBox = this.scene.add.rectangle(attackX, attackY, attackWidth, attackHeight, 0xff0000)

    // Remove attack box after duration
    this.scene.time.delayedCall(this.ATTACK_DURATION * 1000, () => {
      if (this.attackBox) {
        this.attackBox.destroy()
        this.attackBox = null
      }
    })
  }

  getSprite(): Phaser.GameObjects.Rectangle {
    return this.sprite
  }
}
