import {asyncHandler} from "../utilities/asyncHandler.js";
import {ApiError} from "../utilities/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/ApiResponse.js";

const registerUser=asyncHandler(async(req,res)=>{
    const {username,email,fullname,password}=req.body;
    console.log("Email: ",email);

    if(
      [fullname,email,username,password.some((field)=>field?.trim()==="")]
    ){
      throw new ApiError(400,"All fields are required")
    }

   const existedUser=User.findOne({
    $or:[{email},{username}]
   });

   if(existedUser){
    throw new ApiError(409,"User with username or email already exist")
   }

  const avatarLocalPath= req.files?.avatar[0]?.path;
  const coverImageLocalPath= req.files?.coverImage[0]?.path;

  if(!avatarLocalPath) throw new ApiError(400,"Avatar file is required");
   const avatar=await uploadOnCloudinary(avatarLocalPath);
   const coverImage=await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar) throw new ApiError(400,"Avatar file is required");

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


export {registerUser};