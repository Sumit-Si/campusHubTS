import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const jwtVerify = asyncHandler(async (req,res,next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if(!token) {
            throw new ApiError({statusCode: 401, message:"Unauthorized!"});
        }
    } catch (error) {
        throw error;
    }
});


export {
    jwtVerify,
}