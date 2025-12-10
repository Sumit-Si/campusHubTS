import { WHITELIST_ORIGINS } from "../constants";
import ms from "ms";

const config = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    WHITELIST_ORIGINS,
    MONGO_URI: process.env.MONGO_URI as string,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
    ACCESS_TOKEN_MAX_AGE: Number(process.env.ACCESS_TOKEN_MAX_AGE) as number,
    REFRESH_TOKEN_MAX_AGE: Number(process.env.REFRESH_TOKEN_MAX_AGE) as number,
}

export default config;