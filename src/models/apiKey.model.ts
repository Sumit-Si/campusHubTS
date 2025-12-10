import mongoose, { Schema, Types } from "mongoose";

export type ApiKeyScheamProps = {
    key: string;
    expiresAt?: Date;
    createdBy: Types.ObjectId;
    isDeleted: boolean;
    description?: string;
}

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