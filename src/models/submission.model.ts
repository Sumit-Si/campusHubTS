import mongoose, { Schema } from "mongoose";
import { AvailableSubmissionStatus, SubmissionStatusEnum } from "../constants";
import { SubmissionSchemaProps } from "../types/common.types";

const submissionSchema = new Schema<SubmissionSchemaProps>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assessment: {
        type: Schema.Types.ObjectId,
        ref: "Assessment",
        required: true,
    },
    institution: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Institution",
    },
    submissionDate: {
        type: Date,
        default: null,
    },
    submissionFiles: [
        {
            type: String,
        }
    ],
    marks: {
        type: Number,
        min: 0,
        // Max marks will be validated against assessment.maxMarks in controller
    },
    feedback: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: AvailableSubmissionStatus,
        default: SubmissionStatusEnum.DRAFT,
    },
    result: {
        type: Schema.Types.ObjectId,
        ref: "Result",
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Indexes for performance
submissionSchema.index({ user: 1, assessment: 1 }, { unique: true }); // One submission per user per assessment
submissionSchema.index({ assessment: 1, status: 1 });
submissionSchema.index({ user: 1, status: 1 });
submissionSchema.index({ assessment: 1, deletedAt: 1 });

const Submission = mongoose.model<SubmissionSchemaProps>("Submission", submissionSchema);

export default Submission;