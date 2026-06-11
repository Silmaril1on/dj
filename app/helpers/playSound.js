import { soundManager } from "./soundManager";

export const playSound = (name, options) => {
  return soundManager.play(name, options);
};
