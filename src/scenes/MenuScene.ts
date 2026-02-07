import Phaser from 'phaser'

export class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text
  private spaceKey!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const gameWidth = this.game.config.width as number
    const gameHeight = this.game.config.height as number

    // Game title
    const title = this.add.text(gameWidth / 2, gameHeight / 2 - 80, 'Ring of Cinders', {
      fontSize: '64px',
      color: '#bc4749'
    })
    title.setOrigin(0.5)

    // Start button
    this.startButton = this.add.text(gameWidth / 2, gameHeight / 2 + 40, 'Start Game', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#bc4749',
      padding: { x: 20, y: 10 }
    })
    this.startButton.setOrigin(0.5)
    this.startButton.setInteractive({ useHandCursor: true })

    // Button hover effect
    this.startButton.on('pointerover', () => {
      this.startButton.setStyle({ color: '#bc4749', backgroundColor: '#ffffff' })
    })

    this.startButton.on('pointerout', () => {
      this.startButton.setStyle({ color: '#ffffff', backgroundColor: '#bc4749' })
    })

    // Button click
    this.startButton.on('pointerdown', () => {
      this.startGame()
    })

    // Space key input
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Instruction text
    this.add.text(gameWidth / 2, gameHeight / 2 + 120, 'Press SPACE to start', {
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5)
  }

  update() {
    // Check space key
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startGame()
    }
  }

  private startGame() {
    this.scene.start('GameScene')
  }
}
