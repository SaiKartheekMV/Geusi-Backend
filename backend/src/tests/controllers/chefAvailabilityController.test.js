const chefAvailabilityController = require('../../controllers/chefAvailabilityController');
const Chef = require('../../models/Chef');
const { sendResponse, sendErrorResponse } = require('../../utils/controllerUtils');

jest.mock('../../models/Chef');
jest.mock('../../utils/controllerUtils');

describe('Chef Availability Controller', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getAvailability', () => {
    test('should return 404 if chef not found', async () => {
      Chef.findById.mockResolvedValue(null);
      const req = { params: { id: '123' } }, res = {};
      await chefAvailabilityController.getAvailability(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, 'Chef not found');
    });

    test('should return availability successfully', async () => {
      Chef.findById.mockResolvedValue({ availability: {}, serviceAreas: [], isAvailable: true });
      const req = { params: { id: '123' } }, res = {};
      await chefAvailabilityController.getAvailability(req, res);
      expect(sendResponse).toHaveBeenCalledWith(
        res,
        200,
        expect.objectContaining({ isAvailable: true }),
        'Chef availability retrieved successfully'
      );
    });
  });

  describe('updateSchedule', () => {
    test('should validate schedule type', async () => {
      const req = { body: { schedule: 'invalid' }, user: { _id: '1' } }, res = {};
      await chefAvailabilityController.updateSchedule(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, 'Schedule must be an array');
    });

    test('should return 404 if chef not found', async () => {
      Chef.findById.mockResolvedValue(null);
      const req = { body: { schedule: [{ day: 'Mon', slots: [] }] }, user: { _id: '1' } }, res = {};
      await chefAvailabilityController.updateSchedule(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, 'Chef not found');
    });
  });

  describe('toggleAvailability', () => {
    test('should toggle availability', async () => {
      const chef = { isAvailable: false, save: jest.fn() };
      Chef.findById.mockResolvedValue(chef);
      const req = { user: { _id: '1' } }, res = {};
      await chefAvailabilityController.toggleAvailability(req, res);
      expect(sendResponse).toHaveBeenCalled();
    });
  });
});
