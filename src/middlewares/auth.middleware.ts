import config from "../config/config";
import { AvailableUserRoles } from "../constants";
import User from "../models/user.model";
import { UserDocument } from "../types/common.types";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";

export interface DecodedJWTPayload extends JwtPayload {
    _id: string;
    iat: number;
    exp: number;
}

const jwtVerify = asyncHandler(async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        console.log("token: ", token);
        
        if (!token) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized!" });
        }

        const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as DecodedJWTPayload;
        console.log("decoded: ", decoded);

        const user = await User.findById(decoded._id)
            .select("-password -refreshToken");
        
        if(!user) {
            throw new ApiError({statusCode: 401, message: "Unauthorized!"});
        }

        req.user = user;

        next();
    } catch (error) {
        if(error instanceof TokenExpiredError) {
            throw new ApiError({statusCode: 401, message: "Access token expired, request a new one with refresh token"});
        }

        if(error instanceof JsonWebTokenError) {
            throw new ApiError({statusCode: 401, message: "Invalid access token"});
        }
        
        next(error);
    }
});

const checkRole = (roles: typeof AvailableUserRoles) => asyncHandler(async (req,res,next) => {

    const user = req.user as UserDocument;

    if(!roles.includes(user.role)) {
        throw new ApiError({statusCode: 403, message: `Forbidden!, user must be one of them ${roles.join(",")}`});
    }
    console.log("user role: ", user.role);
    console.log("roles: ", roles);
    next();
});


export {
    jwtVerify,
    checkRole,
}