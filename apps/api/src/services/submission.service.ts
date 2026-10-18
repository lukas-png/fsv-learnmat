import { randomBytes } from 'crypto';
import config from 'config';
import { createClient, WebDAVClient } from 'webdav';
import HttpException from '@exceptions/HttpException';
import { statsService } from './stats.service';

// Uploaded material lands here unpublished; the student council reviews it and moves it into /altklausuren
export const SUBMISSION_DIR = '/einreichungen';
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Detected from the file content, not from the client's name or MIME type
const FILE_TYPES: { extension: string, matches: (data: Buffer) => boolean }[] = [
  { extension: 'pdf', matches: data => data.subarray(0, 5).toString('latin1') === '%PDF-' },
  { extension: 'png', matches: data => data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { extension: 'jpg', matches: data => data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
];

export const detectFileType = (data: Buffer): string | undefined =>
  FILE_TYPES.find(type => type.matches(data))?.extension;

// Keeps letters (incl. umlauts), digits, spaces and dashes, so the name is safe as a file name
export const safeName = (value: string): string =>
  value.normalize('NFC').replace(/[^\p{L}\p{N} -]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Sonstiges';

class SubmissionService {

  public async submit(file: Buffer, module: string | undefined, note: string | undefined, now = new Date()): Promise<string> {
    const extension = detectFileType(file);
    if (!extension) {
      throw new HttpException(415, 'Only PDF, JPG and PNG files are accepted');
    }

    const moduleName = safeName(module ?? '');
    const baseName = `${now.toISOString().slice(0, 10)}_${moduleName}_${randomBytes(3).toString('hex')}`;

    const client = this.createClient();
    if (!(await client.exists(SUBMISSION_DIR))) {
      await client.createDirectory(SUBMISSION_DIR);
    }
    await client.putFileContents(`${SUBMISSION_DIR}/${baseName}.${extension}`, file, { overwrite: false });

    const trimmedNote = note?.trim();
    if (trimmedNote || module?.trim()) {
      await client.putFileContents(`${SUBMISSION_DIR}/${baseName}.txt`,
        `Modul: ${module?.trim() || '-'}\n\n${trimmedNote ?? ''}\n`, { overwrite: false });
    }

    statsService.record('einreichung', moduleName);
    return `${baseName}.${extension}`;
  }

  private createClient(): WebDAVClient {
    return createClient(config.get('accHost'), {
      username: config.get('accUsername'),
      password: config.get('accPassword'),
    });
  }
}

export default SubmissionService;
