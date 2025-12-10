import { asyncHandler } from "../utils/asyncHandler";
import type { CookieOptions, UserLoginAction, UserRequestAction } from "../types/auth.types";
import User from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { logger } from "../config/winston";
import { generateAccessAndRefreshToken } from "../utils/token";
import config from "../config/config";
import ApiKey from "../models/apiKey.model";
import crypto from "crypto";

const register = asyncHandler(async (req, res) => {

    const { username, email, password, role, fullName } = req.body as UserRequestAction;

    const existingUser = await User.findOne({
        email,
    });

    if (existingUser) {
        throw new ApiError({ statusCode: 400, message: "User already exists" });
    }

    const user = await User.create({
        username,
        email,
        fullName,
        password,
        role,
        avatar: "",
    });

    if (!user) {
        throw new ApiError({ statusCode: 500, message: "Problem while creating user" });
    }

    const createdUser = await User.findById(user._id)
        .select("-refreshToken");

    logger.info("Created user: ", createdUser);

    if (!createdUser) {
        throw new ApiError({ statusCode: 500, message: "Problem while creating user" });
    }

    res.status(201).json(new ApiResponse({
        statusCode: 201,
        data: createdUser,
        message: "User created successfully",
    }));

});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body as UserLoginAction;

    const user = await User.findOne({
        email,
    });

    if (!user) {
        throw new ApiError({ statusCode: 400, message: "Invalid credientails" });
    }

    const isMatch = await user.isPasswordCorrect(password);
    logger.warn("isMatch: ", isMatch);
    console.log("isMatch: ", isMatch);
    if (!isMatch) {
        throw new ApiError({ statusCode: 400, message: "Invalid credientails" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");


    const options: CookieOptions = {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
    }

    res.status(200)
        .cookie("accessToken", accessToken, { ...options, maxAge: config.ACCESS_TOKEN_MAX_AGE })
        .cookie("refreshToken", refreshToken, { ...options, maxAge: config.REFRESH_TOKEN_MAX_AGE })
        .json(new ApiResponse({
            statusCode: 200,
            data: { loggedInUser, accessToken, refreshToken },
            message: "User logged in successfully",
        }));
});

const logout = asyncHandler(async (req, res) => {
    const options: CookieOptions = {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
    }

    res.cookie("accessToken", "", options);
    res.cookie("refreshToken", "", options);

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Logged out successfully",
            data: null,
        }));
});

const generateApiKey = asyncHandler(async (req, res) => {
    const { expiresAt, description } = req.body as { expiresAt?: Date, description?: string };
    const user = req.user;

    const existingKey = await ApiKey.findOne({
        createdBy: user?._id,
    });

    if (existingKey) {
        throw new ApiError({ statusCode: 400, message: "Api key already exists" });
    }

    const key = crypto.randomBytes(32).toString("hex");

    const apiKey = await ApiKey.create({
        key,
        expiresAt,
        createdBy: user?._id,
        description,
    });

    const createdApiKey = await ApiKey.findById(apiKey?._id)
        .select("-expiresAt")
        .populate("createdBy", "username fullName avatar");

    if (!createdApiKey) {
        throw new ApiError({ statusCode: 500, message: "Problem while generating api key" });
    }

    res.status(201)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Api key generated successfully",
            data: createdApiKey,
        }));
});

const profile = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse({
        statusCode: 200,
        message: "Profile fetched successfully",
        data: req.user,
    }))
});

const refreshAccessToken = asyncHandler(async (req,res) => {
    //TODO
})


export {
    register,
    login,
    logout,
    generateApiKey,
    profile,
    refreshAccessToken,
}