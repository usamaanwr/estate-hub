import Joi from "joi";
export const userRegisterValidation  = (data)=>{
    const schema = Joi.object({
         fullName: Joi.string().min(3).max(20).required().trim(),
         username: Joi.string().alphanum().min(3).max(20).required(),
            password: Joi.string().min(6).max(10).required(),
              email:Joi.string().email({
                minDomainSegments: 2,
                tlds:{allow: ['com' , 'net']}
            }).required(),
    })
    return schema.validate(data)
}