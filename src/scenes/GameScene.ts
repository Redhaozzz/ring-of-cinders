import Phaser from 'phaser'
import { Player } from '../entities/Player'

export class GameScene extends Phaser.Scene {
  private player!: Player

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // Create player in center of screen
    this.player = new Player(this, 400, 300)
  }

  update(_time: number, _delta: number) {
    this.player.update()
  }
}
