import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import Assessment, { AssessmentSchemaProps } from "../models/assessment.model";
import Course from "../models/course.model";
import { GetRequestPayloads } from "../types/common.types";
import { deleteFromCloudinary, uploadOnCloudinary } from "../config/cloudinary";
import { QueryFilter, Types } from "mongoose";

type CreateAssessmentRequestBody = {
    title: string;
    description?: string;
    dueDate: Date;
    courseId: string;
    maxMarks: number;
    type?: "quiz" | "assignment" | "exam";
};

const createAssessment = asyncHandler(async (req, res) => {
    const { title, description, dueDate, courseId, maxMarks, type } = req.body as CreateAssessmentRequestBody;

    const userId = req.user?._id;

    const course = await Course.findOne({
        _id: courseId,
        deletedAt: null,
    }).select("_id title creator");

    if (!course) {
        throw new ApiError({
            statusCode: 404,
            message: "Course not exists",
        });
    }

    if (req.user?.role !== "admin" && course.creator.toString() !== userId?.toString()) {
        throw new ApiError({
            statusCode: 403,
            message: "Forbidden: You can only create assessments for your own courses",
        });
    }

    const existingAssessment = await Assessment.findOne({
        title,
        course: courseId,
        dueDate,
        deletedAt: null,
    }).select("_id title dueDate");

    if (existingAssessment) {
        throw new ApiError({
            statusCode: 400,
            message: "Assessment with same title and dueDate already exists for this course",
        });
    }

    // Handle file uploads - only after all validations pass
    const assessmentLocalFiles = req.files as Express.Multer.File[] | undefined;
    const uploadedFiles: Array<{ url: string; public_id: string }> = [];

    if (assessmentLocalFiles && assessmentLocalFiles.length > 0) {
        try {
            // Filter out files without paths
            const validFiles = assessmentLocalFiles.filter((file) => file?.path);

            if (validFiles.length > 0) {
                const uploadResults = await Promise.all(
                    validFiles.map((file) => uploadOnCloudinary(file.path))
                );

                // Filter out null results and validate uploads
                for (const result of uploadResults) {
                    if (result && result.url && result.public_id) {
                        uploadedFiles.push({
                            url: result.url,
                            public_id: result.public_id,
                        });
                    } else {
                        // If any upload fails, clean up successfully uploaded files
                        if (uploadedFiles.length > 0) {
                            await Promise.all(
                                uploadedFiles.map((file) => deleteFromCloudinary(file.public_id))
                            );
                        }
                        throw new ApiError({
                            statusCode: 400,
                            message: "Failed to upload one or more files",
                        });
                    }
                }
            }
        } catch (error) {
            // Clean up any successfully uploaded files before throwing error
            if (uploadedFiles.length > 0) {
                await Promise.all(
                    uploadedFiles.map((file) => deleteFromCloudinary(file.public_id))
                );
            }

            // Re-throw ApiError as-is, wrap others
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError({
                statusCode: 400,
                message: "Failed to upload files",
            });
        }
    }

    // Create assessment
    try {
        const assessment = await Assessment.create({
            title,
            description,
            dueDate,
            course: courseId,
            creator: userId,
            maxMarks,
            type: type || "quiz",
            assessmentFiles: uploadedFiles.map((file) => file.url),
        });

        const createdAssessment = await Assessment.findById(assessment._id)
            .populate("course", "title")
            .populate("creator", "username fullName avatar");

        res.status(201).json(
            new ApiResponse({
                statusCode: 201,
                message: "Assessment created successfully",
                data: createdAssessment,
            })
        );
    } catch (error) {
        // Clean up uploaded files if assessment creation fails
        if (uploadedFiles.length > 0) {
            await Promise.all(
                uploadedFiles.map((file) => deleteFromCloudinary(file.public_id))
            );
        }

        // Re-throw ApiError as-is, wrap others
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError({
            statusCode: 500,
            message: "Failed to create assessment. Uploaded files have been cleaned up.",
        });
    }


});

const getAllAssessments = asyncHandler(async (req, res) => {
    const { page: rawPage = "1", limit: rawLimit = "10", sortBy = "createdAt", order = "desc", courseId, type } = req.query as unknown as GetRequestPayloads & { courseId?: string, type?: string };

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const userId = req.user?._id;
    const userRole = req.user?.role;


    const filters: QueryFilter<AssessmentSchemaProps> = {
        deletedAt: null,
    }

    if (courseId) filters.course = courseId;
    if (type) filters.type = type;

    // Faculty can only see their own assessments
    if (userRole === "faculty") filters.creator = userId;

    // Students can only see assessments for courses they're enrolled in
    if (userRole === "student") {
        // This would require checking enrollments - simplified for now
        // In production, you'd want to join with Enrollment collection
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;

    const assessments = await Assessment.find(filters)
        .populate("course", "title")
        .populate("creator", "username fullName")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

    const totalAssessments = await Assessment.countDocuments(filters);
    const totalPages = Math.ceil(totalAssessments / limit);

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Assessments fetched successfully",
            data: {
                assessments,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                    totalAssessments,
                },
            },
        })
    );
});

const getAssessmentById = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const assessmentObjectId = new Types.ObjectId(id);

    const assessment = await Assessment.findOne({
        _id: assessmentObjectId,
        deletedAt: null,
    })
        .populate("course", "title description")
        .populate("creator", "username fullName");

    if (!assessment) {
        throw new ApiError({
            statusCode: 404,
            message: "Assessment not exists",
        });
    }

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Assessment fetched successfully",
            data: assessment,
        })
    );
});
// TODO: handle file upload for update
const updateAssessmentById = asyncHandler(async (req, res) => {
    console.log("update fnc");

    const { id } = req.params as { id: string };
    const { title, description, dueDate, maxMarks, type } = req.body as Pick<CreateAssessmentRequestBody, "title" | "description" | "dueDate" | "maxMarks" | "type"> || {};
    const userId = req.user?._id;

    const assessmentObjectId = new Types.ObjectId(id);

    const assessment = await Assessment.findOne({
        _id: assessmentObjectId,
        deletedAt: null,
    });

    if (!assessment) {
        throw new ApiError({
            statusCode: 404,
            message: "Assessment not exists",
        });
    }

    // Check ownership
    if (req.user?.role !== "admin" && assessment.creator.toString() !== userId?.toString()) {
        throw new ApiError({
            statusCode: 403,
            message: "Forbidden: You can only update your own assessments",
        });
    }

    const updatedAssessment = await Assessment.findByIdAndUpdate(
        assessmentObjectId,
        {
            title,
            description,
            dueDate,
            maxMarks,
            type,
        },
        { new: true }
    )
        .populate("course", "title description")
        .populate("creator", "username fullName");

    if (!updatedAssessment) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while updating assessment",
        });
    }

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Assessment updated successfully",
            data: updatedAssessment,
        })
    );
});

const deleteAssessmentById = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const userId = req.user?._id;

    const assessmentObjectId = new Types.ObjectId(id);

    const assessment = await Assessment.findOne({
        _id: assessmentObjectId,
        deletedAt: null,
    });

    if (!assessment) {
        throw new ApiError({
            statusCode: 404,
            message: "Assessment not found",
        });
    }

    // Check ownership
    if (req.user?.role !== "admin" && assessment.creator.toString() !== userId?.toString()) {
        throw new ApiError({
            statusCode: 403,
            message: "Forbidden: You can only delete your own assessments",
        });
    }

    const deleteAssessment = await Assessment.findByIdAndUpdate(assessmentObjectId, {
        deletedAt: new Date(),
    }, { new: true })
        .populate("course", "title description")
        .populate("creator", "username fullName");

    if (!deleteAssessment) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while deleting assessment",
        });
    }

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Assessment deleted successfully",
            data: deleteAssessment,
        })
    );
});

export {
    createAssessment,
    getAllAssessments,
    getAssessmentById,
    updateAssessmentById,
    deleteAssessmentById,
};