import mongoose, { Schema, Types } from "mongoose";
import { AvailableNotificationTypes, NotificationTypeEnum } from "../constants";
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
    announcementId: {
        type: Schema.Types.ObjectId,
        ref: "Announcement",
    },
    type: {
        type: String,
        enum: AvailableNotificationTypes,
        default: NotificationTypeEnum.ANNOUNCEMENT,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    recipients: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    deletedAt: {
        type: Date,
        default: null,
    }

}, {
    timestamps: true,
});

// Index for faster lookups of notifications for a given recipient by type
notificationSchema.index({ recipients: 1, type: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
