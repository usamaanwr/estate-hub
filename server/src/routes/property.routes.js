import { Router } from "express"
import { addProperty } from "../controller/property.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"
import { authorizeRole } from "../middleware/authorizeRoles.middleware.js"
import { upload } from "../middleware/multer.middleware.js"

const PropertyRouter = Router()

PropertyRouter.route("/add").post(
verifyJWT,
authorizeRole("seller" , "agent"),
upload.array("images" , 5),
addProperty    
)

export default PropertyRouter