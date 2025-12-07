import { Router } from "express";
import { healthCheck } from "../controllers/healthCheck.controller";
import {jwtVerify} from "../middlewares/auth.middleware";

const router = Router();

router
    .route("/")
    .get(healthCheck);

export default router;