const buildQuery = (filters) => {
  const query = {};
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
      query[key] = filters[key];
    }
  });
  
  return query;
};

const buildSearchQuery = (searchTerm, searchFields) => {
  if (!searchTerm || !searchFields.length) {
    return {};
  }
  
  const searchConditions = searchFields.map(field => ({
    [field]: { $regex: searchTerm, $options: "i" }
  }));
  
  return { $or: searchConditions };
};

const buildPaginationQuery = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

const populateFields = (query, populateConfig) => {
  if (!populateConfig || !Array.isArray(populateConfig)) {
    return query;
  }
  
  populateConfig.forEach(config => {
    if (typeof config === "string") {
      query.populate(config);
    } else if (typeof config === "object" && config.path) {
      query.populate(config.path, config.select);
    }
  });
  
  return query;
};

const sortQuery = (query, sortConfig) => {
  if (!sortConfig) {
    return query.sort({ createdAt: -1 });
  }
  
  if (typeof sortConfig === "string") {
    return query.sort(sortConfig);
  }
  
  if (typeof sortConfig === "object") {
    return query.sort(sortConfig);
  }
  
  return query;
};

const executeQuery = async (query, options = {}) => {
  const { populate, sort, skip, limit } = options;
  
  let finalQuery = query;
  
  if (populate) {
    finalQuery = populateFields(finalQuery, populate);
  }
  
  if (sort) {
    finalQuery = sortQuery(finalQuery, sort);
  }
  
  if (skip !== undefined) {
    finalQuery = finalQuery.skip(skip);
  }
  
  if (limit !== undefined) {
    finalQuery = finalQuery.limit(limit);
  }
  
  return await finalQuery.exec();
};

module.exports = {
  buildQuery,
  buildSearchQuery,
  buildPaginationQuery,
  populateFields,
  sortQuery,
  executeQuery,
};



