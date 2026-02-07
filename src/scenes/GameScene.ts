import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Brick } from '../entities/Brick'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private bricks: Brick[] = []
  private qKey!: Phaser.Input.Keyboard.Key
  private readonly MAX_BRICKS = 8

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

    // Setup Q key for placing bricks
    this.qKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
  }

  update(_time: number, _delta: number) {
    this.player.update()

    // Handle brick placement
    if (Phaser.Input.Keyboard.JustDown(this.qKey) && this.bricks.length < this.MAX_BRICKS) {
      this.placeBrick()
    }
  }

  private placeBrick() {
    const playerSprite = this.player.getSprite()
    const brick = new Brick(this, playerSprite.x, playerSprite.y)
    this.bricks.push(brick)

    // Add collision between player and brick
    this.physics.add.collider(playerSprite, brick.getSprite())

    // Add collision between new brick and existing bricks
    for (let i = 0; i < this.bricks.length - 1; i++) {
      this.physics.add.collider(brick.getSprite(), this.bricks[i].getSprite())
    }
  }
}
