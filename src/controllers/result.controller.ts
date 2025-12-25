import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import Result from "../models/result.model";
import Submission from "../models/submission.model";
import Assessment from "../models/assessment.model";
import Enrollment from "../models/enrollment.model";
import { calculateGrade } from "../utils/gradeCalculator";
import { SubmissionStatusEnum, UserRolesEnum } from "../constants";
import { Types } from "mongoose";
import { GetRequestPayloads } from "../types/common.types";

type CreateBulkResultsRequestBody = {
    assessmentId: string;
    results: Array<{
        submissionId: string;
        marks: number;
        feedback?: string;
        remarks?: string;
    }>;
    academicYear: number;
};

type CreateSingleResultRequestBody = {
    submissionId: string;
    marks: number;
    feedback?: string;
    remarks?: string;
    academicYear: number;
};

const createBulkResults = asyncHandler(async (req, res) => {
    const { assessmentId, results, academicYear } = req.body as CreateBulkResultsRequestBody;
    const userId = req.user?._id;

    const assessmentObjectId = new Types.ObjectId(assessmentId);

    // Verify assessment exists and user owns it
    const assessment = await Assessment.findOne({
        _id: assessmentObjectId,
        creator: userId,
        deletedAt: null,
    }).populate("course", "_id");

    if (!assessment) {
        throw new ApiError({
            statusCode: 404,
            message: "Assessment not exists or you don't have permission",
        });
    }

    const course = assessment.course as Types.ObjectId;
    const createdResults = [];

    for (const resultData of results) {
        const { submissionId, marks, feedback, remarks } = resultData;

        // Verify submission exists and belongs to this assessment
        const submission = await Submission.findOne({
            _id: submissionId,
            assessment: assessmentObjectId,
            deletedAt: null,
        }).populate("user", "_id");

        if (!submission) {
            throw new ApiError({
                statusCode: 404,
                message: `Submission ${submissionId} not exists or doesn't belong to this assessment`,
            });
        }

        // Verify enrollment exists
        const user = submission.user as Types.ObjectId;
        const enrollment = await Enrollment.findOne({
            user: user._id,
            course: course._id,
            deletedAt: null,
        });

        if (!enrollment) {
            throw new ApiError({
                statusCode: 400,
                message: `User is not enrolled in this course for submission ${submissionId}`,
            });
        }

        // Check if result already exists
        const existingResult = await Result.findOne({
            enrollment: enrollment._id,
            assessment: assessmentObjectId,
            deletedAt: null,
        });

        if (existingResult) {
            // Update existing result
            existingResult.marks = marks;
            existingResult.grade = calculateGrade(marks);
            existingResult.remarks = remarks || existingResult.remarks;
            await existingResult.save();

            // Update submission
            submission.marks = marks;
            submission.feedback = feedback || submission.feedback;
            submission.status = SubmissionStatusEnum.GRADED;
            submission.result = existingResult._id;
            await submission.save();

            createdResults.push(existingResult);
            continue;
        }

        // Validate marks against maxMarks
        if (marks < 0 || marks > assessment.maxMarks) {
            throw new ApiError({
                statusCode: 400,
                message: `Marks must be between 0 and ${assessment.maxMarks} for submission ${submissionId}`,
            });
        }

        // Calculate percentage for grade (assuming maxMarks can be different from 100)
        const percentage = (marks / assessment.maxMarks) * 100;
        const grade = calculateGrade(percentage);

        // Create result
        const result = await Result.create({
            enrollment: enrollment._id,
            assessment: assessmentId,
            submission: submissionId,
            course: course._id,
            user: user._id,
            creator: userId,
            marks: marks, // Store as percentage for consistency
            grade,
            academicYear,
            remarks,
        });

        // Update submission
        submission.marks = marks;
        submission.feedback = feedback;
        submission.status = SubmissionStatusEnum.GRADED;
        submission.result = result._id;
        await submission.save();

        createdResults.push(result);
    }

    // Populate results with related data
    const populatedResults = await Result.find({
        _id: { $in: createdResults.map(result => result._id) },
    })
        .populate("user", "username fullName")
        .populate("assessment", "title maxMarks")
        .populate("submission", "submissionDate status");

    res.status(201).json(
        new ApiResponse({
            statusCode: 201,
            message: `${createdResults.length} result(s) created/updated successfully`,
            data: populatedResults,
        })
    );
});

const createSingleResult = asyncHandler(async (req, res) => {
    const { submissionId, marks, feedback, remarks, academicYear } = req.body as CreateSingleResultRequestBody;
    const userId = req.user?._id;

    const submissionObjectId = new Types.ObjectId(submissionId);

    // Verify submission exists
    const submission = await Submission.findOne({
        _id: submissionObjectId,
        deletedAt: null,
    })
        .populate("assessment", "maxMarks course creator")
        .populate("user", "_id");

    if (!submission) {
        throw new ApiError({
            statusCode: 404,
            message: "Submission not exists",
        });
    }

    const assessment = submission.assessment as any;
    const user = submission.user as Types.ObjectId;

    // Verify user owns the assessment
    if (assessment.creator.toString() !== userId?.toString() && req.user?.role !== UserRolesEnum.ADMIN) {
        throw new ApiError({
            statusCode: 403,
            message: "Forbidden: You can only grade submissions for your assessments",
        });
    }

    // Verify enrollment exists
    const enrollment = await Enrollment.findOne({
        user: user._id,
        course: assessment.course,
        deletedAt: null,
    });

    if (!enrollment) {
        throw new ApiError({
            statusCode: 400,
            message: "User is not enrolled in this course",
        });
    }

    // Check if result already exists
    let result = await Result.findOne({
        enrollment: enrollment._id,
        assessment: assessment._id,
        deletedAt: null,
    });

    // Validate marks
    if (marks < 0 || marks > assessment.maxMarks) {
        throw new ApiError({
            statusCode: 400,
            message: `Marks must be between 0 and ${assessment.maxMarks}`,
        });
    }

    // Calculate percentage for grade
    const percentage = (marks / assessment.maxMarks) * 100;
    const grade = calculateGrade(percentage);

    if (result) {
        // Update existing result
        result.marks = marks;
        result.grade = grade;
        result.remarks = remarks || result.remarks;
        await result.save();
    } else {
        // Create new result
        result = await Result.create({
            enrollment: enrollment._id,
            assessment: assessment._id,
            submission: submissionId,
            course: assessment.course,
            user: user._id,
            creator: userId,
            marks: percentage,
            grade,
            academicYear,
            remarks,
        });
    }

    // Update submission
    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = SubmissionStatusEnum.GRADED;
    submission.result = result._id;
    await submission.save();

    const populatedResult = await Result.findById(result._id)
        .populate("user", "username fullName avatar")
        .populate("assessment", "title maxMarks type")
        .populate("submission", "submissionDate status")
        .populate("course", "title");

    res.status(201).json(
        new ApiResponse({
            statusCode: 201,
            message: "Result created/updated successfully",
            data: populatedResult,
        })
    );
});

const getResultsByAssessment = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { page: rawPage = "1", limit: rawLimit = "10", order = "asc", sortBy = "createdAt", search } = req.query as unknown as GetRequestPayloads;
    const userId = req.user?._id;

    const assessmentObjectId = new Types.ObjectId(id);

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    // Verify assessment exists and user has permission
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

    // Faculty can only see results for their assessments
    if (req.user?.role === UserRolesEnum.FACULTY && assessment.creator.toString() !== userId?.toString()) {
        throw new ApiError({
            statusCode: 403,
            message: "Forbidden: You can only view results for your assessments",
        });
    }

    const results = await Result.find({
        assessment: assessmentObjectId,
        deletedAt: null,
    })
        .populate("user", "username fullName email")
        .populate("submission", "submissionDate status")
        .populate("course", "title")
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder });

    const totalResults = await Result.countDocuments({
        assessment: assessmentObjectId,
        deletedAt: null,
    });
    const totalPages = Math.ceil(totalResults / limit);

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Results fetched successfully",
            data: {
                results,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                    totalResults,
                }
            },
        })
    );
});

const getResultsByUser = asyncHandler(async (req, res) => {
    const { id, page: rawPage = "1", limit: rawLimit = "10", order = "asc", sortBy = "createdAt", search } = req.query as unknown as GetRequestPayloads & { id?: string };
    const userId = req.user?._id;

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    // Students can only view their own results
    const queryUserId = req.user?.role === UserRolesEnum.STUDENT
        ? userId
        : (id || userId);

    const results = await Result.find({
        user: queryUserId,
        deletedAt: null,
    })
        .populate("assessment", "title maxMarks type")
        .populate("course", "title")
        .populate("submission", "submissionDate")
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder });

    const totalResults = await Result.countDocuments({
        user: queryUserId,
        deletedAt: null,
    });
    const totalPages = Math.ceil(totalResults / limit);

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Results fetched successfully",
            data: {
                results,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                    totalResults,
                }
            },
        })
    );
});

export {
    createBulkResults,
    createSingleResult,
    getResultsByAssessment,
    getResultsByUser,
};