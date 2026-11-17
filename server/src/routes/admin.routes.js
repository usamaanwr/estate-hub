import {verifyJWT} from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/authorizeRoles.middleware.js";
import { Router } from "express";
const AdminRouter = Router()
import { approvalProperty, approvedSellerbyId, getApprovedSeller, getPendingProperties, getPendingSellers, rejectedProperty } from "../controller/admin.controller.js";
AdminRouter.route("/pending-properties").get(
    verifyJWT,
    authorizeRole("admin"),
    getPendingProperties
)

AdminRouter.route("/pending-seller").get(
    verifyJWT,
    authorizeRole("admin"),
    getPendingSellers
)
AdminRouter.route("/approved-seller").get(
    verifyJWT,
    authorizeRole("admin"),
    getApprovedSeller
)
AdminRouter.route("/approved-seller/:id").patch(
    verifyJWT,
    authorizeRole("admin"),
    approvedSellerbyId
)
AdminRouter.route("/approval-property/:id").patch(
    verifyJWT,
    authorizeRole("admin"),
    approvalProperty
)

AdminRouter.route("/rejected-property/:id").patch(
    verifyJWT,
    authorizeRole("admin"),
    rejectedProperty
)
export default AdminRouter
