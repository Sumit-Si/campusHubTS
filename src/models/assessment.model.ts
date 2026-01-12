import mongoose, { Schema, Types } from "mongoose";

export type AssessmentType = "quiz" | "assignment" | "exam";

export const AssessmentTypeEnum = {
    QUIZ: "quiz",
    ASSIGNMENT: "assignment",
    EXAM: "exam",
} as const;

export const AvailableAssessmentTypes = Object.values(AssessmentTypeEnum) as readonly AssessmentType[];

export type AssessmentSchemaProps = {
    title: string;
    description: string;
    dueDate: Date;
    course: Types.ObjectId;
    creator: Types.ObjectId;
    institution: Types.ObjectId;
    assessmentFiles?: string[];
    maxMarks: number;
    type?: AssessmentType;
    deletedAt: Date | null;
}

const assessmentSchema = new Schema<AssessmentSchemaProps>({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    institution: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Institution",
        },
    assessmentFiles: [
        {
            type: String,
        }
    ],
    maxMarks: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    type: {
        type: String,
        enum: AvailableAssessmentTypes,
        default: AssessmentTypeEnum.QUIZ,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Indexes for performance
assessmentSchema.index({ course: 1, deletedAt: 1 });
assessmentSchema.index({ creator: 1, deletedAt: 1 });
assessmentSchema.index({ dueDate: 1, deletedAt: 1 });
assessmentSchema.index({ course: 1, type: 1, deletedAt: 1 });

const Assessment = mongoose.model<AssessmentSchemaProps>("Assessment", assessmentSchema);

export default Assessment;