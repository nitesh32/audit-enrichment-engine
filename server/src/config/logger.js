import pino from 'pino';

export function createLogger(level) {
  return pino({ level });
}
