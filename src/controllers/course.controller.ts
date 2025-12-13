import Course from "../models/course.model";
import { QueryFilter } from "mongoose";
import { CourseSchemaProps, GetRequestPayloads } from "../types/common.types";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

type CreateCourseRequestBodyParams = {
    title: string,
    content?: string,
    priceInPaise: number
}

const createCourse = asyncHandler(async (req, res) => {
    const { title, content, priceInPaise } = req.body as CreateCourseRequestBodyParams;

    const existingCourse = await Course.findOne({
        title,
        creator: req.user?._id,
        deletedAt: null,
    });

    if (existingCourse) {
        throw new ApiError({
            statusCode: 400,
            message: "Course already exists",
        })
    }

    const course = await Course.create({
        title,
        content,
        priceInPaise,
        creator: req.user?._id,
    });

    const createdCourse = await Course.findById(course._id)
        .populate("creator", "username fullName avatar");

    if (!createdCourse) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while creating course",
        })
    }

    res.status(201)
        .json(new ApiResponse({
            statusCode: 201,
            message: "Course created successfully",
            data: createdCourse,
        }));
});

const getAllCourses = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, search, order = "asc", sortBy = "createdAt", createdBy } = req.params as GetRequestPayloads;

    if (page <= 1 || (limit <= 1 && limit >= 50)) {
        page = 1;
        limit = 10;
    }

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    const filters: QueryFilter<CourseSchemaProps> = {};

    if (search && typeof search === "string") filters.title = { $regex: search, $options: "i" };
    if (createdBy && typeof createdBy === "string") filters.creator = createdBy;
    filters.deletedAt = null;


    const courses = await Course.find(filters)
        .populate("creator", "username fullName avatar")
        .populate("materials", "")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

    const totalCourses = await Course.countDocuments(filters);
    const totalPages = Math.ceil(totalCourses / limit);

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Courses fetched successfully",
            data: {
                courses,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                }
            }
        }))
});

const createMaterialByCourseId = asyncHandler(async (req,res) => {

})



export {
    createCourse,
    getAllCourses,
    createMaterialByCourseId,
}