import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Brick } from '../entities/Brick'
import { Ant } from '../entities/Ant'
import { AntHill } from '../entities/AntHill'
import { EnclosureDetector, type GridPosition, type EnclosureResult } from '../systems/EnclosureDetector'
import { EffectsManager } from '../effects/VisualEffects'
import { AudioManager } from '../systems/AudioManager'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private bricks: Brick[] = []
  private ants: Ant[] = []
  private antHills: AntHill[] = []
  private kKey!: Phaser.Input.Keyboard.Key
  private rKey!: Phaser.Input.Keyboard.Key
  private escKey!: Phaser.Input.Keyboard.Key
  private brickCooldown: number = 0
  private readonly MAX_BRICKS = 8
  private readonly BRICK_COOLDOWN_TIME: number = 0.8 // seconds
  private readonly BRICK_PLACEMENT_DISTANCE: number = 50 // pixels

  // Enclosure detection system
  private enclosureDetector!: EnclosureDetector
  private activeEnclosures: EnclosureResult | null = null
  private furnaceDamageTimer: number = 0
  private readonly FURNACE_DAMAGE_INTERVAL: number = 1.0 // seconds

  // Effects system
  private effectsManager!: EffectsManager

  // Audio system
  private audioManager!: AudioManager

  // UI
  private hpText!: Phaser.GameObjects.Text
  private brickCountText!: Phaser.GameObjects.Text
  private cooldownText!: Phaser.GameObjects.Text
  private gameOverText: Phaser.GameObjects.Text | null = null
  private restartHintText: Phaser.GameObjects.Text | null = null
  private pausedText: Phaser.GameObjects.Text | null = null
  private gameState: 'playing' | 'won' | 'lost' = 'playing'
  private isPaused: boolean = false

  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    // Load sprite sheets (each 1024x1024, divided by 64 = 16x16 frames)
    // Since sheets are 1024x1024 and visual style is 16x16 pixels, each frame would be 64x64 in the sheet
    // But looking at the actual sprites, they appear to use larger frames

    // Firekeeper: 4x4 grid (256x256 per frame)
    this.load.spritesheet('firekeeper', 'assets/sprites/firekeeper-sprite-sheet.png', {
      frameWidth: 256,
      frameHeight: 256
    })

    // Ant enemy: 4x3 grid (256x256 per frame)
    this.load.spritesheet('ant', 'assets/sprites/ant-enemy-sprite-sheet.png', {
      frameWidth: 256,
      frameHeight: 256
    })

    // Sealing brick: 3 states horizontally (341x1024 per frame, approximately)
    this.load.spritesheet('brick', 'assets/sprites/sealing-brick-states.png', {
      frameWidth: 341,
      frameHeight: 1024
    })

    // Ground tiles: 4x4 grid (256x256 per frame)
    this.load.spritesheet('ground-tiles', 'assets/sprites/ground-tiles.png', {
      frameWidth: 256,
      frameHeight: 256
    })

    // Anthill states: 4 frames horizontally (256x256 per frame)
    this.load.spritesheet('anthill-states', 'assets/sprites/anthill-states.png', {
      frameWidth: 256,
      frameHeight: 256
    })
  }

  create() {
    // Enable physics
    this.physics.world.setBounds(0, 0, this.game.config.width as number, this.game.config.height as number)

    // Create grass background using ground tiles (frame 0)
    const bgWidth = this.game.config.width as number
    const bgHeight = this.game.config.height as number
    const groundTile = this.add.tileSprite(0, 0, bgWidth, bgHeight, 'ground-tiles', 0)
    groundTile.setOrigin(0, 0)
    groundTile.setDepth(-1)

    // Create animations
    this.createAnimations()

    // Initialize effects manager
    this.effectsManager = new EffectsManager(this)

    // Initialize audio manager
    this.audioManager = new AudioManager(this)

    // Initialize enclosure detector with game dimensions
    const gameWidth = this.game.config.width as number
    const gameHeight = this.game.config.height as number
    this.enclosureDetector = new EnclosureDetector(gameWidth, gameHeight, 32)

    // Create player in center of screen
    this.player = new Player(this, 400, 300, this.effectsManager)

    // Enable physics on player
    this.player.enablePhysics()

    // Setup K key for placing bricks
    this.kKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K)

    // Setup R key for restart
    this.rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R)

    // Setup ESC key for pause
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)

    // Setup mouse input for brick placement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        if (this.brickCooldown <= 0 && this.bricks.length < this.MAX_BRICKS) {
          this.placeBrick()
        }
      }
    })

    // Create HP display
    this.hpText = this.add.text(16, 16, '', {
      fontSize: '24px',
      color: '#ffffff'
    })
    this.updateHpDisplay()

    // Create brick count display (bottom right corner)
    const uiGameWidth = this.game.config.width as number
    const uiGameHeight = this.game.config.height as number

    this.brickCountText = this.add.text(uiGameWidth - 16, uiGameHeight - 60, '', {
      fontSize: '24px',
      color: '#ffffff'
    })
    this.brickCountText.setOrigin(1, 0) // Right-aligned

    // Create cooldown timer display (below brick count)
    this.cooldownText = this.add.text(uiGameWidth - 16, uiGameHeight - 30, '', {
      fontSize: '18px',
      color: '#cccccc'
    })
    this.cooldownText.setOrigin(1, 0) // Right-aligned

    this.updateBrickDisplay()

    // Spawn initial anthills at map edges
    this.spawnInitialAntHills()
  }

  update(_time: number, delta: number) {
    // Handle restart key
    if (Phaser.Input.Keyboard.JustDown(this.rKey) && this.gameState !== 'playing') {
      this.restartGame()
      return
    }

    // Handle pause key
    if (Phaser.Input.Keyboard.JustDown(this.escKey) && this.gameState === 'playing') {
      this.togglePause()
      return
    }

    // Skip game logic if paused or game over
    if (this.isPaused || this.gameState !== 'playing') return

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

    // Update anthills
    for (const antHill of this.antHills) {
      antHill.update(delta)
    }

    // Update ants
    for (const ant of this.ants) {
      ant.update(deltaSeconds)
    }

    // Clean up dead ants
    this.ants = this.ants.filter(ant => !ant.getIsDead())

    // Clean up dead anthills
    this.antHills = this.antHills.filter(antHill => !antHill.getIsDead())

    // Check ant-player collision
    this.checkAntPlayerCollision()

    // Handle sword attack damage
    this.checkSwordAttackDamage()

    // Handle furnace damage tick
    if (this.activeEnclosures?.hasEnclosure) {
      this.furnaceDamageTimer += deltaSeconds
      if (this.furnaceDamageTimer >= this.FURNACE_DAMAGE_INTERVAL) {
        this.furnaceDamageTimer = 0
        this.processFurnaceDamage()
      }
    }

    // Update HP display
    this.updateHpDisplay()

    // Update brick display
    this.updateBrickDisplay()

    // Check win/lose conditions
    this.checkGameOver()
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

    // Check for enclosures after placing brick
    this.checkForEnclosures()
  }

  /**
   * Check for enclosures and update furnace state
   */
  private checkForEnclosures() {
    // Get brick positions
    const brickPositions: GridPosition[] = this.bricks.map(brick => brick.getPosition())

    // Detect enclosures
    const result = this.enclosureDetector.detectEnclosures(brickPositions)

    // Update active enclosures
    const wasEnclosed = this.activeEnclosures?.hasEnclosure || false
    this.activeEnclosures = result

    if (result.hasEnclosure && !wasEnclosed) {
      // New enclosure detected - activate furnace mode
      console.log('🔥 Furnace mode activated! Enclosed area:', result.enclosedCells.length, 'cells')
      this.activateFurnaceMode()
    } else if (!result.hasEnclosure && wasEnclosed) {
      // Enclosure broken - deactivate furnace mode
      console.log('❄️ Furnace mode deactivated')
      this.deactivateFurnaceMode()
    }
  }

  /**
   * Activate furnace visual effects
   */
  private activateFurnaceMode() {
    if (!this.activeEnclosures?.hasEnclosure) return

    // Make boundary bricks glow
    const boundaryPositions = this.activeEnclosures.enclosureBoundary

    for (const brick of this.bricks) {
      const brickPos = brick.getPosition()
      const isInBoundary = boundaryPositions.some(pos =>
        Math.abs(pos.x - brickPos.x) < 16 && Math.abs(pos.y - brickPos.y) < 16
      )

      if (isInBoundary) {
        brick.setGlowing(true)
      }
    }

    // Reset damage timer
    this.furnaceDamageTimer = 0
  }

  /**
   * Deactivate furnace visual effects
   */
  private deactivateFurnaceMode() {
    // Turn off all brick glow effects
    for (const brick of this.bricks) {
      brick.setGlowing(false)
    }

    // Reset damage timer
    this.furnaceDamageTimer = 0
  }

  /**
   * Process furnace damage for enclosed areas
   */
  private processFurnaceDamage() {
    if (!this.activeEnclosures?.hasEnclosure) return

    const enclosedCells = this.activeEnclosures.enclosedCells

    // Damage ants in enclosed area
    for (const ant of this.ants) {
      const antPos = ant.getPosition()
      const isEnclosed = enclosedCells.some(cell =>
        Math.abs(cell.x - antPos.x) < 16 && Math.abs(cell.y - antPos.y) < 16
      )

      if (isEnclosed) {
        ant.takeDamage(1)
      }
    }

    // Damage anthills in enclosed area
    for (const antHill of this.antHills) {
      const hillPos = antHill.getPosition()
      const isEnclosed = enclosedCells.some(cell =>
        Math.abs(cell.x - hillPos.x) < 24 && Math.abs(cell.y - hillPos.y) < 24
      )

      if (isEnclosed) {
        antHill.takeDamage(1)
      }
    }
  }

  /**
   * Spawn initial anthills at map edges
   */
  private spawnInitialAntHills() {
    const gameWidth = this.game.config.width as number
    const gameHeight = this.game.config.height as number
    const margin = 80

    // Spawn 2-3 anthills at random edge positions
    const hillCount = 3
    const positions: { x: number, y: number }[] = [
      { x: margin, y: margin }, // Top-left
      { x: gameWidth - margin, y: margin }, // Top-right
      { x: gameWidth / 2, y: gameHeight - margin } // Bottom-center
    ]

    for (let i = 0; i < hillCount; i++) {
      const pos = positions[i]
      const antHill = new AntHill(this, pos.x, pos.y, this.player, (ant: Ant) => {
        this.ants.push(ant)
        // Add collision with player
        this.physics.add.overlap(
          this.player.getSprite(),
          ant.getSprite(),
          () => {},
          undefined,
          this
        )
      }, this.effectsManager)
      this.antHills.push(antHill)

      // Add collision between player and anthill
      this.physics.add.collider(this.player.getSprite(), antHill.getSprite())
    }
  }

  /**
   * Check ant-player collision and apply damage
   */
  private checkAntPlayerCollision() {
    const playerSprite = this.player.getSprite()
    const playerBounds = playerSprite.getBounds()

    for (const ant of this.ants) {
      const antSprite = ant.getSprite()
      const antBounds = antSprite.getBounds()

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, antBounds)) {
        this.player.takeDamage(1)
        this.audioManager.playHurt()
        // Kill the ant after it damages the player
        ant.takeDamage(999)
      }
    }
  }

  /**
   * Check sword attack damage to ants
   */
  private checkSwordAttackDamage() {
    const attackInfo = this.player.getAttackInfo()
    if (!attackInfo) return

    const { x, y, radius, startAngle, endAngle } = attackInfo

    for (const ant of this.ants) {
      const antPos = ant.getPosition()
      const dx = antPos.x - x
      const dy = antPos.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= radius) {
        // Check if ant is within the arc angle
        let angle = Math.atan2(dy, dx)

        // Normalize angles to handle wrapping
        let start = startAngle
        let end = endAngle
        if (end < start) end += Math.PI * 2
        if (angle < start) angle += Math.PI * 2

        if (angle >= start && angle <= end) {
          ant.takeDamage(1)
          this.audioManager.playAttack()
        }
      }
    }
  }

  /**
   * Update HP display
   */
  private updateHpDisplay() {
    const hp = this.player.getHp()
    const maxHp = this.player.getMaxHp()
    this.hpText.setText(`HP: ${hp}/${maxHp}`)
  }

  /**
   * Update brick count and cooldown display
   */
  private updateBrickDisplay() {
    const currentBricks = this.bricks.length
    const maxBricks = this.MAX_BRICKS
    const remainingBricks = maxBricks - currentBricks

    // Update brick count with brick emoji
    this.brickCountText.setText(`🧱 ${remainingBricks}/${maxBricks}`)

    // Change color based on brick availability
    if (remainingBricks === 0) {
      // No bricks available - red and flashing
      this.brickCountText.setColor('#ff4444')

      // Add flashing effect when no bricks available
      if (!this.brickCountText.getData('flashing')) {
        this.brickCountText.setData('flashing', true)
        this.tweens.add({
          targets: this.brickCountText,
          alpha: { from: 1, to: 0.3 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      }
    } else if (remainingBricks <= 2) {
      // Low bricks - orange warning
      this.brickCountText.setColor('#ff8844')
      this.stopFlashing()
    } else {
      // Normal amount - white
      this.brickCountText.setColor('#ffffff')
      this.stopFlashing()
    }

    // Update cooldown timer display
    if (this.brickCooldown > 0) {
      this.cooldownText.setText(`Cooldown: ${this.brickCooldown.toFixed(1)}s`)
      this.cooldownText.setVisible(true)
    } else {
      this.cooldownText.setVisible(false)
    }
  }

  /**
   * Stop flashing effect on brick count text
   */
  private stopFlashing() {
    if (this.brickCountText.getData('flashing')) {
      this.brickCountText.setData('flashing', false)
      this.tweens.killTweensOf(this.brickCountText)
      this.brickCountText.setAlpha(1)
    }
  }

  /**
   * Check game over conditions
   */
  private checkGameOver() {
    // Check lose condition
    if (this.player.getIsDead()) {
      this.gameState = 'lost'
      this.showGameOver(false)
      return
    }

    // Check win condition
    if (this.antHills.length === 0 && this.gameState === 'playing') {
      this.gameState = 'won'
      this.showGameOver(true)
    }
  }

  /**
   * Show game over message
   */
  private showGameOver(won: boolean) {
    const gameWidth = this.game.config.width as number
    const gameHeight = this.game.config.height as number

    const message = won ? 'VICTORY!\nAll anthills destroyed!' : 'DEFEAT!\nYou were overwhelmed...'
    const color = won ? '#00ff00' : '#ff0000'

    this.gameOverText = this.add.text(gameWidth / 2, gameHeight / 2, message, {
      fontSize: '48px',
      color: color,
      align: 'center'
    })
    this.gameOverText.setOrigin(0.5)

    // Show restart hint
    this.restartHintText = this.add.text(gameWidth / 2, gameHeight / 2 + 80, 'Press R to Restart', {
      fontSize: '24px',
      color: '#ffffff'
    })
    this.restartHintText.setOrigin(0.5)

    // Play corresponding sound
    if (won) {
      this.audioManager.playVictory()
    } else {
      this.audioManager.playDefeat()
    }
  }

  /**
   * Restart the game scene
   */
  private restartGame() {
    this.scene.restart()
  }

  /**
   * Create sprite animations
   */
  private createAnimations() {
    // Firekeeper animations (4x4 grid = 16 frames)
    // Assuming: row 1 = idle/walk down, row 2 = walk left, row 3 = walk right, row 4 = walk up
    // Frames 0-3 = down, 4-7 = left, 8-11 = right, 12-15 = up

    this.anims.create({
      key: 'firekeeper-idle-down',
      frames: this.anims.generateFrameNumbers('firekeeper', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    })

    this.anims.create({
      key: 'firekeeper-walk-down',
      frames: this.anims.generateFrameNumbers('firekeeper', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'firekeeper-walk-left',
      frames: this.anims.generateFrameNumbers('firekeeper', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'firekeeper-walk-right',
      frames: this.anims.generateFrameNumbers('firekeeper', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'firekeeper-walk-up',
      frames: this.anims.generateFrameNumbers('firekeeper', { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1
    })

    // Ant animations (4x3 grid = 12 frames)
    // Assuming: first 2 rows = walk animation, last row = death animation
    this.anims.create({
      key: 'ant-walk',
      frames: this.anims.generateFrameNumbers('ant', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'ant-death',
      frames: this.anims.generateFrameNumbers('ant', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: 0
    })
  }

  /**
   * Toggle pause state
   */
  private togglePause() {
    this.isPaused = !this.isPaused

    const gameWidth = this.game.config.width as number
    const gameHeight = this.game.config.height as number

    if (this.isPaused) {
      // Show paused text
      this.pausedText = this.add.text(gameWidth / 2, gameHeight / 2, 'PAUSED', {
        fontSize: '64px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 30, y: 20 }
      })
      this.pausedText.setOrigin(0.5)
    } else {
      // Remove paused text
      if (this.pausedText) {
        this.pausedText.destroy()
        this.pausedText = null
      }
    }
  }
}
