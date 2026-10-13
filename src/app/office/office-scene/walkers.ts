import { Walker, restPoint } from '../scene/exterior';

/** Walking speed in scene units per second (about 1.2 m/s at office scale). */
const SPEED = 36;
const FADE = 600;
/** Time spent off-stage between two walks. */
const BREAK = 2500;

const at = (p: { x: number; y: number }) => `translate(${p.x}px, ${p.y}px)`;

/**
 * Moves one person along a fixed route: walk, sometimes stop, reach the end,
 * fade out, start again. Each step is one Web Animation, so pausing simply
 * pauses the current one; there is no per-frame script.
 */
export class WalkerRunner {
  private current: Animation | null = null;
  private paused = false;
  private stopped = false;

  constructor(
    private readonly el: SVGGElement,
    private readonly walker: Walker,
  ) {}

  start(): void {
    void this.loop();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.current?.pause();
    else this.current?.play();
  }

  stop(): void {
    this.stopped = true;
    this.current?.cancel();
  }

  private async loop(): Promise<void> {
    const { route, pauses, rest, delay } = this.walker;
    let pos = restPoint(this.walker);
    let next = rest.seg + 1;
    if (!(await this.step([], delay))) return;

    for (;;) {
      for (; next < route.length; next++) {
        const to = route[next];
        const ms = (Math.hypot(to.x - pos.x, to.y - pos.y) / SPEED) * 1000;
        this.walking(true);
        if (!(await this.step([{ transform: at(pos) }, { transform: at(to) }], ms))) return;
        pos = to;
        if (pauses[next]) {
          this.walking(false);
          if (!(await this.step([], pauses[next]))) return;
        }
      }
      this.walking(false);
      if (!(await this.step([{ opacity: 1 }, { opacity: 0 }], FADE))) return;
      pos = route[0];
      this.el.style.transform = at(pos);
      if (!(await this.step([], BREAK))) return;
      if (!(await this.step([{ opacity: 0 }, { opacity: 1 }], FADE))) return;
      next = 1;
    }
  }

  /** Plays one step (an empty keyframe list is a pausable wait). False once stopped. */
  private async step(keyframes: Keyframe[], duration: number): Promise<boolean> {
    if (this.stopped) return false;
    const anim = this.el.animate(keyframes, { duration, fill: 'forwards', easing: 'linear' });
    this.current = anim;
    if (this.paused) anim.pause();
    try {
      await anim.finished;
    } catch {
      return false; // Cancelled.
    }
    if (this.stopped) return false;
    if (keyframes.length) anim.commitStyles();
    anim.cancel();
    this.current = null;
    return true;
  }

  private walking(on: boolean): void {
    this.el.classList.toggle('is-walking', on);
  }
}
