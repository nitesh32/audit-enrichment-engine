/** Caps how many async tasks run at once. */
export class Semaphore {
  #available;
  #waiting = [];

  constructor(limit) {
    this.#available = limit;
  }

  /**
   * @template T
   * @param {() => Promise<T>} task
   * @returns {Promise<T>}
   */
  async run(task) {
    await this.#acquire();
    try {
      return await task();
    } finally {
      this.#release();
    }
  }

  #acquire() {
    if (this.#available > 0) {
      this.#available -= 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.#waiting.push(resolve));
  }

  #release() {
    const next = this.#waiting.shift();
    if (next) next();
    else this.#available += 1;
  }
}
