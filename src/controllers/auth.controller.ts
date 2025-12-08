import { asyncHandler } from "../utils/asyncHandler";
import type { UserLoginAction, UserRequestAction } from "../types/auth.types";
import User from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { logger } from "../config/winston";

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
        .select("-refreshToken -password");

    logger.info("Created user: ",createdUser);

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
    const {email, password} = req.body as UserLoginAction;
    console.log("req login: ",email,password);
    
    const user = await User.findOne({
        email,
    });
    console.log("user: ",user);
    

    if(!user) {
        throw new ApiError({statusCode: 400, message: "Invalid credientails"});
    }

    const isMatch = await user.isPasswordCorrect(password);
    logger.warn("isMatch: ",isMatch);
    console.log("isMatch: ",isMatch);
    if(!isMatch) {
        throw new ApiError({statusCode: 400, message: "Invalid credientails"});
    }

    
    

});

const logout = asyncHandler(async (req, res) => {

});

const generateApiKey = asyncHandler(async (req, res) => {

});

const profile = asyncHandler(async (req, res) => {

});


export {
    register,
    login,
    logout,
    generateApiKey,
    profile,
}