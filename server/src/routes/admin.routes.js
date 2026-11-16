import {verifyJWT} from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/authorizeRoles.middleware.js";
import { Router } from "express";
const AdminRouter = Router()
import { approvalProperty, getPendingProperties } from "../controller/admin.controller.js";
AdminRouter.route("/pending-properties").get(
    verifyJWT,
    authorizeRole("admin"),
    getPendingProperties
)

AdminRouter.route("/approval-property/:id").patch(
    verifyJWT,
    authorizeRole("admin"),
    approvalProperty
)

export default AdminRouter
