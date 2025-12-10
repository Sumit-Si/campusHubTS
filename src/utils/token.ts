import { Types } from "mongoose";
import { logger } from "../config/winston";
import User from "../models/user.model";
import { ApiError } from "./ApiError";

const generateAccessAndRefreshToken = async (userId: Types.ObjectId | string) => {
    const user = await User.findById(userId).select("-password");

    if (!user) {
        throw new ApiError({ statusCode: 404, message: "User not exists" });
    }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        
        console.log(accessToken,refreshToken,"access and refresh");
        
        return { accessToken, refreshToken };
        // return { accessToken, refreshToken };
        // logger.error("Failed generating tokens", { error });
        // throw new ApiError({ statusCode: 500, message: "Problem while generating refresh and access tokens" });
}

export {
    generateAccessAndRefreshToken,
}