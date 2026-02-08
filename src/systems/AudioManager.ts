import Phaser from 'phaser'

const VOLUME_STORAGE_KEY = 'roc-volume'

/**
 * AudioManager handles all game sound effects using Web Audio API
 * Generates simple procedural sounds for attack, hurt, victory, and defeat
 */
export class AudioManager {
  private audioContext: AudioContext
  private masterVolume: number = 0.3
  private bgmGainNode: GainNode | null = null
  private bgmOscillators: OscillatorNode[] = []
  private isBgmPlaying: boolean = false

  constructor(_scene: Phaser.Scene) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    // Load saved volume from localStorage
    this.loadVolume()
  }

  /**
   * Load volume from localStorage
   */
  private loadVolume() {
    const saved = localStorage.getItem(VOLUME_STORAGE_KEY)
    if (saved !== null) {
      this.masterVolume = Phaser.Math.Clamp(parseFloat(saved), 0, 1)
    }
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
   * Play ant death sound - short squish/crunch
   */
  playAntDeath() {
    // Main squish sound
    const squishSound = this.audioContext.createOscillator()
    const squishGain = this.audioContext.createGain()

    squishSound.connect(squishGain)
    squishGain.connect(this.audioContext.destination)

    squishSound.type = 'square'
    squishSound.frequency.setValueAtTime(400, this.audioContext.currentTime)
    squishSound.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.08)

    squishGain.gain.setValueAtTime(this.masterVolume * 0.25, this.audioContext.currentTime)
    squishGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08)

    squishSound.start(this.audioContext.currentTime)
    squishSound.stop(this.audioContext.currentTime + 0.08)

    // Add a small pop
    const popSound = this.audioContext.createOscillator()
    const popGain = this.audioContext.createGain()

    popSound.connect(popGain)
    popGain.connect(this.audioContext.destination)

    popSound.type = 'sine'
    popSound.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.02)
    popSound.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.06)

    popGain.gain.setValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime + 0.02)
    popGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.06)

    popSound.start(this.audioContext.currentTime + 0.02)
    popSound.stop(this.audioContext.currentTime + 0.06)
  }

  /**
   * Start background music - ambient loop
   */
  playBGM() {
    if (this.isBgmPlaying) return

    this.isBgmPlaying = true

    // Create main gain node for BGM
    this.bgmGainNode = this.audioContext.createGain()
    this.bgmGainNode.gain.setValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime)
    this.bgmGainNode.connect(this.audioContext.destination)

    // Create ambient drone using low frequency oscillators
    const createDrone = (frequency: number, type: OscillatorType, detune: number = 0) => {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.type = type
      osc.frequency.value = frequency
      osc.detune.value = detune

      // Subtle LFO modulation for movement
      const lfo = this.audioContext.createOscillator()
      const lfoGain = this.audioContext.createGain()
      lfo.type = 'sine'
      lfo.frequency.value = 0.1 + Math.random() * 0.1
      lfoGain.gain.value = 2

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      gain.gain.value = 0.3
      osc.connect(gain)
      gain.connect(this.bgmGainNode!)

      osc.start()
      lfo.start()

      this.bgmOscillators.push(osc, lfo)
      return osc
    }

    // Create layered ambient sound
    // Low drone
    createDrone(55, 'sine', 0)       // A1
    createDrone(55, 'triangle', 5)   // A1 slightly detuned

    // Mid layer
    createDrone(110, 'sine', -3)     // A2

    // High shimmer (very quiet)
    const shimmer = this.audioContext.createOscillator()
    const shimmerGain = this.audioContext.createGain()
    shimmer.type = 'sine'
    shimmer.frequency.value = 440
    shimmerGain.gain.value = 0.05
    shimmer.connect(shimmerGain)
    shimmerGain.connect(this.bgmGainNode!)
    shimmer.start()
    this.bgmOscillators.push(shimmer)

    // Add slow tremolo to shimmer
    const tremolo = this.audioContext.createOscillator()
    const tremoloGain = this.audioContext.createGain()
    tremolo.type = 'sine'
    tremolo.frequency.value = 2
    tremoloGain.gain.value = 0.03
    tremolo.connect(tremoloGain)
    tremoloGain.connect(shimmerGain.gain)
    tremolo.start()
    this.bgmOscillators.push(tremolo)
  }

  /**
   * Stop background music
   */
  stopBGM() {
    if (!this.isBgmPlaying) return

    this.isBgmPlaying = false

    // Fade out before stopping
    if (this.bgmGainNode) {
      this.bgmGainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5)
    }

    // Stop all oscillators after fade
    setTimeout(() => {
      this.bgmOscillators.forEach(osc => {
        try {
          osc.stop()
        } catch (_e) {
          // Already stopped
        }
      })
      this.bgmOscillators = []
      this.bgmGainNode = null
    }, 600)
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.masterVolume = Phaser.Math.Clamp(volume, 0, 1)

    // Update BGM volume if playing
    if (this.bgmGainNode && this.isBgmPlaying) {
      this.bgmGainNode.gain.setValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime)
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopBGM()
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }
}
