import express from "express";
import cors from "cors";
import config from "./config/config";
import cookieParser from "cookie-parser";



const app = express();

// Middlewares
app.use(cors({
    origin: config.WHITELIST_ORIGINS,
    credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// Custom Routes
import healthCheckRouter from "./routes/healthCheck.routes";
import authRouter from "./routes/auth.routes";
import adminRouter from "./routes/admin.routes";
import courseRouter from "./routes/course.routes";
import globalErrorHandler from "./utils/globalErrorHandler";

app.use("/api/v1/healthCheck", healthCheckRouter);
app.use("/api/v1/users", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/courses", courseRouter);

// Global Error Handling
app.use(globalErrorHandler);

export default app;