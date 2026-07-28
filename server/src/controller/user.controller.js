import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asynHandler";
import { userRegisterValidation } from "../validator/user.validator";
import {ApiResponse} from "../../utils/ApiResponse"
import jwt from "jsonwebtoken"
import { prisma } from "../dp/index.js";
const genrateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await prisma.user.findUnique({where: {id: userId} });
        const accessToken = user.genrateAccessToken(user);
        const resfreshToken = user.genrateRefreshToken(user);

        await prisma.user.update({where: {id : userId}, data: {refreshToken}});
        return {accessToken , refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
//user register 
const registerUser = asyncHandler(async (req , res)=>{
     //get user details from frontend
  //validation-not empty
  //check if user already exists: username, email
  // create user object-create entry in db
  // remove password and refresh token field form response
  // check for user creation
  // return res

  const validationData = {
    ...req.body
  }

  const {error} = userRegisterValidation(validationData);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  const {fullName , username , email , password} = req.body;
  console.log(req.body);
  
  if ([fullName , username , email , password].some((field)=> field?.trim()==="")) {
    throw new ApiError(400 , "All fields are required");
  }
  const existUser = await prisma.user.findFirst({
    where:{ OR:[{email}, {username}]},
  })
  if (existUser) {
      throw new ApiError(409, "User with this email or username already exists");
  }

  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    fullName, 
    username: username.toLowerCase(),
    email,
    password,
  })

  const { password: _, refreshToken , ...createdUser } = user
 if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered succesfully"));
})

//login User 
const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  //username or email
  //find the user
  // password check
  // access and refresh token
  // send cookie

  const { email, password, fullName , username } = req.body;
console.log(req.body);

  if (!email && !username) {
    throw new ApiError(400, "email or username is required!!");
  }
  const user = await prisma.user.findFirst({
    where:{
      
      OR:[{email},{username}]
    }
  })
if (!user) {
    throw new ApiError(400, "user does not exist");
}
const isPasswordValid = await isPasswordCorrect(password , user.password)
if (!isPasswordValid) {
    throw new ApiError(401, "Inavlid User credentials");
}

const { accessToken , refreshToken} = await genrateAccessAndRefreshToken(user._id)
const loggedInUser = await prisma.user.findUnique({
  where:{ id: user.id}
})

const {password:_,  refreshToken: _, ...safeUser}= loggedInUser
const options = {
    httpOnly:true,
    secure:true
}
return res.status(200).cookie("accessToken" , accessToken , options).cookie("refreshToken" , refreshToken , options).json(
  new ApiResponse(
    200, {user: loggedInUser , accessToken , refreshToken},"user logged in sucessFully"
  )
)
});

//logout user 

const logoutUser = asyncHandler(async(req , res)=>{
 await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie('accessToken', options)
  .clearCookie("refreshToken" , options)
  .json(
    new ApiResponse(
      200, {}, "User logged out succesFully"
    )
  )
})

//verfiy token
const refreshAccessToken = asyncHandler(async (req , res)=>{

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(402 , "Unauthoried request")
  } 
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken , 
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await prisma.user.findUnique({ where: { id: decodedToken?._id } });
    if (!user) {
      throw new ApiError(401 , "Inavlid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(402 , "Refresh token is expired or used");      
    }
    const options ={
      httpOnly: true,
      secure: true
    }

    const { accessToken , refreshToken :newRefreshToken } = await genrateAccessAndRefreshToken(user._id)

    return res.status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken" , newRefreshToken , options)
    .json(
      new ApiResponse(
        200,{accessToken , refreshToken: newRefreshToken},
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
})

export {registerUser ,loginUser , logoutUser , refreshAccessToken }