import { Types } from "mongoose";
import Notification from "../models/notification.model";
import Enrollment from "../models/enrollment.model";
import { AnnouncementTargetEnum, AnnouncementTargetType, NotificationType, NotificationTypeEnum, UserRolesEnum } from "../constants";
import User from "../models/user.model";
import { logger } from "../config/winston";
import { ApiError } from "../utils/ApiError";
import { NotificationSchemaProps } from "../types/common.types";

export type AnnouncementNotification = {
    courseId?: Types.ObjectId;
    announcementId: Types.ObjectId;
    creatorId: Types.ObjectId;
    target?: AnnouncementTargetType;
    announcementTitle: string;
    expiresAt?: Date | null;
}

export type NotificationDataProps = {
    title: string;
    courseId?: Types.ObjectId;
    announcementId?: Types.ObjectId;
    creatorId: Types.ObjectId;
    expiresAt?: Date | null;
    type: NotificationType;
    target?: AnnouncementTargetType;
    targetUserIds?: Types.ObjectId[];
}

const createNotification = async ({ courseId, announcementId, creatorId, expiresAt, title, type, targetUserIds, target }: NotificationDataProps) => {
    logger.info("creating notification");

    if ((type === NotificationTypeEnum.RESULT || type === NotificationTypeEnum.SUBMISSION) && targetUserIds?.length === 0) return;

    if (type === NotificationTypeEnum.ANNOUNCEMENT || type === NotificationTypeEnum.ASSESSMENT) {
        if (target === AnnouncementTargetEnum.COURSE_STUDENTS) {
            if (!courseId) {
                throw new ApiError({ statusCode: 400, message: "Course id is required for course students" });
            }

            const enrolledUsers = await Enrollment.find({
                course: courseId,
                deletedAt: null,
            }).select("user").lean();

            targetUserIds = [];
            enrolledUsers.map((u) => targetUserIds?.push(u.user));
        }
        else if (target === AnnouncementTargetEnum.ALL_USERS) {
            const users = await User.find({
                deletedAt: null,
            }).select("_id").lean();

            targetUserIds = [];
            users.map((u) => targetUserIds?.push(u._id));
        }
        else if (target === AnnouncementTargetEnum.FACULTY_ONLY) {
            const users = await User.find({
                role: UserRolesEnum.FACULTY,
                deletedAt: null,
            }).select("_id").lean();

            targetUserIds = [];
            users.map((u) => targetUserIds?.push(u._id));
        }
        else {
            targetUserIds = [creatorId]
        }
    }

    if (targetUserIds?.length === 0) return;

    const notifications = targetUserIds?.map((recipient) => ({
        message: `New Notification: ${title}`,
        creator: creatorId,
        type,
        recipients: [recipient],
        expiresAt,
        isRead: false,
    }));

    if (!notifications) return;

    try {
        const BATCH_SIZE = 100;
        for (let i = 0; i < notifications?.length; i += BATCH_SIZE) {
            const batch = notifications?.slice(i, i + BATCH_SIZE);
            console.log("Batch: ", batch);

            await Notification.insertMany(batch, { ordered: false });
        }
    } catch (error) {
        logger.error("Error creating notification", error);
        throw error;
    }

}

/**
 * 
 * @deprecated
 */
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
    createNotification,
}