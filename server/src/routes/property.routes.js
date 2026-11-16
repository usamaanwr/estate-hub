import { Router } from "express"
import { addProperty , getAllProperty, getMyProperties, getPropertiesById } from "../controller/property.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"
import { authorizeRole } from "../middleware/authorizeRoles.middleware.js"
import { upload } from "../middleware/multer.middleware.js"

const PropertyRouter = Router()

PropertyRouter.route("/add").post(
verifyJWT,
authorizeRole("seller"),
upload.array("images" , 5),
addProperty    
)

PropertyRouter.route("/my-properties").get(
    verifyJWT,
    authorizeRole("seller"),
    getMyProperties
)

PropertyRouter.route("/").get(
getAllProperty
);

PropertyRouter.route("/:id").get(
getPropertiesById
);


export default PropertyRouter