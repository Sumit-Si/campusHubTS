import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import { ApiError } from "./ApiError";
import { logger } from "../config/winston";

const globalErrorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    const isProd = config.NODE_ENV === "production";
    logger.error("Global Error Handler", { error });

    // error.name returns the name of the error's constructor as a string (e.g., "Error", "TypeError").
    // For more detailed info, you might want to include error.message or error itself.

    if (error instanceof ApiError) {
        // If ApiError has field-specific errors (from validation), use them
        // Otherwise, create a generic error object
        const errors = error.errors && error.errors.length > 0
            ? error.errors.map(err => {
                const errorObj: { field?: string; message: string } = {
                    message: isProd && error.statusCode >= 500
                        ? "Something went wrong"
                        : err.message,
                };
                if (err.field) {
                    errorObj.field = err.field;
                }
                return errorObj;
            })
            : [{
                name: error.name,
                message: isProd && error.statusCode >= 500
                    ? "Something went wrong"
                    : error.message,
            }];

        res.status(error.statusCode).json({
            status: error.success,
            message: isProd && error.statusCode >= 500
                ? "Something went wrong"
                : error.message,
            data: error.data,
            errors: errors,
            stack: isProd ? undefined : error.stack,
        });
        return;
    }

    // Handle non-ApiError errors
    res.status(500).json({
        status: false,
        message: isProd ? "Something went wrong" : "Internal Server Error",
        data: null,
        errors: error instanceof Error
            ? [{
                name: error.name,
                message: isProd ? "Something went wrong" : error.message
            }]
            : [],
        stack: isProd ? undefined : (error instanceof Error ? error.stack : undefined),
    });
}

export default globalErrorHandler;