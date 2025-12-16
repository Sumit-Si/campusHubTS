import Enrollment from "../models/enrollment.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { EnrollmentSchemaProps, GetRequestPayloads } from "../types/common.types";
import { EnrollmentStatus, UserRole, UserRolesEnum } from "../constants";
import Course from "../models/course.model";
import { QueryFilter } from "mongoose";

type CreateEnrollmentRequestBody = {
    courseId: string;
    role?: UserRole;
    remarks?: string;
}

const createEnrollment = asyncHandler(async (req, res) => {
    const { courseId, role, remarks } = req.body as CreateEnrollmentRequestBody;
    const userId = req.user?._id;

    const existingCourse = await Course.findOne({ _id: courseId, deletedAt: null })
        .select("title _id");

    if (!existingCourse) {
        throw new ApiError({
            statusCode: 404,
            message: "Course not exists",
        })
    }

    const existingEnrollment = await Enrollment.findOne({
        user: userId,
        course: courseId,
        deletedAt: null,
    }).select("_id role");

    if (existingEnrollment) {
        throw new ApiError({
            statusCode: 400,
            message: `Already enrolled in this ${existingCourse.title} course`,
        });
    }

    const enrollment = await Enrollment.create({
        user: userId,
        course: courseId,
        role,
        remarks,
    });

    const createdEnrollment = await Enrollment.findById(enrollment._id)
        .populate("user", "username fullName image")
        .populate("course", "title price");

    if (!createdEnrollment) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while creating enrollment",
        });
    }

    res.status(201)
        .json(new ApiResponse({
            statusCode: 201,
            message: "Enrollment created successfully",
            data: createdEnrollment,
        }));
});

const getAllEnrollments = asyncHandler(async (req, res) => {
    const {
        page: rawPage = "1",
        limit: rawLimit = "10",
        order = "asc",
        sortBy = "createdAt",
        createdBy,
        courseId,
    } = req.query as unknown as GetRequestPayloads & { courseId?: string };

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;
    const sortOrder = order === "desc" ? -1 : 1;
    const filters: QueryFilter<EnrollmentSchemaProps> = { deletedAt: null };

    if (req.user?.role === UserRolesEnum.FACULTY) {
        if (!courseId || typeof courseId !== "string") {
            throw new ApiError({ statusCode: 400, message: "courseId is required for faculty" });
        }
        filters.course = courseId;
    } else {
        if (createdBy && typeof createdBy === "string") filters.user = createdBy;
        if (courseId && typeof courseId === "string") filters.course = courseId;
    }

    const enrollments = await Enrollment.find(filters)
        .populate("user", "username fullName image")
        .populate("course", "name price")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

    const totalEnrollments = await Enrollment.countDocuments(filters);
    const totalPages = Math.ceil(totalEnrollments / limit);

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Enrollments fetched successfully",
            data: {
                enrollments,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                }
            },
        }));
});

const getEnrollmentById = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const enrollment = await Enrollment.findOne({
        _id: id,
        deletedAt: null,
    })
        .populate("user", "username fullName avatar")
        .populate("course", "title priceInPaise creator");

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Enrollment fetched successfully",
            data: enrollment,
        }));
});

const updateEnrollmentById = asyncHandler(async (req, res) => {
    const { status, remarks } = req.body as { status?: EnrollmentStatus, remarks?: string };

    const { id } = req.params as { id: string };

    const enrollment = await Enrollment.findOne({
        _id: id,
        deletedAt: null,
    }).select("_id status role");

    if (!enrollment) {
        throw new ApiError({
            statusCode: 404,
            message: "Enrollment not exists",
        });
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(id, {
        status,
        remarks,
    }, { new: true })
        .populate("user", "username fullName avatar")
        .populate("course", "title priceInPaise creator");

    if (!updatedEnrollment) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while updating enrollment",
        });
    }

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Enrollment updated successfully",
            data: updatedEnrollment,
        }));
});

const deleteEnrollmentById = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const enrollment = await Enrollment.findOne({
        _id: id,
        deletedAt: null,
    }).select("_id status role");

    if (!enrollment) {
        throw new ApiError({
            statusCode: 404,
            message: "Enrollment not exists",
        });
    }

    const deletedEnrollment = await Enrollment.findByIdAndUpdate(id, {
        deletedAt: new Date(),
    })
        .populate("user", "username fullName avatar")
        .populate("course", "title priceInPaise creator");

    if (!deletedEnrollment) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while deleting enrollment",
        });
    }

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Enrollment deleted successfully",
            data: deletedEnrollment,
        }));
});

export {
    createEnrollment,
    getAllEnrollments,
    getEnrollmentById,
    updateEnrollmentById,
    deleteEnrollmentById,
}