import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import Submission from "../models/submission.model";
import Assessment from "../models/assessment.model";
import Enrollment from "../models/enrollment.model";
import { SubmissionStatusEnum, UserRolesEnum } from "../constants";
import { Types } from "mongoose";
import { GetRequestPayloads } from "../types/common.types";
import { deleteFromCloudinary, uploadOnCloudinary } from "../config/cloudinary";

type CreateSubmissionRequestBody = {
    assessmentId: string;
};

// Create or update draft submission
const createOrUpdateSubmission = asyncHandler(async (req, res) => {
    const { assessmentId } = req.body as CreateSubmissionRequestBody;
    const userId = req.user?._id;

    const assessmentObjectId = new Types.ObjectId(assessmentId);

    const assessment = await Assessment.findOne({
        _id: assessmentObjectId,
        deletedAt: null,
    }).select("_id course maxMarks dueDate");

    if (!assessment) {
        throw new ApiError({
            statusCode: 404,
            message: "Assessment not exists",
        });
    }

    // Verify user is enrolled in the course
    const enrollment = await Enrollment.findOne({
        user: userId,
        course: assessment.course,
        deletedAt: null,
        status: "active",
    });

    if (!enrollment) {
        throw new ApiError({
            statusCode: 403,
            message: "You are not enrolled in this course",
        });
    }

    const submissionFiles = req.files as Express.Multer.File[] | undefined;
    console.log("Submission Files: ", submissionFiles);

    let uploadedFiles: Array<{ url: string, public_id: string }> = [];

    if (submissionFiles && submissionFiles.length > 0) {

        try {
            // Filter out files without paths
            const validFiles = submissionFiles.filter((file) => file?.path);

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

    // Check if submission already exists
    let submission = await Submission.findOne({
        user: userId,
        assessment: assessmentObjectId,
        deletedAt: null,
    });

    if (submission) {
        // Update existing submission (only if draft)
        if (submission.status !== SubmissionStatusEnum.DRAFT) {
            throw new ApiError({
                statusCode: 400,
                message: "Cannot update submitted submission",
            });
        }
        console.log("submissionFIles start: ", submissionFiles);
        const updateSubmission = await Submission.findByIdAndUpdate(submission._id, {
            submissionFiles: uploadedFiles ? uploadedFiles.map((file) => file.url) : []
        })
        console.log("submissionFIles end: ", submissionFiles);
        const updatedSubmission = await Submission.findById(submission._id)
            .populate("user", "username fullName avatar")
            .populate("assessment", "title maxMarks dueDate");

        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Submission updated successfully",
                data: updatedSubmission,
            })
        );
    }

    // Create new submission
    submission = await Submission.create({
        user: userId,
        assessment: assessmentId,
        submissionFiles: uploadedFiles ? uploadedFiles.map((file) => file.url) : [],
        status: SubmissionStatusEnum.DRAFT,
    });

    const createdSubmission = await Submission.findById(submission._id)
        .populate("user", "username fullName avatar")
        .populate("assessment", "title maxMarks dueDate");

    res.status(201).json(
        new ApiResponse({
            statusCode: 201,
            message: "Submission created successfully",
            data: createdSubmission,
        })
    );
});

// Submit the submission (change status from draft to submitted)
const submitSubmission = asyncHandler(async (req, res) => {
    const { id } = req.params as {id: string};
    const userId = req.user?._id;

    const submissionObjectId = new Types.ObjectId(id);

    const submission = await Submission.findOne({
        _id: submissionObjectId,
        user: userId,
        deletedAt: null,
    }).populate("assessment", "dueDate maxMarks");

    if (!submission) {
        throw new ApiError({
            statusCode: 404,
            message: "Submission not exists",
        });
    }

    if (submission.status !== SubmissionStatusEnum.DRAFT) {
        throw new ApiError({
            statusCode: 400,
            message: "Submission already submitted",
        });
    }

    // Check if submission has files
    if (!submission.submissionFiles || submission.submissionFiles.length === 0) {
        throw new ApiError({
            statusCode: 400,
            message: "Cannot submit without files",
        });
    }

    const assessment = submission.assessment as any;
    const now = new Date();
    const dueDate = new Date(assessment.dueDate);

    // Determine if late submission
    const status = now > dueDate ? SubmissionStatusEnum.LATE : SubmissionStatusEnum.SUBMITTED;

    submission.status = status;
    submission.submissionDate = now;
    await submission.save();

    const updatedSubmission = await Submission.findById(submission._id)
        .populate("user", "username fullName")
        .populate("assessment", "title maxMarks dueDate type");

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: status === SubmissionStatusEnum.LATE
                ? "Submission submitted (late)"
                : "Submission submitted successfully",
            data: updatedSubmission,
        })
    );
});

const getSubmissionById = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const submissionObjectId = new Types.ObjectId(id);

    const submission = await Submission.findOne({
        _id: submissionObjectId,
        deletedAt: null,
    })
        .populate("user", "username fullName avatar")
        .populate("assessment", "title description maxMarks dueDate type course")
        .populate("result", "marks grade feedback");

    if (!submission) {
        throw new ApiError({
            statusCode: 404,
            message: "Submission not exists",
        });
    }

    // Authorization check for student
    const submissionUser = (submission.user as any)._id.toString();
    if (userRole === UserRolesEnum.STUDENT && submissionUser !== userId?.toString()) {
        throw new ApiError({
            statusCode: 403,
            message: "Forbidden: You can only view your own submissions",
        });
    }

    // Faculty can only view submissions for their courses
    if (userRole === UserRolesEnum.FACULTY) {
        const assessment = submission.assessment as any;
        const assessmentDoc = await Assessment.findById(assessment._id || assessment)
            .select("creator course");

        if (assessmentDoc?.creator.toString() !== userId?.toString()) {
            throw new ApiError({
                statusCode: 403,
                message: "Forbidden: You can only view submissions for your assessments",
            });
        }
    }

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Submission fetched successfully",
            data: submission,
        })
    );
});

// Get all submissions for an assessment (Faculty only)
const getSubmissionsByAssessment = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { page: rawPage = "1", limit: rawLimit = "10", sortBy = "createdAt", order = "asc", createdBy } = req.query as unknown as GetRequestPayloads;

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    const assessmentObjectId = new Types.ObjectId(id);

    // Verify assessment exists and user owns it
    const assessment = await Assessment.findOne({
        _id: assessmentObjectId,
        creator: req.user?._id,
        deletedAt: null,
    });

    if (!assessment) {
        throw new ApiError({
            statusCode: 404,
            message: "Assessment not exists or you don't have permission",
        });
    }

    const submissions = await Submission.find({
        assessment: assessmentObjectId,
        deletedAt: null,
    })
        .populate("user", "username fullName email")
        .populate("assessment", "title creator")
        .populate("result", "marks grade")
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder });

    const totalSubmissions = await Submission.countDocuments({
        assessment: assessmentObjectId,
        deletedAt: null,
    });

    const totalPages = Math.ceil(totalSubmissions / limit);

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Submissions fetched successfully",
            data: {
                submissions,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                    totalSubmissions,
                }
            },
        })
    );
});

const getSubmissionsByUser = asyncHandler(async (req, res) => {
    const { id, page: rawPage = "1", limit: rawLimit = "10", order = "asc", sortBy = "createdAt", search } = req.query as unknown as GetRequestPayloads & { id?: string };
    const userId = req.user?._id;

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    // Students can only view their own submissions
    // Faculty/Admin can view any user's submissions
    const queryUserId = req.user?.role === UserRolesEnum.STUDENT
        ? userId
        : (id || userId);

    const submissions = await Submission.find({
        user: queryUserId,
        deletedAt: null,
    })
        .populate("user", "username fullName avatar")
        .populate("assessment", "title maxMarks dueDate type course")
        .populate("result", "marks grade")
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder });

    const totalSubmissions = await Submission.countDocuments({
        user: queryUserId,
        deletedAt: null,
    });
    const totalPages = Math.ceil(totalSubmissions / limit);

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Submissions fetched successfully",
            data: {
                submissions,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                    totalSubmissions,
                }
            },
        })
    );
});

export {
    createOrUpdateSubmission,
    submitSubmission,
    getSubmissionById,
    getSubmissionsByAssessment,
    getSubmissionsByUser,
};




