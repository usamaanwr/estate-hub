import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

export const hashPassword = async (password)=>{
    return await bcrypt.hash(password , 10);
}

export const isPasswordCorrect = async(inputPassword , hashPassword)=>{
    return await bcrypt.compare(inputPassword , hashPassword);
}

export const generateAccessToken = (user)=>{
    return jwt.sign(
        {
            _id :user.id,
            fullName: user.fullName,
            email: user.email,
            role:user.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    );
}

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { _id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};