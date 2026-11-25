import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asynHandler.js";
import { prisma } from "../dp/index.js";
import { userRegisterValidation } from "../validator/user.validator.js";
import { hashPassword } from "../../utils/auth.utils.js";
import { timingSafeEqual } from "node:crypto";

// admin routes
const registerFirstAdmin = asyncHandler(async (req, res) => {
  // 1. Check setup secret
  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  const providedSecret = req.get("x-admin-setup-secret");

  if (!setupSecret || !providedSecret) {
    throw new ApiError(403, "Admin setup unauthorized");
  }

  const expected = Buffer.from(setupSecret);
  const provided = Buffer.from(providedSecret);

  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    throw new ApiError(403, "Invalid admin setup secret");
  }

  // 2. Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "admin" },
  });

  if (existingAdmin) {
    throw new ApiError(403, "First admin already registered");
  }

  // 3. Joi validation
  const { error, value } = userRegisterValidation(req.body);

  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { fullName, username, email, password } = value;

  // 4. Check duplicate email/username
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username: username.toLowerCase() }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, "Email or username already exists");
  }

  // 5. Hash password
  const hashedPassword = await hashPassword(password);

  // 6. Create admin
  const admin = await prisma.user.create({
    data: {
      fullName,
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
      role: "admin",
      isApproved: true,
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      role: true,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, admin, "Admin registered successfully"));
});
// get all properties seller
const getAllProperties = asyncHandler(async (req, res) => {
  const properties = await prisma.property.findMany({
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, properties, "All properties fetched successfully")
    );
});

const getPendingProperties = asyncHandler(async (req, res) => {
  const properties = await prisma.property.findMany({
    where: {
      approvalStatus: "pending",
    },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        properties,
        "pending properties fetched successFully"
      )
    );
});

// approval property
const approvalProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await prisma.property.findUnique({
    where: { id },
  });
  if (!property) {
    throw new ApiError(404, "Property not found");
  }
  if (property.approvalStatus === "approved") {
    throw new ApiError(400, "Property is not pending");
  }
  const updateProperty = await prisma.property.update({
    where: { id },
    data: {
      approvalStatus: "approved",
    },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, updateProperty, "Property approved successfully")
    );
});

//get rejected properties

const rejectedProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await prisma.property.findUnique({
    where: { id },
  });
  if (!property) {
    throw new ApiError(404, "Property not found");
  }
  if (property.approvalStatus === "rejected") {
    throw new ApiError(400, "Property is already rejected");
  }
  const updateProperty = await prisma.property.update({
    where: {
      id,
    },
    data: {
      approvalStatus: "rejected",
    },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, updateProperty, "Property rejected successfully")
    );
});
/// check properties api
const getAdminPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, property, "Property fetched successfully"));
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalProperties,
    pendingProperties,
    approvedProperties,
    rejectedProperties,
    totalSellers,
    totalBuyers,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({
      where: { approvalStatus: "pending" },
    }),
    prisma.property.count({
      where: { approvalStatus: "approved" },
    }),
    prisma.property.count({
      where: { approvalStatus: "rejected" },
    }),
    prisma.user.count({
      where: { role: "seller" },
    }),
    prisma.user.count({
      where: { role: "buyer" },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalProperties,
        pendingProperties,
        approvedProperties,
        rejectedProperties,
        totalSellers,
        totalBuyers,
      },
      "Dashboard statistics fetched successfully"
    )
  );
});

// get all user : buyyer and seller 

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["buyer", "seller"],
      },
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      users,
      "Users fetched successfully"
    )
  );
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || user.role === "admin") {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, "User fetched successfully")
  );
});

// suspendUser 
const suspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // User find karo
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Admin ko suspend nahi kar sakte
  if (user.role === "admin") {
    throw new ApiError(403, "Admin cannot be suspended");
  }

  // Already suspended
  if (user.accountStatus === "suspended") {
    throw new ApiError(400, "User is already suspended");
  }

  // Suspend account
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      accountStatus: "suspended",
      refreshToken: null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      accountStatus: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, updatedUser, "User suspended successfully")
  );
});

///activate user by id 
const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "admin") {
    throw new ApiError(403, "Admin account cannot be modified");
  }

  if (user.accountStatus === "active") {
    throw new ApiError(400, "User is already active");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      accountStatus: "active",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      accountStatus: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, updatedUser, "User activated successfully")
  );
});
export {
  registerFirstAdmin,
  getAllProperties,
  getPendingProperties,
  approvalProperty,
  rejectedProperty,
  getAdminPropertyById,
  getDashboardStats,
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser
};
