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
  private jKey: Phaser.Input.Keyboard.Key
  private speed: number = 200
  private facing: Direction = 'down'
  private attackArc: Phaser.GameObjects.Graphics | null = null
  private attackCooldown: number = 0
  private readonly ATTACK_COOLDOWN_TIME: number = 0.4 // seconds
  private readonly ATTACK_DURATION: number = 0.2 // seconds
  private readonly ATTACK_RADIUS: number = 60 // pixels

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
    this.jKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J)

    // Setup mouse input for attack
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        if (this.attackCooldown <= 0) {
          this.attack()
        }
      }
    })
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

    // Handle attack input (J key or mouse left click)
    if (Phaser.Input.Keyboard.JustDown(this.jKey) && this.attackCooldown <= 0) {
      this.attack()
    }
  }

  private attack() {
    // Set cooldown
    this.attackCooldown = this.ATTACK_COOLDOWN_TIME

    // Calculate arc direction based on facing direction
    let startAngle: number
    let endAngle: number

    switch (this.facing) {
      case 'up':
        startAngle = Phaser.Math.DegToRad(-135) // -135 degrees
        endAngle = Phaser.Math.DegToRad(-45)    // -45 degrees
        break
      case 'down':
        startAngle = Phaser.Math.DegToRad(45)   // 45 degrees
        endAngle = Phaser.Math.DegToRad(135)    // 135 degrees
        break
      case 'left':
        startAngle = Phaser.Math.DegToRad(135)  // 135 degrees
        endAngle = Phaser.Math.DegToRad(225)    // 225 degrees
        break
      case 'right':
        startAngle = Phaser.Math.DegToRad(-45)  // -45 degrees
        endAngle = Phaser.Math.DegToRad(45)     // 45 degrees
        break
      default:
        startAngle = 0
        endAngle = 0
    }

    // Create attack arc using Graphics
    this.attackArc = this.scene.add.graphics()
    this.attackArc.fillStyle(0xff0000, 0.5) // Semi-transparent red
    this.attackArc.beginPath()
    this.attackArc.moveTo(this.sprite.x, this.sprite.y)
    this.attackArc.arc(this.sprite.x, this.sprite.y, this.ATTACK_RADIUS, startAngle, endAngle, false)
    this.attackArc.closePath()
    this.attackArc.fillPath()

    // Remove attack arc after duration
    this.scene.time.delayedCall(this.ATTACK_DURATION * 1000, () => {
      if (this.attackArc) {
        this.attackArc.destroy()
        this.attackArc = null
      }
    })
  }

  getSprite(): Phaser.GameObjects.Rectangle {
    return this.sprite
  }

  getFacing(): Direction {
    return this.facing
  }
}
