/**
 * @studio/worker
 * Background rendering and media processing worker.
 */

import dotenv from 'dotenv';

dotenv.config();

console.log('[Worker] Rendering worker initialized. Waiting for jobs...');

export function initWorker() {
  return {
    status: 'initialized',
    service: '@studio/worker',
    timestamp: new Date().toISOString(),
  };
}

