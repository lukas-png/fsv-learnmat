import SubmissionService, { detectFileType, safeName } from './submission.service';

const files = new Map<string, unknown>();
let mockDirExists = true;
const mockClient = {
  exists: jest.fn(async () => mockDirExists),
  createDirectory: jest.fn(async () => undefined),
  putFileContents: jest.fn(async (path: string, data: unknown) => { files.set(path, data); }),
};
const mockRecord = jest.fn();

jest.mock('config', () => ({ get: () => 'x' }));
jest.mock('webdav', () => ({ createClient: () => mockClient }));
jest.mock('./stats.service', () => ({ statsService: { record: (...args: unknown[]) => mockRecord(...args) } }));

const pdf = Buffer.from('%PDF-1.7\n...');
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const now = new Date('2026-10-18T12:00:00Z');

describe('detectFileType', () => {
  it('recognizes PDF, PNG and JPEG by their content', () => {
    expect(detectFileType(pdf)).toBe('pdf');
    expect(detectFileType(png)).toBe('png');
    expect(detectFileType(jpg)).toBe('jpg');
  });

  it('rejects other content, even with a fitting name', () => {
    expect(detectFileType(Buffer.from('<script>alert(1)</script>'))).toBeUndefined();
    expect(detectFileType(Buffer.from('PK\u0003\u0004'))).toBeUndefined();
    expect(detectFileType(Buffer.alloc(0))).toBeUndefined();
  });
});

describe('safeName', () => {
  it.each([
    ['Datenbanken', 'Datenbanken'],
    ['Mathematik I', 'Mathematik I'],
    ['Übung Grundlagen-Informatik', 'Übung Grundlagen-Informatik'],
    ['../../etc/passwd', 'etc passwd'],
    ['a/b\\c:d*e?f"g<h>i|j', 'a b c d e f g h i j'],
    ['', 'Sonstiges'],
    ['///', 'Sonstiges'],
  ])('%s -> %s', (input, expected) => {
    expect(safeName(input)).toBe(expected);
  });

  it('limits the length', () => {
    expect(safeName('x'.repeat(500))).toHaveLength(80);
  });
});

describe('SubmissionService', () => {
  const service = new SubmissionService();

  beforeEach(() => {
    files.clear();
    mockDirExists = true;
    Object.values(mockClient).forEach(fn => fn.mockClear());
    mockRecord.mockClear();
  });

  it('stores the file with date, module and a random suffix, without overwriting', async () => {
    const name = await service.submit(pdf, 'Datenbanken', undefined, now);

    expect(name).toMatch(/^2026-10-18_Datenbanken_[0-9a-f]{6}\.pdf$/);
    expect(mockClient.putFileContents).toHaveBeenCalledWith(`/einreichungen/${name}`, pdf, { overwrite: false });
    expect(mockRecord).toHaveBeenCalledWith('einreichung', 'Datenbanken');
  });

  it('stores module and note next to the file', async () => {
    const name = await service.submit(png, 'Mathe', '  WS 25/26  ', now);

    expect(files.get(`/einreichungen/${name.replace('.png', '.txt')}`)).toBe('Modul: Mathe\n\nWS 25/26\n');
  });

  it('files submissions without module under "Sonstiges" and writes no note file', async () => {
    const name = await service.submit(jpg, undefined, undefined, now);

    expect(name).toMatch(/^2026-10-18_Sonstiges_[0-9a-f]{6}\.jpg$/);
    expect(files.size).toBe(1);
  });

  it('creates the submission folder if needed', async () => {
    mockDirExists = false;
    await service.submit(pdf, 'A', undefined, now);
    expect(mockClient.createDirectory).toHaveBeenCalledWith('/einreichungen');
  });

  it('rejects unsupported files with 415 before touching the cloud', async () => {
    await expect(service.submit(Buffer.from('hello'), 'A', undefined, now)).rejects.toMatchObject({ status: 415 });
    expect(mockClient.exists).not.toHaveBeenCalled();
    expect(mockRecord).not.toHaveBeenCalled();
  });
});
