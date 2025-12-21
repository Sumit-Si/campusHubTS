import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { UserRolesEnum } from "../constants";
import { validate, validateParams } from "../middlewares/validate.middleware";
import {
    createAssessment,
    getAllAssessments,
    getAssessmentById,
    updateAssessmentById,
    deleteAssessmentById,
} from "../controllers/assessment.controller";
import {
    createAssessmentValidator,
    assessmentIdParamValidator,
    updateAssessmentValidator,
} from "../validators";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

// Create assessment & Get all assessments
router
    .route("/")
    .post(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        upload.array("assessmentFiles", 3),
        validate(createAssessmentValidator),
        createAssessment,
    )
    .get(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY, UserRolesEnum.STUDENT]),
        getAllAssessments,
    );

// Get, Update and Delete assessment by Id
router
    .route("/:id")
    .get(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY, UserRolesEnum.STUDENT]),
        validateParams(assessmentIdParamValidator),
        getAssessmentById,
    )
    .put(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validateParams(assessmentIdParamValidator),
        validate(updateAssessmentValidator),
        updateAssessmentById,
    )
    .delete(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validateParams(assessmentIdParamValidator),
        deleteAssessmentById,
    );

export default router;