const chefProfileController = require('../../controllers/chefProfileController');
const Chef = require('../../models/Chef');
const { sendResponse, sendErrorResponse } = require('../../utils/controllerUtils');

jest.mock('../../models/Chef');
jest.mock('../../utils/controllerUtils');

describe('Chef Profile Controller', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getChefProfile', () => {
    test('should return 404 if chef not found', async () => {
      Chef.findById.mockResolvedValue(null);
      const req = { user: { _id: '1' } }, res = {};
      await chefProfileController.getChefProfile(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, 'Chef not found');
    });
  });

  describe('updateChefProfile', () => {
    test('should update profile successfully', async () => {
      const chef = { _id: '1', save: jest.fn(), email: 'a@b.com' };
      Chef.findById.mockResolvedValue(chef);
      const req = { user: { _id: '1' }, body: { firstName: 'John' } }, res = {};
      await chefProfileController.updateChefProfile(req, res);
      expect(sendResponse).toHaveBeenCalledWith(
        res,
        200,
        expect.any(Object),
        'Profile updated successfully'
      );
    });
  });
});
