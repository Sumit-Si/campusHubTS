import { Types } from "mongoose";
import Notification from "../models/notification.model";
import Enrollment from "../models/enrollment.model";
import { AnnouncementTargetEnum, AnnouncementTargetType, NotificationTypeEnum, UserRolesEnum } from "../constants";
import User from "../models/user.model";
import { logger } from "../config/winston";

export type AnnouncementNotification = {
    courseId?: Types.ObjectId;
    announcementId: Types.ObjectId;
    creatorId: Types.ObjectId;
    target?: AnnouncementTargetType;
    announcementTitle: string;
    expiresAt?: Date | null;
}

const createAnnouncementNotification = async ({ courseId, announcementId, creatorId, expiresAt, target, announcementTitle }: AnnouncementNotification) => {
    logger.info("creating announcement notification");
    let recipients: Types.ObjectId[] = [];

    if (courseId) {
        const enrolledUsers = await Enrollment.find({
            course: courseId,
            deletedAt: null,
        }).select("user");

        console.log("enrolled users: ", enrolledUsers);

        enrolledUsers.map(u => recipients.push(u.user));
    }

    // For admin
    else if (target === AnnouncementTargetEnum.ALL_USERS) {

        const users = await User.find({
            deletedAt: null,
        }).select("_id");

        users.map(u => recipients.push(u._id));
    }

    else if (target === AnnouncementTargetEnum.FACULTY_ONLY) {
        const admins = await User.find({
            role: UserRolesEnum.FACULTY,
            deletedAt: null,
        }).select("_id");

        admins.map(u => recipients.push(u._id));
    }
    else {
        recipients = [creatorId];
    }

    if (recipients.length === 0) return;

    const notificationData = recipients.map(recipient => ({
        message: `New announcement: ${announcementTitle}`,
        creator: creatorId,
        type: NotificationTypeEnum.ANNOUNCEMENT,
        recipients: [recipient],
        isRead: false,
        expiresAt: expiresAt || null,
    }));

    const BATCH_SIZE = 100;
    try {
        for (let i = 0; i < notificationData.length; i += BATCH_SIZE) {
            const batch = notificationData.slice(i, i + BATCH_SIZE);
            console.log("batch: ", batch);

            await Notification.insertMany(batch, { ordered: false });
        }
    } catch (error) {
        console.log("Error creating notification: ", error);
        throw error;
    }

};
export {
    createAnnouncementNotification,
}