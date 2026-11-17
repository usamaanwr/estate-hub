import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asynHandler.js";
import { prisma } from "../dp/index.js";

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


const getPendingSellers = asyncHandler(async(req , res)=>{
  
  const sellers = await prisma.user.findMany({
    where:{
      role: "seller",
      isApproved: false,
    },
    select:{
      id: true,
      fullName: true,
      username: true,
      email: true,
      isApproved: true,
      createdAt: true
    },
    orderBy:{
      createdAt: "desc"
    },
  })
   return res.status(200).json(
    new ApiResponse(
      200,
      sellers,
      "Pending sellers fetched successfully"
    )
  );
})
// get approved seller 
const getApprovedSeller = asyncHandler(async(req , res)=>{
  
  const sellers = await prisma.user.findMany({
    where:{
      role: "seller",
      isApproved: true,
    },
    select:{
      id: true,
      fullName: true,
      username: true,
      email: true,
      isApproved: true,
      createdAt: true
    },
    orderBy:{
      createdAt: "desc"
    },
  })
   return res.status(200).json(
    new ApiResponse(
      200,
      sellers,
      "Approved  sellers fetched successfully"
    )
  );
})

// update by seller is approved 

const  approvedSellerbyId = asyncHandler(async(req , res) =>{
const { id } = req.params;

const seller = await prisma.user.findFirst({
  where: {
id,
role: "seller",
  },
})

if (!seller) {
  throw new ApiError(404 , "Seller not found");
}
if (seller.isApproved) {
  throw new ApiError(400, "seller is already approved")
}

const approvedSeller = await prisma.user.update({
  where: {id},
  data:{
    isApproved: true,
  },
  select:{
    id:true,
    fullName: true,
    username: true,
    email: true,
    role: true,
    isApproved: true,
  },
})
 return res.status(200).json(
    new ApiResponse(200, approvedSeller, "Seller approved successfully")
  );
})
// approval property 
const approvalProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await prisma.property.findUnique({
    where: { id },
  });
  if (!property) {
    throw new ApiError(404, "Property not found");
  }
  if (property.approvalStatus !== "pending") {
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
  if (property.approvalStatus !== "pending") {
    throw new ApiError(400, "Property is not pending");
  }
  const updateProperty = await prisma.property.update({
    where:{
      id,
    },
    data:{
      approvalStatus: "rejected",
    }
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      updateProperty,
      "Property rejected successfully"
    )
  )
});
export { getPendingProperties, getPendingSellers, getApprovedSeller, approvedSellerbyId, approvalProperty , rejectedProperty};
