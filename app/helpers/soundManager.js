import { Howl, Howler } from "howler";

const SOUND_DEFS = {
  count: { src: ["/sounds/count.ogg"], volume: 0.8 },
  close: { src: ["/sounds/close.ogg"], volume: 0.8 },
  open: { src: ["/sounds/open.ogg"], volume: 0.8 },
  color: { src: ["/sounds/color.ogg"], volume: 0.8 },
  badge: { src: ["/sounds/badge.ogg"], volume: 0.8 },
  levelUp: { src: ["/sounds/lvl-up.ogg"], volume: 0.8 },
  click: { src: ["/sounds/click.ogg"], volume: 0.8 },
  monthIntro: { src: ["/audio/month-intro.mp3"], volume: 0.8 },
  monthlyListing: { src: ["/audio/monthly-listing.mp3"], volume: 0.8 },
  weekIntro: { src: ["/audio/week-intro.mp3"], volume: 0.8 },
  weekLineup: { src: ["/audio/week-lineup.mp3"], volume: 0.8 },
};

const DEFAULT_OPTIONS = {
  html5: false,
  preload: true,
};

class SoundManager {
  constructor(soundDefs = {}) {
    this.definitions = new Map();
    this.sounds = new Map();
    this.masterVolume = 1;
    this.registerMany(soundDefs);
  }

  register(name, definition = {}) {
    if (!name || !definition.src) return this;

    const src = Array.isArray(definition.src) ? definition.src : [definition.src];
    this.definitions.set(name, {
      ...DEFAULT_OPTIONS,
      ...definition,
      src,
    });

    if (this.sounds.has(name)) {
      this.unload(name);
    }

    return this;
  }

  registerMany(soundDefs = {}) {
    Object.entries(soundDefs).forEach(([name, definition]) => {
      this.register(name, definition);
    });

    return this;
  }

  get(name) {
    if (this.sounds.has(name)) return this.sounds.get(name);

    const definition = this.definitions.get(name);
    if (!definition) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Sound "${name}" is not registered.`);
      }
      return null;
    }

    const sound = new Howl(definition);
    this.sounds.set(name, sound);
    return sound;
  }

  play(name, options = {}) {
    const sound = this.get(name);
    if (!sound) return null;

    const { loop, rate, restart = true, volume } = options;

    if (restart) sound.stop();
    if (typeof loop === "boolean") sound.loop(loop);
    if (typeof rate === "number") sound.rate(rate);
    if (typeof volume === "number") sound.volume(volume);

    return sound.play();
  }

  stop(name) {
    const sound = this.sounds.get(name);
    if (sound) sound.stop();
    return this;
  }

  stopMany(names = []) {
    names.forEach((name) => this.stop(name));
    return this;
  }

  stopAll() {
    this.sounds.forEach((sound) => sound.stop());
    return this;
  }

  fade(name, from, to, duration = 300) {
    const sound = this.get(name);
    if (sound) sound.fade(from, to, duration);
    return this;
  }

  setVolume(name, volume) {
    const sound = this.get(name);
    if (sound) sound.volume(volume);
    return this;
  }

  setMasterVolume(volume) {
    this.masterVolume = volume;
    Howler.volume(volume);
    return this;
  }

  mute(isMuted = true) {
    Howler.mute(isMuted);
    return this;
  }

  unload(name) {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.unload();
      this.sounds.delete(name);
    }
    return this;
  }

  unloadAll() {
    this.sounds.forEach((sound) => sound.unload());
    this.sounds.clear();
    return this;
  }
}

export const soundManager = new SoundManager(SOUND_DEFS);
export { SOUND_DEFS, SoundManager };
