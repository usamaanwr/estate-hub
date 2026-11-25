import {verifyJWT} from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/authorizeRoles.middleware.js";
import { Router } from "express";
import { registerFirstAdmin , approvalProperty,  getPendingProperties,  rejectedProperty, getAllProperties, getAdminPropertyById, getDashboardStats, getAllUsers, getUserById, suspendUser, activateUser } from "../controller/admin.controller.js";

const AdminRouter = Router()

AdminRouter.post("/admin-register", registerFirstAdmin);


AdminRouter.get("/properties",
    verifyJWT,
    authorizeRole("admin"),
    getAllProperties
)
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

AdminRouter.route("/rejected-property/:id").patch(
    verifyJWT,
    authorizeRole("admin"),
    rejectedProperty
)

AdminRouter.get(
  "/properties/:id",
  verifyJWT,
  authorizeRole("admin"),
  getAdminPropertyById
);

AdminRouter.get(
  "/dashboard/stats",
  verifyJWT,
  authorizeRole("admin"),
  getDashboardStats
);

// get all user 
AdminRouter.get(
  "/users",
  verifyJWT,
  authorizeRole("admin"),
  getAllUsers
);

AdminRouter.get(
  "/users/:id",
  verifyJWT,
  authorizeRole("admin"),
  getUserById
);

AdminRouter.patch(
  "/users/:id/suspend",
  verifyJWT,
  authorizeRole("admin"),
  suspendUser
);

AdminRouter.patch(
  "/users/:id/activate",
  verifyJWT,
  authorizeRole("admin"),
  activateUser
);

export default AdminRouter
