import { asyncHandler } from "../utils/asyncHandler";

const register = asyncHandler(async (req,res) => {
    console.log("Registed successfully");
});

const login = asyncHandler(async (req,res) => {
    console.log("Logged in successfully");
    
})


export {
    register,
    login,
}