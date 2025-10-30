const crudOperations = require("./order/crudOperations");
const orderManagement = require("./order/orderManagement");
const orderFeatures = require("./order/orderFeatures");
const paymentOperations = require("./order/paymentOperations");

module.exports = {
  ...crudOperations,
  ...orderManagement,
  ...orderFeatures,
  ...paymentOperations,
};
