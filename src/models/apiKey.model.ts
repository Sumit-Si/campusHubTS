import mongoose, { Schema, Types } from "mongoose";
import { ApiKeyScheamProps } from "../types/auth.types";

const apiKeySchema = new Schema<ApiKeyScheamProps>({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    expiresAt: {
        type: Date,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
    },
}, {
    timestamps: true,
});


const ApiKey = mongoose.model<ApiKeyScheamProps>("ApiKey", apiKeySchema);

export default ApiKey;