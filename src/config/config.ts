import { WHITELIST_ORIGINS } from "../constants";

const config = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    WHITELIST_ORIGINS,
    MONGO_URI: process.env.MONGO_URI as string,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
}

export default config;