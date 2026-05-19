import multer from "multer";
import path from "path";

const storage=multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,"public/temp")
  },
  filename:(req,file,cb)=>{
    const fileExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExt).replace(/\s+/g, "-");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${baseName}-${uniqueSuffix}${fileExt}`)
  }
})

export const upload=multer({storage});