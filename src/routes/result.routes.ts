import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { UserRolesEnum } from "../constants";
import { validate, validateParams } from "../middlewares/validate.middleware";
import {
    createBulkResults,
    createSingleResult,
    getResultsByAssessment,
    getResultsByUser,
} from "../controllers/result.controller";
import {
    createBulkResultsValidator,
    createSingleResultValidator,
    assessmentIdParamValidator,
} from "../validators";

const router = Router();

// Create bulk results & Get results by user
router
    .route("/")
    .post(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validate(createBulkResultsValidator),
        createBulkResults,
    );

// Create single result
router
    .route("/single")
    .post(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validate(createSingleResultValidator),
        createSingleResult,
    );

// Get results by user
router
    .route("/user")
    .get(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY, UserRolesEnum.STUDENT]),
        getResultsByUser,
    );

// Get results by assessment
router
    .route("/assessment/:id")
    .get(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY, UserRolesEnum.STUDENT]),
        validateParams(assessmentIdParamValidator),
        getResultsByAssessment,
    );

export default router;