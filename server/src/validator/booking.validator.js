import Joi from "joi";

export const bookingValidation = (data) => {
  const schema = Joi.object({
    propertyId: Joi.string().uuid().required(),

    visitDate: Joi.date()
      .greater("now")
      .required(),

    city: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required(),

    message: Joi.string()
      .trim()
      .max(1000)
      .allow("")
      .optional(),
  });

  return schema.validate(data, {
    abortEarly: false,
    convert: true,
  });
};