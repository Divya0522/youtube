import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
dotenv.config({
  path:"./.env"
})

connectDB()
.then(()=>{
  app.listen(process.env.PORT||8000,()=>{
    console.log("http://localhost:8000");
  })
})
.catch((err)=>{
  console.log("Mongo db connection failed !!!",err);
})










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