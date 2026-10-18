import MaterialService from './material.service';

const mockMail = jest.fn();
const mockGetDirectoryContents = jest.fn();

jest.mock('config', () => ({
  get: (key: string) => ({
    accHost: 'https://sync.example.de/remote.php/nonshib-webdav',
    accUsername: 'user',
    accPassword: 'pass',
  })[key],
}));
jest.mock('webdav', () => ({
  createClient: jest.fn(() => ({ getDirectoryContents: mockGetDirectoryContents })),
}));
jest.mock('./mail.service', () => ({
  __esModule: true,
  default: jest.fn(() => ({ mail: mockMail })),
}));

const directory = [
  { filename: '/altklausuren', basename: 'altklausuren', type: 'directory', etag: '&quot;root&quot;' },
  { filename: '/altklausuren/Datenbanken', basename: 'Datenbanken', type: 'directory', etag: '&quot;db1&quot;', lastmod: 'Tue, 03 Mar 2026 10:00:00 GMT' },
  { filename: '/altklausuren/Mathematik I', basename: 'Mathematik I', type: 'directory', etag: '&quot;ma1&quot;', lastmod: 'invalid' },
  { filename: '/altklausuren/readme.txt', basename: 'readme.txt', type: 'file', etag: '&quot;txt&quot;' },
];

const ocsOk = (name: string) => ({
  ok: true,
  json: async () => ({ ocs: { meta: { status: 'ok' }, data: { file_target: '/' + name, url: 'https://sync.example.de/s/' + name } } }),
});

describe('MaterialService', () => {
  const service = new MaterialService();
  const fetchMock = jest.fn();

  beforeEach(() => {
    mockMail.mockReset().mockResolvedValue(undefined);
    mockGetDirectoryContents.mockReset().mockResolvedValue(directory);
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('lists only directories, with plain etags and their modification date', async () => {
    const materials = await service.getMaterials();

    expect(materials).toEqual([
      { name: 'altklausuren', etag: 'root', updated: undefined },
      { name: 'Datenbanken', etag: 'db1', updated: '2026-03-03T10:00:00.000Z' },
      { name: 'Mathematik I', etag: 'ma1', updated: undefined },
    ]);
  });

  it('shares only the selected modules and mails the links', async () => {
    fetchMock.mockResolvedValueOnce(ocsOk('Mathematik I'));

    await service.createShares([{ name: 'Mathematik I', etag: 'ma1' }], 'max@uni-hildesheim.de');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url.origin + url.pathname).toBe('https://sync.example.de/ocs/v1.php/apps/files_sharing/api/v1/shares');
    expect(url.searchParams.get('path')).toBe('/altklausuren/Mathematik I');
    expect(url.searchParams.get('name')).toBe('Mathematik I');
    expect(url.searchParams.get('shareType')).toBe('3');
    expect(init.headers.Authorization).toBe('Basic ' + Buffer.from('user:pass').toString('base64'));

    const [to, , text] = mockMail.mock.calls[0];
    expect(to).toBe('max@uni-hildesheim.de');
    expect(text).toContain('Mathematik I ~> https://sync.example.de/s/Mathematik I');
  });

  it('sets the share to expire in 7 days', async () => {
    fetchMock.mockResolvedValueOnce(ocsOk('Datenbanken'));
    const expected = new Date();
    expected.setDate(expected.getDate() + 7);

    await service.createShares([{ name: 'Datenbanken', etag: 'db1' }], 'max@uni-hildesheim.de');

    expect(fetchMock.mock.calls[0][0].searchParams.get('expireDate')).toBe(expected.toISOString().slice(0, 10));
  });

  it('fails with 502 and sends no mail if the share cannot be created', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ocs: { meta: { status: 'failure' } } }) });

    await expect(service.createShares([{ name: 'Datenbanken', etag: 'db1' }], 'max@uni-hildesheim.de'))
      .rejects.toMatchObject({ status: 502 });
    expect(mockMail).not.toHaveBeenCalled();
  });

  it('fails with 502 on an HTTP error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    await expect(service.createShares([{ name: 'Datenbanken', etag: 'db1' }], 'max@uni-hildesheim.de'))
      .rejects.toMatchObject({ status: 502 });
  });
});
