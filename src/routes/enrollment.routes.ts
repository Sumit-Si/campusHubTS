import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { AvailableUserRoles, UserRolesEnum } from "../constants";
import { validate, validateParams } from "../middlewares/validate.middleware";
import { createEnrollment, deleteEnrollmentById, getAllEnrollments, getEnrollmentById, updateEnrollmentById } from "../controllers/enrollment.controller";
import { createEnrollmentValidator, enrollmentIdParamValidator, updateEnrollmentValidator } from "../validators";
import { requireEnrollmentOwnership, requireFacultyCourseOwnershipByQuery } from "../middlewares/ownership.middleware";

const router = Router();

// create and get all enrollments
router
    .route("/")
    .post(jwtVerify,
        checkRole(AvailableUserRoles),
        validate(createEnrollmentValidator),
        createEnrollment,
    )
    .get(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        getAllEnrollments,
    );


// get, update and delete enrollment by id
router
    .route("/:id")
    .get(
        jwtVerify,
        checkRole(AvailableUserRoles),
        validateParams(enrollmentIdParamValidator),
        requireEnrollmentOwnership,
        getEnrollmentById,
    )
    .put(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validateParams(enrollmentIdParamValidator),
        requireEnrollmentOwnership,
        validate(updateEnrollmentValidator),
        updateEnrollmentById,
    )
    .delete(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validateParams(enrollmentIdParamValidator),
        requireEnrollmentOwnership,
        deleteEnrollmentById,
    );

export default router;