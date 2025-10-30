const emailService = require('../../services/emailService');
const { transporter } = require('../../services/email/transporter');

jest.mock('../../services/email/transporter');

describe('Email Service', () => {
  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASSWORD = 'testpassword';
    jest.clearAllMocks();
  });

  describe('sendPasswordResetEmail', () => {
    test('should be a function', () => {
      expect(typeof emailService.sendPasswordResetEmail).toBe('function');
    });

    test('should accept three parameters', () => {
      expect(emailService.sendPasswordResetEmail.length).toBe(3);
    });

    test('should return a promise', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const result = emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        'User'
      );
      expect(result).toBeInstanceOf(Promise);
      
      const resolvedResult = await result;
      expect(resolvedResult.success).toBe(true);
    });

    test('should handle missing environment variables gracefully', async () => {
      const originalFrontendUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      transporter.sendMail.mockRejectedValue(new Error('Missing FRONTEND_URL'));

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    test('should handle missing email user gracefully', async () => {
      const originalEmailUser = process.env.EMAIL_USER;
      delete process.env.EMAIL_USER;

      transporter.sendMail.mockRejectedValue(new Error('Missing EMAIL_USER'));

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      process.env.EMAIL_USER = originalEmailUser;
    });

    test('should handle missing email password gracefully', async () => {
      const originalEmailPassword = process.env.EMAIL_PASSWORD;
      delete process.env.EMAIL_PASSWORD;

      transporter.sendMail.mockRejectedValue(new Error('Missing EMAIL_PASSWORD'));

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      process.env.EMAIL_PASSWORD = originalEmailPassword;
    });

    test('should handle invalid email format', async () => {
      transporter.sendMail.mockRejectedValue(new Error('Invalid email format'));
      
      const result = await emailService.sendPasswordResetEmail(
        'invalid-email',
        'token',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle empty email', async () => {
      transporter.sendMail.mockRejectedValue(new Error('Empty email'));
      
      const result = await emailService.sendPasswordResetEmail(
        '',
        'token',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle null email', async () => {
      transporter.sendMail.mockRejectedValue(new Error('Null email'));
      
      const result = await emailService.sendPasswordResetEmail(
        null,
        'token',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle undefined email', async () => {
      transporter.sendMail.mockRejectedValue(new Error('Undefined email'));
      
      const result = await emailService.sendPasswordResetEmail(
        undefined,
        'token',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle empty token', async () => {
      transporter.sendMail.mockRejectedValue(new Error('Empty token'));
      
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        '',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle null token', async () => {
      transporter.sendMail.mockRejectedValue(new Error('Null token'));
      
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        null,
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle undefined token', async () => {
      transporter.sendMail.mockRejectedValue(new Error('Undefined token'));
      
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        undefined,
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle empty user name', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        ''
      );

      expect(result.success).toBe(true);
    });

    test('should handle null user name', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        null
      );

      expect(result.success).toBe(true);
    });

    test('should handle undefined user name', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        undefined
      );

      expect(result.success).toBe(true);
    });

    test('should handle special characters in email', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const result = await emailService.sendPasswordResetEmail(
        'user+test@example.com',
        'token',
        'User'
      );

      expect(result.success).toBe(true);
    });

    test('should handle special characters in token', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token+with/special=chars',
        'User'
      );

      expect(result.success).toBe(true);
    });

    test('should handle special characters in user name', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        'User "Johnny" O\'Connor'
      );

      expect(result.success).toBe(true);
    });

    test('should handle very long email', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const longEmail = 'a'.repeat(100) + '@example.com';
      const result = await emailService.sendPasswordResetEmail(
        longEmail,
        'token',
        'User'
      );

      expect(result.success).toBe(true);
    });

    test('should handle very long token', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const longToken = 'a'.repeat(1000);
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        longToken,
        'User'
      );

      expect(result.success).toBe(true);
    });

    test('should handle very long user name', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      const longName = 'a'.repeat(1000);
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'token',
        longName
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Email Service Module', () => {
    test('should export sendPasswordResetEmail function', () => {
      expect(emailService).toHaveProperty('sendPasswordResetEmail');
      expect(typeof emailService.sendPasswordResetEmail).toBe('function');
    });

    test('should not export other functions', () => {
      const exportedFunctions = Object.keys(emailService);
      expect(exportedFunctions).toEqual(['sendPasswordResetEmail']);
    });
  });
});
