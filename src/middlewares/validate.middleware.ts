import { ZodSchema, z } from "zod";
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

export const validateParams = <S extends ZodSchema>(schema: S) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const validationResult = await schema.safeParseAsync(req.params);

        if (validationResult.success) {
            // Narrow req.params to the validated shape for downstream handlers
            const data = validationResult.data as z.infer<S>;
            (req as Request & { params: Request["params"] }).params = data as unknown as Request["params"];
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