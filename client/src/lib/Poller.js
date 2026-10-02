/**
 * Repeats an async task every `intervalMs`. After failures the delay doubles
 * from `backoffBaseMs` up to `maxDelayMs` and resets on the next success.
 * A hidden tab skips the task but keeps the schedule.
 */
export class Poller {
  #timer = null;
  #failures = 0;
  #running = false;

  /**
   * @param {{ task: () => Promise<boolean>, intervalMs: number, backoffBaseMs: number, maxDelayMs: number }} options
   *   `task` resolves true on success and false on failure.
   */
  constructor({ task, intervalMs, backoffBaseMs, maxDelayMs }) {
    this.task = task;
    this.intervalMs = intervalMs;
    this.backoffBaseMs = backoffBaseMs;
    this.maxDelayMs = maxDelayMs;
  }

  start() {
    this.#running = true;
    this.#tick();
  }

  stop() {
    this.#running = false;
    clearTimeout(this.#timer);
  }

  async #tick() {
    if (!document.hidden) {
      const succeeded = await this.task();
      this.#failures = succeeded ? 0 : this.#failures + 1;
    }
    if (!this.#running) return;
    const delay = this.#failures === 0 ? this.intervalMs : Math.min(this.backoffBaseMs * 2 ** this.#failures, this.maxDelayMs);
    this.#timer = setTimeout(() => this.#tick(), delay);
  }
}
