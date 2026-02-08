import Phaser from 'phaser'

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface GameConfig {
  difficulty: Difficulty
}

export class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text
  private settingsButton!: Phaser.GameObjects.Text
  private spaceKey!: Phaser.Input.Keyboard.Key
  private selectedDifficulty: Difficulty = 'normal'
  private difficultyButtons: Map<Difficulty, Phaser.GameObjects.Text> = new Map()

  constructor() {
    super({ key: 'MenuScene' })
  }

  preload() {
    // Load ground tiles for menu background
    if (!this.textures.exists('ground-tiles')) {
      this.load.spritesheet('ground-tiles', 'assets/sprites/ground-tiles.png', {
        frameWidth: 256,
        frameHeight: 256
      })
    }
  }

  create() {
    const gameWidth = this.game.config.width as number
    const gameHeight = this.game.config.height as number

    // Create tiled background using ground-tiles
    const groundTile = this.add.tileSprite(0, 0, gameWidth, gameHeight, 'ground-tiles', 0)
    groundTile.setOrigin(0, 0)
    groundTile.setTint(0x888888) // Slightly darken for better contrast

    // Game title with shadow effect
    const titleShadow = this.add.text(gameWidth / 2 + 3, gameHeight / 2 - 127, 'Ring of Cinders', {
      fontSize: '64px',
      color: '#000000'
    })
    titleShadow.setOrigin(0.5)
    titleShadow.setAlpha(0.5)

    const title = this.add.text(gameWidth / 2, gameHeight / 2 - 130, 'Ring of Cinders', {
      fontSize: '64px',
      color: '#bc4749'
    })
    title.setOrigin(0.5)

    // Simple title animation - pulsing glow effect
    this.tweens.add({
      targets: title,
      alpha: { from: 1, to: 0.8 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Difficulty selection label
    this.add.text(gameWidth / 2, gameHeight / 2 - 50, 'Difficulty:', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Difficulty buttons
    const difficulties: { key: Difficulty, label: string }[] = [
      { key: 'easy', label: 'Easy' },
      { key: 'normal', label: 'Normal' },
      { key: 'hard', label: 'Hard' }
    ]

    const buttonSpacing = 100
    const startX = gameWidth / 2 - buttonSpacing

    difficulties.forEach((diff, index) => {
      const btn = this.add.text(startX + index * buttonSpacing, gameHeight / 2 - 10, diff.label, {
        fontSize: '20px',
        color: diff.key === this.selectedDifficulty ? '#bc4749' : '#888888',
        backgroundColor: diff.key === this.selectedDifficulty ? '#ffffff' : '#333333',
        padding: { x: 12, y: 6 }
      })
      btn.setOrigin(0.5)
      btn.setInteractive({ useHandCursor: true })

      btn.on('pointerdown', () => {
        this.selectDifficulty(diff.key)
      })

      btn.on('pointerover', () => {
        if (diff.key !== this.selectedDifficulty) {
          btn.setStyle({ color: '#ffffff' })
        }
      })

      btn.on('pointerout', () => {
        if (diff.key !== this.selectedDifficulty) {
          btn.setStyle({ color: '#888888' })
        }
      })

      this.difficultyButtons.set(diff.key, btn)
    })

    // Start button
    this.startButton = this.add.text(gameWidth / 2, gameHeight / 2 + 50, 'Start Game', {
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

    // Settings button
    this.settingsButton = this.add.text(gameWidth / 2, gameHeight / 2 + 120, 'Settings', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#555555',
      padding: { x: 16, y: 8 }
    })
    this.settingsButton.setOrigin(0.5)
    this.settingsButton.setInteractive({ useHandCursor: true })

    this.settingsButton.on('pointerover', () => {
      this.settingsButton.setStyle({ color: '#555555', backgroundColor: '#ffffff' })
    })

    this.settingsButton.on('pointerout', () => {
      this.settingsButton.setStyle({ color: '#ffffff', backgroundColor: '#555555' })
    })

    this.settingsButton.on('pointerdown', () => {
      this.scene.start('SettingsScene')
    })

    // Space key input
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Instruction text
    this.add.text(gameWidth / 2, gameHeight / 2 + 180, 'Press SPACE to start', {
      fontSize: '20px',
      color: '#666666'
    }).setOrigin(0.5)
  }

  update() {
    // Check space key
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startGame()
    }
  }

  private selectDifficulty(difficulty: Difficulty) {
    // Reset previous selection
    const prevBtn = this.difficultyButtons.get(this.selectedDifficulty)
    if (prevBtn) {
      prevBtn.setStyle({ color: '#888888', backgroundColor: '#333333' })
    }

    // Set new selection
    this.selectedDifficulty = difficulty
    const newBtn = this.difficultyButtons.get(difficulty)
    if (newBtn) {
      newBtn.setStyle({ color: '#bc4749', backgroundColor: '#ffffff' })
    }
  }

  private startGame() {
    const config: GameConfig = {
      difficulty: this.selectedDifficulty
    }
    this.scene.start('GameScene', config)
  }
}
