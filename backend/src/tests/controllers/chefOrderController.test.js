const chefOrderController = require('../../controllers/chefOrderController');
const Order = require('../../models/Order');
const Assignment = require('../../models/Assignment');
const { sendOrderStatusNotification } = require('../../services/orderNotificationService');
const { sendResponse, sendErrorResponse, calculatePagination } = require('../../utils/controllerUtils');

jest.mock('../../models/Order');
jest.mock('../../models/Assignment');
jest.mock('../../services/orderNotificationService');
jest.mock('../../utils/controllerUtils');

describe('Chef Order Controller', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getChefOrders', () => {
    test('should retrieve chef orders', async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      Order.countDocuments.mockResolvedValue(0);
      calculatePagination.mockReturnValue({ pagination: {} });

      const req = { user: { _id: '1' }, query: {} }, res = {};
      await chefOrderController.getChefOrders(req, res);
      expect(sendResponse).toHaveBeenCalled();
    });
  });

  describe('getChefOrderById', () => {
    test('should return 404 if order not found', async () => {
      Order.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null),
      });
      const req = { user: { _id: '1' }, params: { id: '99' } }, res = {};
      await chefOrderController.getChefOrderById(req, res);
      expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, 'Order not found');
    });
  });
});
