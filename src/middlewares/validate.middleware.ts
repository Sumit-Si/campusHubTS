import { ZodSchema } from "zod";
import { ApiError, ErrorDetail } from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";

export const validate = (schema: ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction) => {

        const validationResult = await schema.safeParseAsync(req.body);

        if (validationResult.success) {
            req.body = validationResult.data;
            return next();
        }

        const extractedErrors: ErrorDetail[] = validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));

        throw new ApiError({
            statusCode: 422,
            message: "Validation Error",
            errors: extractedErrors,
        });
    };
