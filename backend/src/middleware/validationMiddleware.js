const Joi = require("joi");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(", ");
      return res.status(400).json({ 
        message: "Validation error", 
        errors: errorMessage 
      });
    }
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(", ");
      return res.status(400).json({ 
        message: "Parameter validation error", 
        errors: errorMessage 
      });
    }
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(", ");
      return res.status(400).json({ 
        message: "Query validation error", 
        errors: errorMessage 
      });
    }
    next();
  };
};

const schemas = {
  userRegistration: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(8).max(128).required(),
  }),
  
  chefRegistration: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(8).max(128).required(),
    cuisineSpecialty: Joi.array().items(Joi.string().trim()).optional(),
  }),
  
  adminRegistration: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid("super_admin", "admin", "moderator").optional(),
    permissions: Joi.object({
      userManagement: Joi.boolean().optional(),
      chefManagement: Joi.boolean().optional(),
      orderManagement: Joi.boolean().optional(),
      assignmentManagement: Joi.boolean().optional(),
      analyticsAccess: Joi.boolean().optional(),
    }).optional(),
  }),
  
  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),
  
  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),
  
  orderCreation: Joi.object({
    foodName: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).optional(),
    quantity: Joi.number().integer().min(1).max(100).required(),
    numberOfPersons: Joi.number().integer().min(1).max(20).optional(),
    scheduledDate: Joi.date().iso().optional(),
    scheduledTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    specialInstructions: Joi.string().trim().max(500).optional(),
    deliveryAddress: Joi.object({
      street: Joi.string().trim().min(5).max(200).required(),
      city: Joi.string().trim().min(2).max(50).required(),
      state: Joi.string().trim().min(2).max(50).optional(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
      landmark: Joi.string().trim().max(100).optional(),
    }).required(),
    estimatedPrice: Joi.number().min(0).max(10000).optional(),
  }),
  
  orderUpdate: Joi.object({
    status: Joi.string().valid("new", "confirmed", "preparing", "onTheWay", "delivered", "cancelled").optional(),
    cancelReason: Joi.string().trim().max(200).optional(),
    actualPrice: Joi.number().min(0).max(10000).optional(),
  }),
  
  profileUpdate: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).optional(),
    lastName: Joi.string().trim().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    householdSize: Joi.number().integer().min(1).max(20).optional(),
    address: Joi.object({
      street: Joi.string().trim().min(5).max(200).optional(),
      city: Joi.string().trim().min(2).max(50).optional(),
      state: Joi.string().trim().min(2).max(50).optional(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
    }).optional(),
    currentLocation: Joi.string().trim().max(200).optional(),
    preferences: Joi.object({
      cuisines: Joi.array().items(Joi.string().trim()).optional(),
      dietaryType: Joi.string().valid("Veg", "Non-Veg", "Vegan", "Other").optional(),
      allergies: Joi.array().items(Joi.string().trim()).optional(),
      notificationsEnabled: Joi.boolean().optional(),
      language: Joi.string().trim().max(50).optional(),
      accessibility: Joi.boolean().optional(),
      privacyAccepted: Joi.boolean().optional(),
    }).optional(),
  }),
  
  chefProfileUpdate: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).optional(),
    lastName: Joi.string().trim().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    cuisineSpecialty: Joi.array().items(Joi.string().trim()).optional(),
    isAvailable: Joi.boolean().optional(),
  }),
  
  objectId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
  
  orderSearch: Joi.object({
    search: Joi.string().trim().max(100).optional(),
    status: Joi.string().valid("new", "confirmed", "preparing", "onTheWay", "delivered", "cancelled").optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
  
  assignmentCreation: Joi.object({
    userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    chefId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    assignmentType: Joi.string().valid("individual", "subscription").required(),
    subscriptionDetails: Joi.object({
      planType: Joi.string().valid("weekly", "monthly").optional(),
      mealsPerWeek: Joi.number().integer().min(1).max(21).optional(),
      deliveryDays: Joi.array().items(Joi.string().valid("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")).optional(),
      mealPreferences: Joi.object({
        cuisines: Joi.array().items(Joi.string().trim()).optional(),
        dietaryRestrictions: Joi.array().items(Joi.string().trim()).optional(),
        allergies: Joi.array().items(Joi.string().trim()).optional(),
      }).optional(),
    }).when("assignmentType", {
      is: "subscription",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    notes: Joi.string().trim().max(500).optional(),
  }),
  
  assignmentUpdate: Joi.object({
    status: Joi.string().valid("active", "inactive", "suspended", "completed").optional(),
    endDate: Joi.date().iso().optional(),
    subscriptionDetails: Joi.object({
      planType: Joi.string().valid("weekly", "monthly").optional(),
      mealsPerWeek: Joi.number().integer().min(1).max(21).optional(),
      deliveryDays: Joi.array().items(Joi.string().valid("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")).optional(),
      mealPreferences: Joi.object({
        cuisines: Joi.array().items(Joi.string().trim()).optional(),
        dietaryRestrictions: Joi.array().items(Joi.string().trim()).optional(),
        allergies: Joi.array().items(Joi.string().trim()).optional(),
      }).optional(),
    }).optional(),
    notes: Joi.string().trim().max(500).optional(),
    rating: Joi.number().min(1).max(5).optional(),
    feedback: Joi.string().trim().max(1000).optional(),
  }),
  
  assignmentSearch: Joi.object({
    userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    chefId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    status: Joi.string().valid("active", "inactive", "suspended", "completed").optional(),
    assignmentType: Joi.string().valid("individual", "subscription").optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
  
  assignmentStats: Joi.object({
    chefId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  }),
  
  availableChefs: Joi.object({
    cuisineSpecialty: Joi.string().optional(),
    location: Joi.string().optional(),
    excludeUserId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  }),
  
  bulkAssignment: Joi.object({
    assignments: Joi.array().items(
      Joi.object({
        userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        chefId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        assignmentType: Joi.string().valid("individual", "subscription").required(),
        subscriptionDetails: Joi.object({
          planType: Joi.string().valid("weekly", "monthly").optional(),
          mealsPerWeek: Joi.number().integer().min(1).max(21).optional(),
          deliveryDays: Joi.array().items(Joi.string().valid("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")).optional(),
          mealPreferences: Joi.object({
            cuisines: Joi.array().items(Joi.string().trim()).optional(),
            dietaryRestrictions: Joi.array().items(Joi.string().trim()).optional(),
            allergies: Joi.array().items(Joi.string().trim()).optional(),
          }).optional(),
        }).optional(),
        notes: Joi.string().trim().max(500).optional(),
      })
    ).min(1).required(),
  }),
  
  suspendAssignment: Joi.object({
    reason: Joi.string().trim().max(200).optional(),
  }),
  
  chefOrderSearch: Joi.object({
    status: Joi.string().valid("new", "confirmed", "preparing", "onTheWay", "delivered", "cancelled").optional(),
    orderType: Joi.string().valid("individual", "subscription").optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
  
  orderStatusUpdate: Joi.object({
    status: Joi.string().valid("confirmed", "preparing", "onTheWay", "delivered").required(),
    notes: Joi.string().trim().max(200).optional(),
    preparationTime: Joi.number().integer().min(0).max(480).optional(),
    deliveryTime: Joi.number().integer().min(0).max(120).optional(),
  }),
  
  chefNotes: Joi.object({
    notes: Joi.string().trim().max(500).required(),
  }),
  
  chefSchedule: Joi.object({
    date: Joi.date().iso().optional(),
    week: Joi.date().iso().optional(),
  }),
  
  orderAssignment: Joi.object({
    orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    chefId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
  
  orderRating: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().trim().max(1000).optional(),
  }),
  
  subscriptionOrderGeneration: Joi.object({
    assignmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
  }),
  
  subscriptionPause: Joi.object({
    reason: Joi.string().trim().max(200).required(),
  }),
  
  subscriptionPreferences: Joi.object({
    preferences: Joi.object({
      cuisines: Joi.array().items(Joi.string().trim()).optional(),
      dietaryRestrictions: Joi.array().items(Joi.string().trim()).optional(),
      allergies: Joi.array().items(Joi.string().trim()).optional(),
    }).required(),
  }),
};

module.exports = {
  validateRequest,
  validateParams,
  validateQuery,
  schemas,
};
