const crudOperations = require("./order/crudOperations");
const orderManagement = require("./order/orderManagement");
const orderFeatures = require("./order/orderFeatures");

module.exports = {
  ...crudOperations,
  ...orderManagement,
  ...orderFeatures,
};
