import Course from "../models/course.model";
import { QueryFilter } from "mongoose";
import { CourseSchemaProps, GetRequestPayloads, MaterialFileUpload, MaterialSchemaProps } from "../types/common.types";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { MaterialType } from "../constants";
import Material from "../models/material.model";
import { uploadOnCloudinary } from "../config/cloudinary";

type CreateCourseRequestBody = {
    title: string,
    content?: string,
    priceInPaise: number
}

type CreateMaterialRequestBody = {
    name: string,
    description?: string,
    type: MaterialType,
    content?: string,
    tags?: string[],
    order: number,
    duration?: number
}

const createCourse = asyncHandler(async (req, res) => {
    const { title, content, priceInPaise } = req.body as CreateCourseRequestBody;

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
        .populate("materials", "name published")
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

const createMaterialByCourseId = asyncHandler(async (req, res) => {
    const { name, description, type, content, tags, order, duration } = req.body as CreateMaterialRequestBody;

    const { id } = req.params as { id: string };

    const course = await Course.findById(id)
        .select("_id title creator");

    if (!course) {
        throw new ApiError({
            statusCode: 404,
            message: "Course not exists",
        })
    }

    const existingMaterial = await Material.findOne({
        name,
        course: course._id,
        deletedAt: null,
    }).select("_id name");

    if (existingMaterial) {
        throw new ApiError({
            statusCode: 400,
            message: "Material already exists",
        })
    }

    const files = req.files as Express.Multer.File[] | undefined;

    // File upload
    let uploadResults = [];
    try {
        if (files && files.length > 0) {
            uploadResults = await Promise.all(
                files.map((file) => uploadOnCloudinary(file.path)),
            );
        } else {
            throw new ApiError({ statusCode: 400, message: "No files uploaded" });
        }

    } catch (error) {
        throw new ApiError({ statusCode: 400, message: "Failed to upload files" });
    }

    const results = uploadResults.map((file) => ({
        fileUrl: file?.url,
        fileType: file?.resource_type,
        size: file?.bytes,
        publicId: file?.public_id
    } as MaterialFileUpload));

    const material = await Material.create({
        name,
        description,
        type,
        content,
        uploadFiles: results,
        tags: typeof tags === "string" ? JSON.parse(tags) : tags,
        order,
        duration,
        creator: course.creator,
        course: course._id,
    });

    const createdMaterial = await Material.findById(material._id)
        .populate("creator", "username fullName avatar")
        .populate("course", "title");

    if (!createdMaterial) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while creating course material",
        });
    }

    await Course.findByIdAndUpdate(
        course._id,
        {
            $push: { materials: material._id },
        },
        { new: true },
    );

    res.status(201)
        .json(new ApiResponse({
            statusCode: 201,
            message: "Material created successfully",
            data: createdMaterial,
        }));
});

const getMaterialsByCourseId = asyncHandler(async (req, res) => {
    let { id, page = 1, limit = 10, search, order = "asc", sortBy = "createdAt", createdBy } = req.params as GetRequestPayloads;

    if (page <= 1 || (limit <= 1 && limit >= 50)) {
        page = 1;
        limit = 10;
    }

    const skip = (page - 1) * limit;

    const course = await Course.findById(id)
        .select("_id title");

    if (!course) {
        throw new ApiError({
            statusCode: 404,
            message: "Course not exists",
        })
    }

    const sortOrder = order === "desc" ? -1 : 1;

    const filters: QueryFilter<MaterialSchemaProps> = {};

    if (search && typeof search === "string") filters.name = { $regex: search, $options: "i" };
    if (createdBy && typeof createdBy === "string") filters.creator = createdBy;
    filters.deletedAt = null;

    const materials = await Material.find(filters)
        .populate("creator", "username fullName avatar")
        .populate("course", "title")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

    const totalMaterials = await Material.countDocuments(filters);
    const totalPages = Math.ceil(totalMaterials / limit);

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Materials fetched successfully",
            data: {
                materials,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                }
            }
        }))
});



export {
    createCourse,
    getAllCourses,
    createMaterialByCourseId,
    getMaterialsByCourseId,
}