import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { AvailableUserRoles, UserRolesEnum } from "../constants";
import { validate } from "../middlewares/validate.middleware";
import { createEnrollment, getAllEnrollments, getEnrollmentById, updateEnrollmentById } from "../controllers/enrollment.controller";
import { createEnrollmentValidator, updateEnrollmentValidator } from "../validators";

const router = Router();

// create and get all enrollments
router
    .route("/")
    .post(jwtVerify,
        checkRole(AvailableUserRoles),
        validate(createEnrollmentValidator),
        createEnrollment,
    )
    .get(jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        getAllEnrollments,
    );


// get, update and delete enrollment by id
router
    .route("/:id")
    .get(jwtVerify,
        checkRole(AvailableUserRoles),
        getEnrollmentById,
    )
    .put(jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validate(updateEnrollmentValidator),
        updateEnrollmentById,
    )
    .put(jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        deleteEnrollmentById,
    )

export default router;