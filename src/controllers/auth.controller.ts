import { asyncHandler } from "../utils/asyncHandler";
import type { UserRequestAction } from "../types/auth.types";

const register = asyncHandler(async (req, res) => {
    res.json(req.body);
    console.log("Registed successfully");

    const { username, email, password, role, fullName } = req.body as UserRequestAction;
    
});

const login = asyncHandler(async (req, res) => {
    console.log("Logged in successfully");

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