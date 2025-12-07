import { Request, Response } from "express"
import { ApiResponse } from "../utils/ApiResponse"

const healthCheck = async (req: Request, res: Response) => {
    res
        .status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "All OK!",
            data: null,
        }));
}

export {
    healthCheck,
}