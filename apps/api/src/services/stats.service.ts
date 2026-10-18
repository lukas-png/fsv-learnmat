import config from 'config';
import { createClient, WebDAVClient } from 'webdav';
import { logger } from '@utils/logger';

// Anonymous usage statistics: monthly totals per category and name

export type StatsCategory = 'anmeldung' | 'modul' | 'einreichung';

const STATS_DIR = '/statistik';
const FLUSH_INTERVAL_MS = 10 * 60 * 1000;
const HEADER = 'typ;name;anzahl';

const key = (category: StatsCategory, name: string) => category + '\u0000' + name;

const quote = (value: string) => (/[;"\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value);

export const parseCsv = (csv: string): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const line of csv.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (quoted) {
        if (char === '"' && line[i + 1] === '"') { field += '"'; i++; }
        else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ';') { fields.push(field); field = ''; }
      else field += char;
    }
    fields.push(field);
    const [category, name, count] = fields;
    if (category && name !== undefined && !isNaN(Number(count))) {
      counts.set(key(category as StatsCategory, name), Number(count));
    }
  }
  return counts;
};

export const toCsv = (counts: Map<string, number>): string =>
  [HEADER, ...[...counts.entries()]
    .map(([k, count]) => [...k.split('\u0000'), count] as [string, string, number])
    .sort((a, b) => a[0].localeCompare(b[0]) || b[2] - a[2] || a[1].localeCompare(b[1]))
    .map(([category, name, count]) => [category, quote(name), count].join(';'))].join('\n') + '\n';

export class StatsService {
  private pending = new Map<string, number>();
  private flushing: Promise<void> = Promise.resolve();
  private timer?: NodeJS.Timeout;

  record(category: StatsCategory, name: string, amount = 1) {
    const k = key(category, name);
    this.pending.set(k, (this.pending.get(k) ?? 0) + amount);
  }

  start() {
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    // Don't keep the process alive just for statistics
    this.timer.unref();
  }

  stop(): Promise<void> {
    clearInterval(this.timer);
    return this.flush();
  }

  // Merges pending counts into the current month's file; flushes never run in parallel
  flush(now = new Date()): Promise<void> {
    this.flushing = this.flushing.then(() => this.writePending(now));
    return this.flushing;
  }

  private async writePending(now: Date) {
    if (this.pending.size === 0) return;
    const batch = this.pending;
    this.pending = new Map();

    const month = now.toISOString().slice(0, 7);
    const path = `${STATS_DIR}/${month}.csv`;
    try {
      const client = this.createClient();
      if (!(await client.exists(STATS_DIR))) {
        await client.createDirectory(STATS_DIR);
      }
      const counts = (await client.exists(path))
        ? parseCsv((await client.getFileContents(path, { format: 'text' })) as string)
        : new Map<string, number>();
      for (const [k, amount] of batch) {
        counts.set(k, (counts.get(k) ?? 0) + amount);
      }
      await client.putFileContents(path, toCsv(counts), { overwrite: true });
    } catch (error) {
      // Statistics must never break the actual service; keep the counts for the next attempt
      for (const [k, amount] of batch) {
        this.pending.set(k, (this.pending.get(k) ?? 0) + amount);
      }
      logger.warn(`Could not write usage statistics: ${(error as Error).message}`);
    }
  }

  private createClient(): WebDAVClient {
    return createClient(config.get('accHost'), {
      username: config.get('accUsername'),
      password: config.get('accPassword'),
    });
  }
}

export const statsService = new StatsService();
