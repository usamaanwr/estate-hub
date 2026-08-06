import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asynHandler.js";
import { userRegisterValidation } from "../validator/user.validator.js";
import {ApiResponse} from "../../utils/ApiResponse.js"
import { hashPassword , isPasswordCorrect , generateAccessToken , generateRefreshToken } from "../../utils/auth.utils.js";
import jwt from "jsonwebtoken"
import { prisma } from "../dp/index.js";
import { sendOTPEmail } from "../services/email.services.js";
const genrateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await prisma.user.findUnique({where: {id: userId} });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await prisma.user.update({
        where: {id : userId}, 
        data: {refreshToken}});
        return {accessToken , refreshToken};
    } catch (error)
   { console.log(error);
   
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
      data: {
    fullName,
    username: username.toLowerCase(),
    email,
    password: hashedPassword,
  },
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

const { accessToken , refreshToken} = await genrateAccessAndRefreshToken(user.id)
const loggedInUser = await prisma.user.findUnique({
  where:{ id: user.id}
})

const {password:_,  refreshToken: __, ...safeUser}= loggedInUser
const options = {
    httpOnly:true,
    secure:true
}
return res.status(200)
.cookie("accessToken" , accessToken , options)
.cookie("refreshToken" , refreshToken , options)
.json(
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
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(402, "Unauthoried request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decodedToken?._id } });

    if (!user) {
      throw new ApiError(401, "Inavlid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(402, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } = await genrateAccessAndRefreshToken(user.id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed")
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

//forgot password 

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ---------------- FORGOT PASSWORD ----------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 60 * 1000); // 60 seconds

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetOTP: otp,
      resetOTPExpiry: otpExpiry,
    },
  });

  await sendOTPEmail(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent to your email successfully"));
});
  // resend opt 
  const resendOtp = asyncHandler(async (req , res)=>{
    const { email } = req.body

    if (!email) {
      throw new ApiError(400 , "Email is required");
    }

    const user = await prisma.user.findFirst({where:{email}});

    if (!user) {
      throw new ApiError(404 ,"User with this email does not exist")
    }
    const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 60 * 1000);
   await prisma.user.update({
    where: { id: user.id },
    data: {
      resetOTP: otp,
      resetOTPExpiry: otpExpiry,
    },
  });

  await sendOTPEmail(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "New OTP sent to your email"));
  })


  // reset password 

  const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP and new password are required");
  }

  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.resetOTP !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (new Date() > new Date(user.resetOTPExpiry)) {
    throw new ApiError(400, "OTP has expired, please request a new one");
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetOTP: null,
      resetOTPExpiry: null,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});
export {registerUser ,loginUser , logoutUser , refreshAccessToken , forgotPassword , resendOtp , resetPassword }