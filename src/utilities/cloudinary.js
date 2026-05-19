import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import path from "path";

let isCloudinaryConfigured = false;

const configureCloudinary = () => {
  if (isCloudinaryConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  isCloudinaryConfigured = true;
};

const uploadOnCloudinary=async(localFilePath)=>{
  try{
    configureCloudinary();
    if(!localFilePath) return null;
    const absoluteFilePath = path.resolve(localFilePath);
    const response=await cloudinary.uploader.upload(absoluteFilePath,{
      resource_type: "auto"
    });
    // file has been uploaded succesfull
    console.log("file is uploaded on cloudinary ", response.secure_url || response.url || response);
    // remove local temp file if exists
    try{
      if (absoluteFilePath && fs.existsSync(absoluteFilePath)) fs.unlinkSync(absoluteFilePath);
    }catch(e){}
    return response;
  }catch(error){
    console.error("Cloudinary upload failed:", error?.message || error);
    const absoluteFilePath = localFilePath ? path.resolve(localFilePath) : null;
    try{
      if (absoluteFilePath && fs.existsSync(absoluteFilePath)) fs.unlinkSync(absoluteFilePath);
    }catch(e){}
    //remove the locally saved temporory file as the upload operation got failed
    return null;
  }
}

export {uploadOnCloudinary};