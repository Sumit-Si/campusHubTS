import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import { ApiError } from "./ApiError";

const globalErrorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    const isProd = config.NODE_ENV === "production";

    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            status: error.success,
            message: isProd ? "Something went wrong" : error.message,
            data: error.data,
            errors: error.errors ||  [],
            stack: isProd ? "" : error.stack,
        })
    }

}

export default globalErrorHandler;