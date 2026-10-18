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

    it('writes the mail in German by default and in English on request', async () => {
      await service.signup({ email: 'max@uni-hildesheim.de' });
      await service.signup({ email: 'max@uni-hildesheim.de', lang: 'en' });

      expect(mockMail.mock.calls[0][1]).toBe('Dein Lernmaterial-Verteiler Zugang');
      expect(mockMail.mock.calls[1][1]).toBe('Your access to the study material distribution');
      expect(mockMail.mock.calls[1][2]).toContain('Your link:');
    });

    it('states until when the link is valid', async () => {
      await service.signup({ email: 'max@uni-hildesheim.de' });

      const expires = new Date(Date.now() + 180 * 864e5).toLocaleDateString('de-DE');
      expect(mockMail.mock.calls[0][2]).toContain('gültig bis zum ' + expires);
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

    it('creates tokens that expire after about a semester', () => {
      const { token } = service.createToken({ email: 'max@uni-hildesheim.de' });
      const { iat, exp } = jwt.decode(token) as { iat: number, exp: number };
      expect(exp - iat).toBe(180 * 86400);
    });

    it('tells expired tokens apart from invalid ones', async () => {
      const expired = jwt.sign({ email: 'max@uni-hildesheim.de' }, 'test-secret', { expiresIn: -1 });
      const old = jwt.sign({ email: 'max@uni-hildesheim.de', iat: Math.floor(Date.now() / 1000) - 181 * 86400 }, 'test-secret');
      const forged = jwt.sign({ email: 'max@uni-hildesheim.de' }, 'other-secret', { expiresIn: -1 });

      await expect(service.validate({ token: expired })).rejects.toMatchObject({ status: 401, message: 'Expired' });
      await expect(service.validate({ token: old })).rejects.toMatchObject({ status: 401, message: 'Expired' });
      await expect(service.validate({ token: forged })).rejects.toMatchObject({ status: 401, message: 'Not valid' });
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
