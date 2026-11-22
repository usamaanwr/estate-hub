import Joi from "joi";

export const propertyCreateSchema = Joi.object({
  title: Joi.string().trim().min(5).max(150).required(),

  description: Joi.string()
    .trim()
    .min(20)
    .max(5000)
    .required(),

  price: Joi.number().positive().required(),

  city: Joi.string().trim().min(2).max(100).required(),

  location: Joi.string().trim().min(5).max(255).required(),

  type: Joi.string()
    .valid("house", "apartment", "plot", "villa", "commercial")
    .required(),

  bedroom: Joi.number().integer().min(0).default(0),

  bathroom: Joi.number().integer().min(0).default(0),

  area: Joi.number().positive().required(),

  areaUnit: Joi.string()
    .valid("sqft", "sqyd", "marla", "kanal")
    .default("sqft"),
});

export const validatePropertyUpdate = (data) => {
  return propertyCreateSchema
    .fork(
      [
        "title",
        "description",
        "price",
        "city",
        "location",
        "type",
        "area",
      ],
      (schema) => schema.optional()
    )
    .validate(data, {
      abortEarly: false,
      convert: true,
      stripUnknown: false,
      noDefaults: true,
    });
};
export const validateProperty = (data) => {
  return propertyCreateSchema.validate(data, {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  });
};