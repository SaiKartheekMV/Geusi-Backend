const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '..', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'backend-functionalities.xlsx');

// Header
const rows = [
  [
    'Area',
    'Route (example)',
    'Method',
    'Controller / Handler',
    'Auth / Middleware',
    'Short description'
  ]
];

// Hand-curated list of current backend functionality (routes/controllers/services)
const data = [
  ['Health', '/api/health', 'GET', 'server.js (health handler)', 'public', 'Server and DB health check'],

  ['Auth - User', '/api/auth/register', 'POST', 'authController.register', 'public', 'User registration'],
  ['Auth - User', '/api/auth/login', 'POST', 'authController.login', 'public', 'User login, returns JWTs'],
  ['Auth - User', '/api/auth/refresh-token', 'POST', 'authController.refreshToken', 'public', 'Refresh access tokens'],

  ['Auth - Cook', '/api/cook-auth/register', 'POST', 'cookAuthController.register', 'public', 'Chef registration'],
  ['Auth - Cook', '/api/cook-auth/login', 'POST', 'cookAuthController.login', 'public', 'Chef login and tokens'],

  ['Auth - Admin', '/api/admin/login', 'POST', 'adminController.login', 'public', 'Admin login (role-based)'],
  ['Admin', '/api/admin/me', 'GET', 'adminController.me', 'adminAuthMiddleware', 'Get current admin profile'],

  ['Profile - User', '/api/profile', 'GET', 'profileController.getProfile', 'authMiddleware', 'Get own user profile'],
  ['Profile - User', '/api/profile', 'PUT', 'profileController.updateProfile', 'authMiddleware', 'Update profile (preferences, address)'],
  ['Profile - User', '/api/profile/image', 'PUT', 'profileController.updateProfileImage', 'authMiddleware + uploadMiddleware', 'Upload/change profile image'],

  ['Assignments', '/api/assignments', 'POST', 'assignmentController.createAssignment', 'adminAuthMiddleware + requirePermission("assignmentManagement")', 'Create assignment (individual or subscription)'],
  ['Assignments', '/api/assignments/:id', 'PUT', 'assignmentController.updateAssignment', 'adminAuthMiddleware', 'Update assignment (notes, status, etc)'],
  ['Assignments', '/api/assignments/available-chefs', 'GET', 'assignmentController.getAvailableChefs', 'adminAuthMiddleware', 'Find chefs matching criteria'],

  ['Orders', '/api/orders', 'POST', 'orderController.createOrder', 'authMiddleware', 'Create an order; may auto-assign if assignment exists'],
  ['Orders', '/api/orders/:id/cancel', 'PATCH', 'orderController.cancelOrder', 'authMiddleware/adminAuthMiddleware', 'Cancel an order (user/admin)'],
  ['Orders', '/api/orders/:id', 'GET', 'orderController.getOrder', 'authMiddleware/cookAuth', 'Get order details and timeline'],

  ['Chef Orders', '/api/chef-orders/:id/status', 'PATCH', 'chefOrderController.updateStatus', 'cookAuthMiddleware', 'Chef updates order status (preparing, on_the_way, delivered)'],

  ['Subscriptions', '/api/subscriptions/generate-orders', 'POST', 'subscriptionController.createSubscriptionOrders', 'adminAuthMiddleware', 'Generate subscription orders for a subscription assignment'],
  ['Subscriptions', '/api/subscriptions/:assignmentId/pause', 'PATCH', 'subscriptionController.pauseUserSubscription', 'adminAuthMiddleware', 'Pause subscription and cancel pending orders'],
  ['Subscriptions', '/api/subscriptions/:assignmentId/resume', 'PATCH', 'subscriptionController.resumeUserSubscription', 'adminAuthMiddleware', 'Resume subscription and generate upcoming orders'],
  ['Subscriptions', '/api/subscriptions', 'GET', 'subscriptionController.getUserSubscriptions', 'authMiddleware', 'Get current user subscriptions'],

  ['Notifications', '/api/notifications', 'GET', 'notificationController.getMyNotifications', 'authMiddleware', 'Fetch user notifications history'],
  ['Notifications', '/api/notifications/chef', 'GET', 'notificationController.getChefNotifications', 'cookAuthMiddleware', 'Fetch chef notifications history'],
  ['Notifications', '/api/notifications/send/:userId', 'POST', 'notificationController.sendNotificationToUser', 'adminAuthMiddleware', 'Admin send notification to a user/chef/admin'],

  ['Reviews', '/api/reviews', 'POST', 'reviewController.createReview', 'authMiddleware', 'Create a review for a delivered order'],
  ['Reviews', '/api/reviews/:id', 'GET', 'reviewController.getReview', 'public/auth', 'Get a review'],

  ['Uploads', '/api/profile/image', 'PUT', 'uploadMiddleware + profileController.updateProfileImage', 'authMiddleware', 'Profile image upload using multer'],

  ['Middleware', 'N/A', 'N/A', 'authMiddleware / adminAuthMiddleware / cookAuthMiddleware / validationMiddleware', 'N/A', 'JWT auth, role/permission checks, Joi validation'],

  ['Services', 'N/A', 'N/A', 'notificationService, emailService, orderNotificationService, subscriptionService, assignmentValidationService', 'N/A', 'Business logic and helpers (emails, notifications, validations)'],

  ['Realtime', 'Socket.IO namespaces', 'emit', 'server.js + orderNotificationService', 'N/A', 'Real-time notifications to connected users/chefs'],

  ['Logging', 'loggerService', 'N/A', 'loggerService', 'N/A', 'Application logging service used across controllers'],

  ['Misc', '/api/admin/analytics', 'GET', 'adminController.analytics (if present)', 'adminAuthMiddleware', 'Administrative analytics endpoints (if implemented)']
];

for (const r of data) rows.push(r);

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Functionalities');
XLSX.writeFile(wb, outPath);

console.log('Wrote', outPath);
