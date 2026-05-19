import {asyncHandler} from "../utilities/asyncHandler.js";
import {ApiError} from "../utilities/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens=async(userId)=>{
  try{
    const user=await User.findById(userId);
    const accessToken=await user.generateAccessToken();
    const refreshToken=await user.generateRefreshToken();
    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false});

    return {accessToken,refreshToken};
  }catch(error){
    throw new ApiError(500,"Something went wrong while creating access and refresh token")
  }
}


const registerUser=asyncHandler(async(req,res)=>{
    const {username,email,fullname,password}=req.body;
    console.log(req.files);

    if ([fullname, email, username, password].some(field => field == null || String(field).trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

   const existedUser=await User.findOne({
    $or:[{email},{username}]
   });

   if(existedUser){
    throw new ApiError(409,"User with username or email already exist")
   }

  const avatarLocalPath= req.files?.avatar?.[0]?.path;
  const coverImageLocalPath= req.files?.coverImage?.[0]?.path;

  if(!avatarLocalPath) throw new ApiError(400,"Avatar file is required");
   const avatar=await uploadOnCloudinary(avatarLocalPath);

   if(!avatar) throw new ApiError(400,"Avatar upload failed. Please verify Cloudinary cloud name, api key, and api secret.");

   const coverImage=await uploadOnCloudinary(coverImageLocalPath);

 const user= await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   });

   const createdUser=await User.findById(user._id).select("-password -refreshToken")
   if(!createdUser)
     throw new ApiError(500,"Something went wrong while registering user");

   return res.status(201).json(
    new ApiResponse(200,"User Registerd succesfully")
   )
});

const loginUser=asyncHandler(async(req,res)=>{
  const {email,username,password}=req.body;
  if(!(username || email))
    throw new ApiError(400,"username or email is required");
 const user=await User.findOne({$or:[{email},{username}]});
 if(!user) throw new ApiError(404,"User doesnot exist");

 const isValid=await user.isPasswordCorrect(password);
 if(!isValid)
  throw new ApiError(401,"Invalid user password");

 const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

 const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

 const options={
  httpOnly:true,
  secure:true,
 }

 return res
 .status(200)
 .cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
  new ApiResponse(
    200,
    {
      user:loggedInUser,accessToken,
      refreshToken
    },
    "User logged in successfully"
  )
 )

});

const logoutUser=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },{
      new:true
    }
  )
  const options={
    httpOnly:true,
    secure:true
  }
  return res.status(200).clearCookie("accessToken",options).
  clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User logged Out sucessfully"))
});


const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken)
    throw new ApiError(401,"unauthorized request");
  try {
    const decodedToken=jwt.verify(incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user=await User.findById(decodedToken?._id);
    if(!user){
      throw new ApiError(401,"Invalid refresh token");
    }
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used")
    }
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id);
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,refreshToken:newRefreshToken
        },
        "Access token refreshed"
      )
    )
  
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})


const changeCurrentPassowrd=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
 const user=await User.findById(req.user?.id)
 const isPasswordCorrect=
 await user.isPasswordCorrect(oldPassword);

 if(!isPasswordCorrect) throw new ApiError(401,"Invalid Old Password")
  user.password=newPassword
  await user.save({validateBeforeSave:false})

  return res.status(200)
  .json(new ApiResponse(200,{},"New password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res
  .status(200).
  json(200,req.user,"current User fetched successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullname,email}=req.body;

  if(!fullname || !email)
    throw new ApiError(400,"All fields are required")

 const user=await  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname,
        email
      }
    },{
      new:true
    }
  ).select("-password")

  return res.status(200).json(
    new ApiResponse(200,user,"Account details Updated Successfully")
  )

})

const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path
  if(!avatarLocalPath)
    throw new ApiError(400,"Avatar file is missing")

  const avatar=await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url)
    throw new ApiError(400,"Error while uploading on avatar")
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      avatar:avatar.url
    },
    {
      new:true
    }
  ).select("-password")
  return res.status(200).json(
    new ApiResponse(200,user,"Updated user avatar successfully")
  )
})
const updateCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path
  if(!coverImageLocalPath)
    throw new ApiError(400,"CoverImage file is missing")

  const coverImage=await uploadOnCloudinary(coverImageLocalPath);

  if(!coverImage.url)
    throw new ApiError(400,"Error while uploading on coverImage")
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      coverImage:coverImage.url
    },
    {
      new:true
    }
  ).select("-password")
   return res.status(200).json(
    new ApiResponse(200,user,"Updated user cover successfully")
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassowrd,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage
};