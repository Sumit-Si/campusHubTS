import { ZodSchema } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../config/winston";
import { ApiError } from "../utils/ApiError";

const validate = (schema: ZodSchema) => asyncHandler(async (req,res,next) => {
    const parsedResult = await schema.safeParseAsync(req.body);
    logger.error("parsedResult: ",parsedResult);

    if(!parsedResult.success) {
        const errors = parsedResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));

        throw new ApiError({statusCode: 400, message: "Validation Error", errors});
        
    }

    // store sanitize data after validation
    req.body = parsedResult.data;

    next(); 
});

export {
    validate,
}