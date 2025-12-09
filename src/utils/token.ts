import { Types } from "mongoose";
import { logger } from "../config/winston";
import User from "../models/user.model";
import { ApiError } from "./ApiError";

const generateAccessAndRefreshToken = async (userId: Types.ObjectId | string) => {
    const user = await User.findById(userId).select("-password");

    if (!user) {
        throw new ApiError({ statusCode: 404, message: "User not exists" });
    }

    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        logger.info("access token generated");
        logger.info("refresh token generated");

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        logger.error("Failed generating tokens", { error });
        throw error instanceof ApiError
            ? error
            : new ApiError({ statusCode: 500, message: "Problem while generating refresh and access tokens" });
    }
}

export {
    generateAccessAndRefreshToken,
}