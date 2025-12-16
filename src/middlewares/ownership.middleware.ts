import { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import Course from "../models/course.model";
import Enrollment from "../models/enrollment.model";
import { UserRolesEnum } from "../constants";

const requireCourseOwnership = (courseId: (req: Request) => string | undefined) =>
    asyncHandler(async (req, _res, next) => {

        if (!courseId) {
            throw new ApiError({ statusCode: 400, message: "courseId is required" });
        }

        const ownsCourse = await Course.findOne({
            _id: courseId,
            creator: req.user?._id,
            deletedAt: null,
        });

        if (!ownsCourse) {
            throw new ApiError({ statusCode: 403, message: "Forbidden: not course owner" });
        }

        next();
    });

const requireFacultyCourseOwnershipByQuery = asyncHandler(async (req, _res, next) => {
    if (req.user?.role !== UserRolesEnum.FACULTY) {
        return next();
    }

    const courseId = req.query.courseId as string | undefined;

    if (!courseId) {
        throw new ApiError({ statusCode: 400, message: "courseId is required for faculty" });
    }

    const ownsCourse = await Course.findOne({
        _id: courseId,
        creator: req.user?._id,
        deletedAt: null,
    });

    if (!ownsCourse) {
        throw new ApiError({ statusCode: 403, message: "Forbidden: not course owner" });
    }

    next();
});

const requireEnrollmentOwnership = asyncHandler(async (req, _res, next) => {
    const enrollment = await Enrollment.findById(req.params.id).select("course user");

    if (!enrollment) {
        throw new ApiError({ statusCode: 404, message: "Enrollment not exists" });
    }

    // Admin can access any enrollment
    if (req.user?.role === UserRolesEnum.ADMIN) {
        return next();
    }

    // Students can access their own enrollment only
    if (req.user?.role === UserRolesEnum.STUDENT && enrollment.user.toString() === req.user._id.toString()) {
        return next();
    }

    // Faculty must own the course tied to the enrollment
    if (req.user?.role === UserRolesEnum.FACULTY) {
        const ownsCourse = await Course.findOne({
            _id: enrollment.course,
            creator: req.user?._id,
            deletedAt: null,
        });

        if (ownsCourse) {
            return next();
        }
    }

    throw new ApiError({ statusCode: 403, message: "Forbidden: not allowed for this enrollment" });
});

export {
    requireCourseOwnership,
    requireEnrollmentOwnership,
    requireFacultyCourseOwnershipByQuery,
};

