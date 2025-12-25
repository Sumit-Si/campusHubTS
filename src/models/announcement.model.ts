import mongoose, { Schema } from "mongoose";
import { AnnouncementSchemaProps } from "../types/common.types";
import { AnnouncementStatusEnum, AnnouncementTargetEnum, AnnouncementTypesEnum, AvailableAnnouncementStatus, AvailableAnnouncementTargetStatus, AvailableAnnouncementTypes } from "../constants";


const announcementSchema = new Schema<AnnouncementSchemaProps>({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: AvailableAnnouncementTypes,
        default: AnnouncementTypesEnum.INFO,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    publishedAt: {
        type: Date,
    },
    expiresAt: {
        type: Date,
    },
    attachments: [
        {
            type: String,
        }
    ],
    target: {
        type: String,
        enum: AvailableAnnouncementTargetStatus,
        default: AnnouncementTargetEnum.COURSE_STUDENTS,
    },
    status: {
        type: String,
        enum: AvailableAnnouncementStatus,
        default: AnnouncementStatusEnum.DRAFT,
    },
    deletedAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
});

announcementSchema.index({ course: 1, creator: 1});
announcementSchema.index({ course: 1, type: 1});
announcementSchema.index({ course: 1, target: 1, status: 1, deletedAt: 1});

const Announcement = mongoose.model<AnnouncementSchemaProps>("Announcement", announcementSchema);

export default Announcement;