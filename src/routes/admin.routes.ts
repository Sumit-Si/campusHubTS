import { Router } from "express";
import { getAllUsers, updateUserRoleById } from "../controllers/admin.controller";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { UserRolesEnum } from "../constants";
import { validate, validateParams } from "../middlewares/validate.middleware";
import { updateUserRoleByIdValidator, userIdParamValidator } from "../validators";

const router = Router();

// Get all users
router
    .route("/users")
    .get(jwtVerify, checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]), getAllUsers);


// Update user role by id
router
    .route("/users/:id/role")
    .put(
        jwtVerify,
        checkRole([UserRolesEnum.ADMIN]),
        validateParams(userIdParamValidator),
        validate(updateUserRoleByIdValidator),
        updateUserRoleById
    );

export default router;