import Phaser from 'phaser'

const VOLUME_STORAGE_KEY = 'roc-volume'

export class SettingsScene extends Phaser.Scene {
  private volumeSlider!: Phaser.GameObjects.Rectangle
  private volumeHandle!: Phaser.GameObjects.Rectangle
  private volumeValueText!: Phaser.GameObjects.Text
  private currentVolume: number = 0.3

  private readonly SLIDER_WIDTH = 300
  private readonly SLIDER_HEIGHT = 10
  private readonly HANDLE_SIZE = 24

  constructor() {
    super({ key: 'SettingsScene' })
  }

  create() {
    const gameWidth = this.game.config.width as number
    const gameHeight = this.game.config.height as number

    // Load saved volume from localStorage
    this.loadVolume()

    // Create tiled background using ground-tiles
    const groundTile = this.add.tileSprite(0, 0, gameWidth, gameHeight, 'ground-tiles', 0)
    groundTile.setOrigin(0, 0)
    groundTile.setTint(0x666666) // Darken for settings screen

    // Settings title
    const title = this.add.text(gameWidth / 2, 80, 'Settings', {
      fontSize: '48px',
      color: '#bc4749'
    })
    title.setOrigin(0.5)

    // Volume label
    const volumeLabel = this.add.text(gameWidth / 2, gameHeight / 2 - 60, 'Volume', {
      fontSize: '28px',
      color: '#ffffff'
    })
    volumeLabel.setOrigin(0.5)

    // Volume slider background
    const sliderY = gameHeight / 2
    const sliderX = gameWidth / 2

    this.volumeSlider = this.add.rectangle(
      sliderX, sliderY,
      this.SLIDER_WIDTH, this.SLIDER_HEIGHT,
      0x555555
    )
    this.volumeSlider.setInteractive()

    // Volume slider fill
    const sliderFill = this.add.rectangle(
      sliderX - this.SLIDER_WIDTH / 2, sliderY,
      this.SLIDER_WIDTH * this.currentVolume, this.SLIDER_HEIGHT,
      0xbc4749
    )
    sliderFill.setOrigin(0, 0.5)

    // Volume handle
    const handleX = sliderX - this.SLIDER_WIDTH / 2 + this.SLIDER_WIDTH * this.currentVolume
    this.volumeHandle = this.add.rectangle(
      handleX, sliderY,
      this.HANDLE_SIZE, this.HANDLE_SIZE,
      0xffffff
    )
    this.volumeHandle.setInteractive({ useHandCursor: true, draggable: true })

    // Volume value text
    this.volumeValueText = this.add.text(sliderX, sliderY + 40, `${Math.round(this.currentVolume * 100)}%`, {
      fontSize: '24px',
      color: '#ffffff'
    })
    this.volumeValueText.setOrigin(0.5)

    // Set up drag for handle
    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Rectangle, dragX: number) => {
      if (gameObject === this.volumeHandle) {
        const minX = sliderX - this.SLIDER_WIDTH / 2
        const maxX = sliderX + this.SLIDER_WIDTH / 2
        const clampedX = Phaser.Math.Clamp(dragX, minX, maxX)

        this.volumeHandle.x = clampedX

        // Calculate volume (0 to 1)
        this.currentVolume = (clampedX - minX) / this.SLIDER_WIDTH

        // Update fill
        sliderFill.width = this.SLIDER_WIDTH * this.currentVolume

        // Update text
        this.volumeValueText.setText(`${Math.round(this.currentVolume * 100)}%`)

        // Save volume
        this.saveVolume()
      }
    })

    // Also allow clicking on slider to set volume
    this.volumeSlider.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const minX = sliderX - this.SLIDER_WIDTH / 2
      const maxX = sliderX + this.SLIDER_WIDTH / 2
      const clampedX = Phaser.Math.Clamp(pointer.x, minX, maxX)

      this.volumeHandle.x = clampedX
      this.currentVolume = (clampedX - minX) / this.SLIDER_WIDTH
      sliderFill.width = this.SLIDER_WIDTH * this.currentVolume
      this.volumeValueText.setText(`${Math.round(this.currentVolume * 100)}%`)
      this.saveVolume()
    })

    // Back button
    const backButton = this.add.text(gameWidth / 2, gameHeight - 100, 'Back', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#bc4749',
      padding: { x: 20, y: 10 }
    })
    backButton.setOrigin(0.5)
    backButton.setInteractive({ useHandCursor: true })

    backButton.on('pointerover', () => {
      backButton.setStyle({ color: '#bc4749', backgroundColor: '#ffffff' })
    })

    backButton.on('pointerout', () => {
      backButton.setStyle({ color: '#ffffff', backgroundColor: '#bc4749' })
    })

    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene')
    })

    // ESC key to go back
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      this.scene.start('MenuScene')
    })
  }

  private loadVolume() {
    const saved = localStorage.getItem(VOLUME_STORAGE_KEY)
    if (saved !== null) {
      this.currentVolume = parseFloat(saved)
      this.currentVolume = Phaser.Math.Clamp(this.currentVolume, 0, 1)
    }
  }

  private saveVolume() {
    localStorage.setItem(VOLUME_STORAGE_KEY, this.currentVolume.toString())
  }

  /**
   * Get saved volume from localStorage
   */
  static getSavedVolume(): number {
    const saved = localStorage.getItem(VOLUME_STORAGE_KEY)
    if (saved !== null) {
      return Phaser.Math.Clamp(parseFloat(saved), 0, 1)
    }
    return 0.3 // Default volume
  }
}
