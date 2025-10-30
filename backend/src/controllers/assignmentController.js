const crudOperations = require("./assignment/crudOperations");
const analyticsOperations = require("./assignment/analyticsOperations");
const bulkOperations = require("./assignment/bulkOperations");

module.exports = {
  ...crudOperations,
  ...analyticsOperations,
  ...bulkOperations,
};
