import { StatsService, parseCsv, toCsv } from './stats.service';

const files = new Map<string, string>();
const mockClient = {
  exists: jest.fn(async (path: string) => path === '/statistik' ? mockDirExists : files.has(path)),
  createDirectory: jest.fn(async () => { mockDirExists = true; }),
  getFileContents: jest.fn(async (path: string) => files.get(path)),
  putFileContents: jest.fn(async (path: string, data: string) => { files.set(path, data); }),
};
let mockDirExists = true;

jest.mock('config', () => ({ get: () => 'x' }));
jest.mock('@utils/logger', () => ({ logger: { warn: jest.fn() } }));
jest.mock('webdav', () => ({ createClient: () => mockClient }));

const october = new Date('2026-10-18T12:00:00Z');

describe('StatsService', () => {
  let stats: StatsService;

  beforeEach(() => {
    files.clear();
    mockDirExists = true;
    Object.values(mockClient).forEach(fn => fn.mockClear());
    stats = new StatsService();
  });

  it('writes monthly totals per category and name', async () => {
    stats.record('anmeldung', 'de');
    stats.record('anmeldung', 'de');
    stats.record('anmeldung', 'en');
    stats.record('modul', 'Datenbanken');

    await stats.flush(october);

    expect(files.get('/statistik/2026-10.csv')).toBe(
      'typ;name;anzahl\nanmeldung;de;2\nanmeldung;en;1\nmodul;Datenbanken;1\n');
  });

  it('adds to the existing file of the month', async () => {
    files.set('/statistik/2026-10.csv', 'typ;name;anzahl\nmodul;Datenbanken;5\n');
    stats.record('modul', 'Datenbanken');
    stats.record('modul', 'Mathematik I');

    await stats.flush(october);

    expect(files.get('/statistik/2026-10.csv')).toBe('typ;name;anzahl\nmodul;Datenbanken;6\nmodul;Mathematik I;1\n');
  });

  it('starts a new file each month', async () => {
    stats.record('modul', 'Datenbanken');
    await stats.flush(october);
    stats.record('modul', 'Datenbanken');
    await stats.flush(new Date('2026-11-02T08:00:00Z'));

    expect(files.get('/statistik/2026-10.csv')).toContain('modul;Datenbanken;1');
    expect(files.get('/statistik/2026-11.csv')).toContain('modul;Datenbanken;1');
  });

  it('creates the statistics folder if needed', async () => {
    mockDirExists = false;
    stats.record('modul', 'Datenbanken');

    await stats.flush(october);

    expect(mockClient.createDirectory).toHaveBeenCalledWith('/statistik');
  });

  it('does not touch the cloud when nothing was recorded', async () => {
    await stats.flush(october);
    expect(mockClient.exists).not.toHaveBeenCalled();
  });

  it('keeps the counts if writing fails and retries with the next flush', async () => {
    mockClient.putFileContents.mockRejectedValueOnce(new Error('offline'));
    stats.record('modul', 'Datenbanken');

    await expect(stats.flush(october)).resolves.toBeUndefined();
    expect(files.size).toBe(0);

    stats.record('modul', 'Datenbanken');
    await stats.flush(october);
    expect(files.get('/statistik/2026-10.csv')).toContain('modul;Datenbanken;2');
  });

  it('never runs two flushes at the same time', async () => {
    stats.record('modul', 'A');
    const first = stats.flush(october);
    stats.record('modul', 'A');
    const second = stats.flush(october);
    await Promise.all([first, second]);

    expect(files.get('/statistik/2026-10.csv')).toContain('modul;A;2');
  });
});

describe('CSV helpers', () => {
  it('round-trips names with separators and quotes', () => {
    const counts = new Map([['modul\u0000Mathe; "Teil" 1', 3]]);
    expect(toCsv(counts)).toBe('typ;name;anzahl\nmodul;"Mathe; ""Teil"" 1";3\n');
    expect(parseCsv(toCsv(counts))).toEqual(counts);
  });

  it('ignores empty and broken lines', () => {
    expect(parseCsv('typ;name;anzahl\n\nmodul;A;x\nmodul;B;2\r\n')).toEqual(new Map([['modul\u0000B', 2]]));
  });
});
