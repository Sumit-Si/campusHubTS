import { Request, Response } from "express"

const healthCheck = async (req: Request, res: Response) => {
    res
        .status(200)
        .json({
            status: true,
            message: "All OK!",
        })

}

export {
    healthCheck,
}