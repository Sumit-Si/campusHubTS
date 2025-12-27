import mongoose, { Schema, Types } from "mongoose";
import { AvailableNotificationPriorities, AvailableNotificationTypes, NotificationPriorityEnum, NotificationTypeEnum } from "../constants";
import { NotificationSchemaProps } from "../types/common.types";


const notificationSchema = new Schema<NotificationSchemaProps>({
    message: {
        type: String,
        required: true,
        trim: true,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: AvailableNotificationTypes,
        default: NotificationTypeEnum.ANNOUNCEMENT,
    },
    recipients: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    ],
    // priority: {
    //     type: String,
    //     enum: AvailableNotificationPriorities,
    //     default: NotificationPriorityEnum.NORMAL,
    // },
    expiresAt: {
        type: Date,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    }

}, {
    timestamps: true,
});

// Indexes for faster lookups
notificationSchema.index({ recipients: 1, type: 1, isRead: 1 });
notificationSchema.index({ recipients: 1, createdAt: -1 });
// notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

const Notification = mongoose.model<NotificationSchemaProps>("Notification", notificationSchema);

export default Notification;
