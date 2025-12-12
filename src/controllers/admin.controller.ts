import User from "../models/user.model";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { GetRequestPayloads } from "../types/common.types";
import { UserRole } from "../constants";
import { ApiError } from "../utils/ApiError";


const getAllUsers = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, sortBy = "createdAt", order = "asc" } = req.query as GetRequestPayloads;

    if (page <= 1 || (limit <= 1 && limit >= 50)) {
        page = 1;
        limit = 10;
    }

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    const users = await User.find()
        .select("-password -refreshToken")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json(new ApiResponse({
        statusCode: 200,
        message: "Users fetched successfully",
        data: {
            users,
            metadata: {
                totalPages,
                currentPage: page,
                currentLimit: limit,
            }
        },
    }));
});

const updateUserRoleById = asyncHandler(async (req, res) => {
    const { role } = req.body as { role: UserRole };
    const { id } = req.params;

    const existingUser = await User.findById(id)
        .select("-password -refreshToken");

    if (!existingUser) {
        throw new ApiError({
            statusCode: 404,
            message: "User not exists",
        });
    }

    const updateUser = await User.findByIdAndUpdate(id, {
        role
    }, {new: true});

    if(!updateUser) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while updating user's role",
        })
    }
});


export {
    getAllUsers,
    updateUserRoleById,
}