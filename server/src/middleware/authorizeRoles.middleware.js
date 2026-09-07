import {ApiError} from "../../utils/ApiError.js"

export const authorizeRole = (...allowedRoles)=>{
    return(req , res , next)=>{
        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(404 ,"you are not authoried to perform this action");
        }
        next();
    }
}