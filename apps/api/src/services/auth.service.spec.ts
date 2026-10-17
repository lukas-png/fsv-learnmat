import jwt from 'jsonwebtoken';
import AuthService from './auth.service';

const mockMail = jest.fn();

jest.mock('config', () => ({
  get: (key: string) => ({ secretKey: 'test-secret', domain: 'https://learnmat.example.de' })[key],
}));
jest.mock('./mail.service', () => ({
  __esModule: true,
  default: jest.fn(() => ({ mail: mockMail })),
}));

describe('AuthService', () => {
  const service = new AuthService();

  beforeEach(() => {
    mockMail.mockReset().mockResolvedValue(undefined);
  });

  describe('signup', () => {
    it('sends a mail with a personal access link', async () => {
      await service.signup({ email: 'max@uni-hildesheim.de' });

      expect(mockMail).toHaveBeenCalledTimes(1);
      const [to, , text] = mockMail.mock.calls[0];
      expect(to).toBe('max@uni-hildesheim.de');

      const token = text.match(/browse\?token=(\S+)/)?.[1];
      expect(text).toContain('https://learnmat.example.de/browse?token=');
      expect(jwt.verify(token, 'test-secret')).toMatchObject({ email: 'max@uni-hildesheim.de' });
    });

    it('rejects non-university addresses without sending a mail', async () => {
      await expect(service.signup({ email: 'max@gmail.com' })).rejects.toMatchObject({ status: 400 });
      expect(mockMail).not.toHaveBeenCalled();
    });

    it('rejects an empty address', async () => {
      await expect(service.signup({ email: '' })).rejects.toMatchObject({ status: 400 });
    });

    it('fails when the mail cannot be sent', async () => {
      mockMail.mockRejectedValue(new Error('SMTP down'));
      await expect(service.signup({ email: 'max@uni-hildesheim.de' })).rejects.toThrow('SMTP down');
    });
  });

  describe('validate', () => {
    it('accepts a token it created', async () => {
      const { token } = service.createToken({ email: 'max@uni-hildesheim.de' });
      await expect(service.validate({ token })).resolves.toBe(true);
    });

    it('rejects a token signed with another secret', async () => {
      const token = jwt.sign({ email: 'max@uni-hildesheim.de' }, 'other-secret');
      await expect(service.validate({ token })).rejects.toMatchObject({ status: 401 });
    });

    it('rejects a malformed or missing token', async () => {
      await expect(service.validate({ token: 'not-a-jwt' })).rejects.toMatchObject({ status: 401 });
      await expect(service.validate({ token: '' })).rejects.toMatchObject({ status: 401 });
    });
  });
});
