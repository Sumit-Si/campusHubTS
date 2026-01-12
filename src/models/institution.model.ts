import mongoose, { Schema, Types } from "mongoose";
import { AvailableInstitutionStatus, InstitutionStatus, InstitutionStatusEnum } from "../constants";

export type InstitutionSchemaProps = {
    name: string;
    code: string;
    domain?: string;
    logo?: string;
    email: string;
    phone?: string;
    website?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
    };
    branding?: {
        primaryColor?: string;
        secondaryColor?: string;
    },
    academic?: {
        currentYear?: string;
        semester?: number;
    },
    onboarding?: {
        isCompleted?: boolean;
        completedAt?: Date;
        stepsCompleted?: string[];
    },
    status?: InstitutionStatus;
    features?: {
        assessment?: boolean;
        submission?: boolean;
        result?: boolean;
        notification?: boolean;
        announcement?: boolean;
        events?: boolean;
        attendance?: boolean;
    },
    creator: Types.ObjectId;
    deletedAt: Date | null;
}

const institutionSchema = new Schema<InstitutionSchemaProps>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    domain: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    logo: {
        type: String,
        trim: true,
    },
    address: {
        street: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
            default: "India",
        },
        pincode: {
            type: String,
            trim: true,
        },
    },
    branding: {
        primaryColor: {
            type: String,
            trim: true,
        },
        secondaryColor: {
            type: String,
            trim: true,
        },
    },
    academic: {
        currentYear: {
            type: String,
            trim: true,
        },
        semester: {
            type: Number,
            trim: true,
            default: 1,
        },
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    onboarding: {
        isCompleted: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        stepsCompleted: {
            type: [String],
            default: [],
        },
    },
    features: {
        assessment: {
            type: Boolean,
            default: true,
        },
        submission: {
            type: Boolean,
            default: true,
        },
        result: {
            type: Boolean,
            default: true,
        },
        notification: {
            type: Boolean,
            default: false,
        },
        announcement: {
            type: Boolean,
            default: false,
        },
        events: {
            type: Boolean,
            default: false,
        },
    },
    status: {
        type: AvailableInstitutionStatus,
        default: InstitutionStatusEnum.PENDING,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

institutionSchema.index({ name: 1 });
institutionSchema.index({ status: 1 });

const Institution = mongoose.model<InstitutionSchemaProps>("Institution", institutionSchema);

export default Institution;