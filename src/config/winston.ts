import winston from "winston";
import config from "./config";

const { combine, timestamp, json, errors, align, printf, colorize } = winston.format;

// Define the transports array to hold different logging transports
const transports: winston.transport[] = [];

if (config.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),    // Add colors to log levels
                timestamp({ format: "YYYY-MM-DD hh:mm:ss A" }),   // Add timestamp to logs
                align(),    // Align log messages
                printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta)}` : "";

                    return `${timestamp} ${level.toUpperCase()}: ${message}${metaStr}`;
                })
            )
        }

        )
    )
}

// Create a logger instance using winston
const logger = winston.createLogger({
    level: config.LOG_LEVEL || "info",
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports,
    silent: config.NODE_ENV === "test",     // Disable logging in test environment
});



export {
    logger,
}