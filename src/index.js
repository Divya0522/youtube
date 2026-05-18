import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path:"./.env"
})

connectDB();










/*
const app=express();

(async()=>{
  try{
    await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
    app.on("error",(e)=>{
      console.log("Error: ",e);
      throw e;
    });

    app.listen(process.env.PORT,()=>{
      console.log("http://localhost:8000")
    })
  }catch(error){
    console.error("Error: ",error);
  }
})()
  */