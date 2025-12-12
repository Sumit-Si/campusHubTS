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
        res.status(error.statusCode).json({
            status: error.success,
            message: isProd ? "Something went wrong" : error.message,
            data: error.data,
            errors: error instanceof Error ? [{ name: error.name, message: isProd ? "Something went wrong" : error.message }] : [],
            stack: isProd ? "" : error.stack,
        })
    }

    else {
        res.status(500).json({
            status: false,
            message: isProd ? "Something went wrong" : "Internal Server Error",
            data: null,
            errors: error instanceof Error ? [{ name: error.name, message: isProd ? "Something went wrong" : error.message }] : [],
            stack: isProd ? "" : (error instanceof Error ? error.stack : ""),
        })
    }

}

export default globalErrorHandler;