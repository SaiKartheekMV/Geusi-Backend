const notificationController = require('../../controllers/notificationController');
const { addNotificationToUser, markNotificationRead } = require('../../services/notificationService');
const User = require('../../models/User');
const Chef = require('../../models/Chef');
const { sendResponse } = require('../../utils/controllerUtils');

jest.mock('../../services/notificationService');
jest.mock('../../models/User');
jest.mock('../../models/Chef');
jest.mock('../../utils/controllerUtils');

describe('Notification Controller', () => {
  afterEach(() => jest.clearAllMocks());

  test('sendNotificationSelf sends notification', async () => {
    addNotificationToUser.mockResolvedValue({ msg: 'done' });
    const req = { user: { _id: '1' }, body: { message: 'Hi' }, app: { get: () => ({ to: () => ({ emit: jest.fn() }) }) } };
    const res = {};
    await notificationController.sendNotificationSelf(req, res);
    expect(sendResponse).toHaveBeenCalled();
  });

  test('getMyNotifications works', async () => {
    User.findById.mockResolvedValue({ notifications: [] });
    const req = { user: { _id: '1' } }, res = {};
    await notificationController.getMyNotifications(req, res);
    expect(sendResponse).toHaveBeenCalled();
  });

  test('markRead calls markNotificationRead', async () => {
    markNotificationRead.mockResolvedValue({ id: 1 });
    const req = { user: { _id: '1' }, params: { notificationId: '5' } }, res = {};
    await notificationController.markRead(req, res);
    expect(sendResponse).toHaveBeenCalled();
  });
});
