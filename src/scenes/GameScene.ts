import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Brick } from '../entities/Brick'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private bricks: Brick[] = []
  private kKey!: Phaser.Input.Keyboard.Key
  private brickCooldown: number = 0
  private readonly MAX_BRICKS = 8
  private readonly BRICK_COOLDOWN_TIME: number = 0.8 // seconds
  private readonly BRICK_PLACEMENT_DISTANCE: number = 50 // pixels

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // Enable physics
    this.physics.world.setBounds(0, 0, this.game.config.width as number, this.game.config.height as number)

    // Create player in center of screen
    this.player = new Player(this, 400, 300)

    // Enable physics on player
    this.player.enablePhysics()

    // Setup K key for placing bricks
    this.kKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K)

    // Setup mouse input for brick placement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        if (this.brickCooldown <= 0 && this.bricks.length < this.MAX_BRICKS) {
          this.placeBrick()
        }
      }
    })
  }

  update(_time: number, delta: number) {
    this.player.update()

    // Convert delta to seconds and update brick cooldown
    const deltaSeconds = delta / 1000
    if (this.brickCooldown > 0) {
      this.brickCooldown -= deltaSeconds
    }

    // Handle brick placement (K key or right mouse click)
    if (Phaser.Input.Keyboard.JustDown(this.kKey) &&
        this.brickCooldown <= 0 &&
        this.bricks.length < this.MAX_BRICKS) {
      this.placeBrick()
    }
  }

  private placeBrick() {
    // Set cooldown
    this.brickCooldown = this.BRICK_COOLDOWN_TIME

    const playerSprite = this.player.getSprite()
    const facing = this.player.getFacing() // Access facing direction from player

    // Calculate brick position based on player facing direction
    let brickX = playerSprite.x
    let brickY = playerSprite.y

    switch (facing) {
      case 'up':
        brickY = playerSprite.y - this.BRICK_PLACEMENT_DISTANCE
        break
      case 'down':
        brickY = playerSprite.y + this.BRICK_PLACEMENT_DISTANCE
        break
      case 'left':
        brickX = playerSprite.x - this.BRICK_PLACEMENT_DISTANCE
        break
      case 'right':
        brickX = playerSprite.x + this.BRICK_PLACEMENT_DISTANCE
        break
    }

    // Ensure brick stays within game bounds
    const gameWidth = this.game.config.width as number
    const gameHeight = this.game.config.height as number
    brickX = Phaser.Math.Clamp(brickX, 16, gameWidth - 16)
    brickY = Phaser.Math.Clamp(brickY, 16, gameHeight - 16)

    const brick = new Brick(this, brickX, brickY)
    this.bricks.push(brick)

    // Add collision between player and brick
    this.physics.add.collider(playerSprite, brick.getSprite())

    // Add collision between new brick and existing bricks
    for (let i = 0; i < this.bricks.length - 1; i++) {
      this.physics.add.collider(brick.getSprite(), this.bricks[i].getSprite())
    }
  }
}
