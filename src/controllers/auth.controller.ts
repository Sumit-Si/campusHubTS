import { asyncHandler } from "../utils/asyncHandler";

const register = asyncHandler(async (req,res) => {
    console.log("Registed successfully");
});


export {
    register,
}