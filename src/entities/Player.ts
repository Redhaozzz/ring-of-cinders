import Phaser from 'phaser'
import { EffectsManager } from '../effects/VisualEffects'

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
  private hp: number = 3
  private maxHp: number = 3
  private isDead: boolean = false
  private invulnerableTimer: number = 0
  private readonly INVULNERABLE_DURATION: number = 1.0 // seconds
  private effectsManager: EffectsManager | null = null

  constructor(scene: Phaser.Scene, x: number, y: number, effectsManager?: EffectsManager) {
    this.scene = scene
    this.effectsManager = effectsManager || null

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

    if (this.isDead) {
      if (body) body.setVelocity(0, 0)
      return
    }

    // Update invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta
      // Blinking effect: toggle alpha
      const blinkRate = 0.1
      const alpha = (Math.floor(this.invulnerableTimer / blinkRate) % 2 === 0) ? 0.3 : 1.0
      this.sprite.setAlpha(alpha)
    } else {
      this.sprite.setAlpha(1.0)
    }

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
    let centerAngle: number

    switch (this.facing) {
      case 'up':
        startAngle = Phaser.Math.DegToRad(-135) // -135 degrees
        endAngle = Phaser.Math.DegToRad(-45)    // -45 degrees
        centerAngle = Phaser.Math.DegToRad(-90) // -90 degrees (up)
        break
      case 'down':
        startAngle = Phaser.Math.DegToRad(45)   // 45 degrees
        endAngle = Phaser.Math.DegToRad(135)    // 135 degrees
        centerAngle = Phaser.Math.DegToRad(90)  // 90 degrees (down)
        break
      case 'left':
        startAngle = Phaser.Math.DegToRad(135)  // 135 degrees
        endAngle = Phaser.Math.DegToRad(225)    // 225 degrees
        centerAngle = Phaser.Math.DegToRad(180) // 180 degrees (left)
        break
      case 'right':
        startAngle = Phaser.Math.DegToRad(-45)  // -45 degrees
        endAngle = Phaser.Math.DegToRad(45)     // 45 degrees
        centerAngle = Phaser.Math.DegToRad(0)   // 0 degrees (right)
        break
      default:
        startAngle = 0
        endAngle = 0
        centerAngle = 0
    }

    // Add slash visual effect
    if (this.effectsManager) {
      this.effectsManager.addSlash(this.scene, this.sprite.x, this.sprite.y, centerAngle, this.ATTACK_RADIUS)
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

  /**
   * Take damage and return true if player died
   */
  takeDamage(amount: number): boolean {
    if (this.isDead || this.invulnerableTimer > 0) return false

    this.hp -= amount
    if (this.hp <= 0) {
      this.hp = 0
      this.die()
      return true
    }

    // Start invulnerability period
    this.invulnerableTimer = this.INVULNERABLE_DURATION

    return false
  }

  private die() {
    this.isDead = true
    this.sprite.setAlpha(0.5)
  }

  getHp(): number {
    return this.hp
  }

  getMaxHp(): number {
    return this.maxHp
  }

  getIsDead(): boolean {
    return this.isDead
  }

  /**
   * Get attack arc info for collision detection
   */
  getAttackInfo(): { isAttacking: boolean, x: number, y: number, radius: number, startAngle: number, endAngle: number } | null {
    if (!this.attackArc) return null

    let startAngle: number
    let endAngle: number

    switch (this.facing) {
      case 'up':
        startAngle = Phaser.Math.DegToRad(-135)
        endAngle = Phaser.Math.DegToRad(-45)
        break
      case 'down':
        startAngle = Phaser.Math.DegToRad(45)
        endAngle = Phaser.Math.DegToRad(135)
        break
      case 'left':
        startAngle = Phaser.Math.DegToRad(135)
        endAngle = Phaser.Math.DegToRad(225)
        break
      case 'right':
        startAngle = Phaser.Math.DegToRad(-45)
        endAngle = Phaser.Math.DegToRad(45)
        break
      default:
        startAngle = 0
        endAngle = 0
    }

    return {
      isAttacking: true,
      x: this.sprite.x,
      y: this.sprite.y,
      radius: this.ATTACK_RADIUS,
      startAngle,
      endAngle
    }
  }
}
