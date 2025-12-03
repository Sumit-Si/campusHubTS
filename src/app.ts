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

// Custom Routes
import healthCheckRouter from "./routes/healthCheck.routes";
app.use("/api/v1/healthCheck", healthCheckRouter);


// Global Error Handling
// app.use((error,req,res,next) => {
    
// })

export default app;