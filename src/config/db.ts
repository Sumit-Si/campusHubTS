import mongoose from "mongoose";
import config from "../config/config";
import { DB_NAME } from "../constants";

const dbConnect = async () => {
    try {
        const connInstance = await mongoose.connect(`${config.MONGO_URI}/${DB_NAME}?authSource=admin`);
        console.log("conn string",connInstance.connection.host);
        
    } catch (error) {
        console.error("Connection ERROR: ", error);
        process.exit(1);
    }
}

export default dbConnect;