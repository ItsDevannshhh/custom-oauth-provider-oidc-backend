import "dotenv/config";
import mongoose from "mongoose";

async function connectDB(){
    try{
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("DB connected succesfully");
    } catch(err){
        console.log("error", err);
    }
}

export default connectDB;