import mongoose, { Schema } from "mongoose";
import { AvailableResultGrades } from "../constants";
import { ResultSchemaProps } from "../types/common.types";

const resultSchema = new Schema<ResultSchemaProps>({
    enrollment: {
        type: Schema.Types.ObjectId,
        ref: "Enrollment",
        required: true,
    },
    assessment: {
        type: Schema.Types.ObjectId,
        ref: "Assessment",
        required: true,
    },
    submission: {
        type: Schema.Types.ObjectId,
        ref: "Submission",
        required: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    marks: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    grade: {
        type: String,
        enum: AvailableResultGrades,
        required: true,
    },
    academicYear: {
        type: Number,
        required: true,
    },
    remarks: {
        type: String,
        trim: true,
    },
    deletedAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
});

// Indexes for performance
resultSchema.index({ enrollment: 1, assessment: 1 }, { unique: true }); // One result per enrollment per assessment
resultSchema.index({ user: 1, course: 1, academicYear: 1 });
resultSchema.index({ assessment: 1, deletedAt: 1 });
resultSchema.index({ course: 1, academicYear: 1 });

const Result = mongoose.model<ResultSchemaProps>("Result", resultSchema);

export default Result;