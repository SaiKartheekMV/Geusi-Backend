const cookAuthController = require('../../controllers/cookAuthController');
const authService = require('../../services/authService');
const Chef = require('../../models/Chef');

jest.mock('../../services/authService');
jest.mock('../../models/Chef');

describe('Cook Auth Controller', () => {
  const req = {}, res = {};

  test('register calls authService.register', async () => {
    await cookAuthController.register(req, res);
    expect(authService.register).toHaveBeenCalledWith(req, res, Chef, 'chef');
  });

  test('login calls authService.login', async () => {
    await cookAuthController.login(req, res);
    expect(authService.login).toHaveBeenCalledWith(req, res, Chef, 'chef');
  });

  test('logout calls authService.logout', async () => {
    await cookAuthController.logout(req, res);
    expect(authService.logout).toHaveBeenCalledWith(req, res, Chef);
  });

  test('me calls authService.me', async () => {
    await cookAuthController.me(req, res);
    expect(authService.me).toHaveBeenCalledWith(req, res, 'chef');
  });
});
