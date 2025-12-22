import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { UserRolesEnum } from "../constants";
import { validate, validateParams } from "../middlewares/validate.middleware";
import {
    createOrUpdateSubmission,
    submitSubmission,
    getSubmissionById,
    getSubmissionsByAssessment,
    getSubmissionsByUser,
} from "../controllers/submission.controller";
import {
    createSubmissionValidator,
    submissionIdParamValidator,
    assessmentIdParamValidator,
} from "../validators";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

// Create or update draft submission
router
    .route("/")
    .post(
        jwtVerify,
        checkRole([UserRolesEnum.STUDENT]),
        upload.array("submissionFiles", 3),
        validate(createSubmissionValidator),
        createOrUpdateSubmission,
    );

// Get all submissions by user
router
    .route("/user")
    .get(
        jwtVerify,
        checkRole([UserRolesEnum.STUDENT, UserRolesEnum.FACULTY, UserRolesEnum.ADMIN]),
        getSubmissionsByUser,
    );

// Submit submission (change status from draft to submitted)
router
    .route("/:id/submit")
    .patch(
        jwtVerify,
        checkRole([UserRolesEnum.STUDENT]),
        validateParams(submissionIdParamValidator),
        submitSubmission,
    );

// Get submission by ID
router
    .route("/:id")
    .get(
        jwtVerify,
        checkRole([UserRolesEnum.STUDENT, UserRolesEnum.FACULTY, UserRolesEnum.ADMIN]),
        validateParams(submissionIdParamValidator),
        getSubmissionById,
    );

// Get all submissions for an assessment (Faculty only)
router
    .route("/assessment/:id")
    .get(
        jwtVerify,
        checkRole([UserRolesEnum.FACULTY, UserRolesEnum.ADMIN]),
        validateParams(assessmentIdParamValidator),
        getSubmissionsByAssessment,
    );

export default router;

