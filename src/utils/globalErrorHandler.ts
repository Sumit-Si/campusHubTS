import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import { ApiError } from "./ApiError";
import { logger } from "../config/winston";

const globalErrorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    const isProd = config.NODE_ENV === "production";
    logger.error("Global Error Handler", { error });

    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            status: error.success,
            message: isProd ? "Something went wrong" : error.message,
            data: error.data,
            errors: error.errors ||  [],
            stack: isProd ? "" : error.stack,
        })
    }

    else {
        res.status(500).json({
            status: false,
            message: isProd ? "Something went wrong" : "Internal Server Error",
            data: null,
            errors: [],
            stack: isProd ? "" : (error instanceof Error ? error.stack : ""),
        })
    }

}

export default globalErrorHandler;