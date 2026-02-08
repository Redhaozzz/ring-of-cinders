import Phaser from 'phaser'

/**
 * AudioManager handles all game sound effects using Web Audio API
 * Generates simple procedural sounds for attack, hurt, victory, and defeat
 */
export class AudioManager {
  private audioContext: AudioContext
  private masterVolume: number = 0.3

  constructor(_scene: Phaser.Scene) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  /**
   * Play attack sound - quick upward sweep
   */
  playAttack() {
    const attackSound = this.audioContext.createOscillator()
    const attackGain = this.audioContext.createGain()

    attackSound.connect(attackGain)
    attackGain.connect(this.audioContext.destination)

    attackSound.type = 'square'
    attackSound.frequency.setValueAtTime(200, this.audioContext.currentTime)
    attackSound.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1)

    attackGain.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime)
    attackGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

    attackSound.start(this.audioContext.currentTime)
    attackSound.stop(this.audioContext.currentTime + 0.1)
  }

  /**
   * Play hurt sound - downward sweep with noise
   */
  playHurt() {
    const hurtSound = this.audioContext.createOscillator()
    const hurtGain = this.audioContext.createGain()

    hurtSound.connect(hurtGain)
    hurtGain.connect(this.audioContext.destination)

    hurtSound.type = 'sawtooth'
    hurtSound.frequency.setValueAtTime(300, this.audioContext.currentTime)
    hurtSound.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2)

    hurtGain.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime)
    hurtGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)

    hurtSound.start(this.audioContext.currentTime)
    hurtSound.stop(this.audioContext.currentTime + 0.2)
  }

  /**
   * Play victory sound - triumphant ascending arpeggio
   */
  playVictory() {
    const notes = [262, 330, 392, 523] // C4, E4, G4, C5
    const noteDuration = 0.15

    notes.forEach((frequency, index) => {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.connect(gain)
      gain.connect(this.audioContext.destination)

      osc.type = 'sine'
      osc.frequency.value = frequency

      const startTime = this.audioContext.currentTime + index * noteDuration
      const endTime = startTime + noteDuration * 1.5

      gain.gain.setValueAtTime(this.masterVolume * 0.4, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, endTime)

      osc.start(startTime)
      osc.stop(endTime)
    })
  }

  /**
   * Play defeat sound - descending ominous tone
   */
  playDefeat() {
    const defeatSound = this.audioContext.createOscillator()
    const defeatGain = this.audioContext.createGain()

    defeatSound.connect(defeatGain)
    defeatGain.connect(this.audioContext.destination)

    defeatSound.type = 'triangle'
    defeatSound.frequency.setValueAtTime(220, this.audioContext.currentTime)
    defeatSound.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + 0.8)

    defeatGain.gain.setValueAtTime(this.masterVolume * 0.5, this.audioContext.currentTime)
    defeatGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8)

    defeatSound.start(this.audioContext.currentTime)
    defeatSound.stop(this.audioContext.currentTime + 0.8)
  }

  /**
   * Play brick place sound - quick tick
   */
  playBrickPlace() {
    const brickSound = this.audioContext.createOscillator()
    const brickGain = this.audioContext.createGain()

    brickSound.connect(brickGain)
    brickGain.connect(this.audioContext.destination)

    brickSound.type = 'square'
    brickSound.frequency.setValueAtTime(800, this.audioContext.currentTime)
    brickSound.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.05)

    brickGain.gain.setValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime)
    brickGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05)

    brickSound.start(this.audioContext.currentTime)
    brickSound.stop(this.audioContext.currentTime + 0.05)
  }

  /**
   * Play ignite sound - whoosh with crackle
   */
  playIgnite() {
    // Main ignite sound
    const igniteSound = this.audioContext.createOscillator()
    const igniteGain = this.audioContext.createGain()

    igniteSound.connect(igniteGain)
    igniteGain.connect(this.audioContext.destination)

    igniteSound.type = 'sawtooth'
    igniteSound.frequency.setValueAtTime(150, this.audioContext.currentTime)
    igniteSound.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3)

    igniteGain.gain.setValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime)
    igniteGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

    igniteSound.start(this.audioContext.currentTime)
    igniteSound.stop(this.audioContext.currentTime + 0.3)

    // Add crackling effect with noise
    for (let i = 0; i < 3; i++) {
      const crackle = this.audioContext.createOscillator()
      const crackleGain = this.audioContext.createGain()

      crackle.connect(crackleGain)
      crackleGain.connect(this.audioContext.destination)

      crackle.type = 'triangle'
      crackle.frequency.value = 600 + Math.random() * 400

      const startTime = this.audioContext.currentTime + 0.1 + i * 0.05
      const duration = 0.03 + Math.random() * 0.02

      crackleGain.gain.setValueAtTime(this.masterVolume * 0.1, startTime)
      crackleGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

      crackle.start(startTime)
      crackle.stop(startTime + duration)
    }
  }

  /**
   * Play anthill destroy sound - deep rumble
   */
  playAnthillDestroy() {
    const destroySound = this.audioContext.createOscillator()
    const destroyGain = this.audioContext.createGain()

    destroySound.connect(destroyGain)
    destroyGain.connect(this.audioContext.destination)

    destroySound.type = 'sawtooth'
    destroySound.frequency.setValueAtTime(80, this.audioContext.currentTime)
    destroySound.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.4)

    destroyGain.gain.setValueAtTime(this.masterVolume * 0.7, this.audioContext.currentTime)
    destroyGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4)

    destroySound.start(this.audioContext.currentTime)
    destroySound.stop(this.audioContext.currentTime + 0.4)
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.masterVolume = Phaser.Math.Clamp(volume, 0, 1)
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }
}
