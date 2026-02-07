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
