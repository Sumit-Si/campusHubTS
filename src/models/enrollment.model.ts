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

// Pivot table for User and Course relationship
const Enrollment = mongoose.model<EnrollmentSchemaProps>("Enrollment", enrollmentSchema);

export default Enrollment;
