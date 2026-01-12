import { Router } from "express";
import { createInstitution, deleteInstitutionById, getInstitutionById, getInstitutions, updateInstitutionById } from "../controllers/institution.controller";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { validate, validateParams } from "../middlewares/validate.middleware";
import { createInstitutionValidator, institutionIdParamValidator, updateInstitutionValidator } from "../validators";
import { UserRolesEnum } from "../constants";

const router = Router();

router
    .route("/")
    .get(jwtVerify,
        checkRole([UserRolesEnum.ADMIN]),
        getInstitutions,
    )
    .post(jwtVerify,
        checkRole([UserRolesEnum.ADMIN]),
        validate(createInstitutionValidator),
        createInstitution);

router
    .route("/:id")
    .get(jwtVerify,
        checkRole([UserRolesEnum.ADMIN]),
        getInstitutionById,
    )
    .put(jwtVerify,
        checkRole([UserRolesEnum.ADMIN]),
        validateParams(institutionIdParamValidator),
        validate(updateInstitutionValidator),
        updateInstitutionById,
    )
    .delete(jwtVerify,
        checkRole([UserRolesEnum.ADMIN]),
        validateParams(institutionIdParamValidator),
        deleteInstitutionById,
    )

export default router;