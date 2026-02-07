import Phaser from 'phaser'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [MenuScene, GameScene]
}

new Phaser.Game(config)
