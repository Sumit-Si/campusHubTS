import mongoose, { Schema } from "mongoose";
import { AvailableEnrollmentStatus, AvailableUserRoles, EnrollmentStatus, EnrollmentStatusEnum, UserRolesEnum } from "../constants";
import { EnrollmentSchemaProps } from "../types/common.types";


const enrollmentSchema = new Schema<EnrollmentSchemaProps>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    role: {
        type: String,
        enum: AvailableUserRoles,
        default: UserRolesEnum.STUDENT,
    },
    // enrolledAt: {
    //     type: Date,
    //     required: true,
    // },
    status: {
        type: String,
        enum: AvailableEnrollmentStatus,
        default: EnrollmentStatusEnum.ACTIVE,
    },
    remarks: {
        type: String,
    },
    deletedAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
});

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ course: 1, deletedAt: 1 });

// Pivot table for User and Course relationship
const Enrollment = mongoose.model<EnrollmentSchemaProps>("Enrollment", enrollmentSchema);

export default Enrollment;
