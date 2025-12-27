import { Types } from "mongoose";
import Notification from "../models/notification.model";
import Enrollment from "../models/enrollment.model";
import { NotificationTypeEnum } from "../constants";

export type AnnouncementNotification = {
    courseId: Types.ObjectId;
    announcementId: Types.ObjectId;
    creatorId: Types.ObjectId;
    message: string;
    expiresAt?: Date | null;
}

const createAnnouncementNotification = async ({ courseId, announcementId, creatorId, message, expiresAt }: AnnouncementNotification) => {

    let recipients: Types.ObjectId[] = [];

    const enrolledUsers = await Enrollment.find({
        course: courseId,
        deletedAt: null,
    }).select("user");

    console.log("enrolled users: ", enrolledUsers);

    enrolledUsers.map(u => recipients.push(u.user));

    if (recipients.length === 0) return;

    const notificationData = recipients.map(recipient => ({
        message,
        creator: creatorId,
        type: NotificationTypeEnum.ANNOUNCEMENT,
        recipients: [recipient],
        isRead: false,
        expiresAt: expiresAt || null,
    }));

    const BATCH_SIZE = 100;
    for (let i = 0; i < notificationData.length; i += BATCH_SIZE) {
        const batch = notificationData.slice(i, i + BATCH_SIZE);
        console.log("batch: ", batch);
        
        await Notification.insertMany(batch, { ordered: false });
    }
};
export {
    createAnnouncementNotification,
}