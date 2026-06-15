export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;
export const REEL_FPS = 60;
export const REEL_CODEC = "h264";
export const REEL_CRF = 18;
export const REEL_PIXEL_FORMAT = "yuv420p";

export const SECOND = REEL_FPS;

export const WEEK_REEL_DURATION = 15 * SECOND;
export const MONTH_INTRO_FRAMES = 5 * SECOND;
export const MONTH_FESTIVAL_FRAMES = Math.round(2.6 * SECOND);
export const MONTH_OUTRO_FRAMES = Math.round(2.6 * SECOND);
export const MONTH_GLOBE_REVEAL_FRAME = Math.round(4.5 * SECOND);

export const getMonthDuration = (festivalCount = 0) =>
  MONTH_INTRO_FRAMES +
  Math.max(1, festivalCount) * MONTH_FESTIVAL_FRAMES +
  Math.round(1.4 * SECOND) +
  MONTH_OUTRO_FRAMES;
