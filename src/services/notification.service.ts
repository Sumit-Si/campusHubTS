import { Types } from "mongoose";
import Notification from "../models/notification.model";
import Enrollment from "../models/enrollment.model";
import { NotificationTypeEnum } from "../constants";

type AnnouncementNotificationProps = {
    courseId: Types.ObjectId;
    announcementId: Types.ObjectId;
    creatorId: Types.ObjectId;
};

/**
 * Create notifications for all students enrolled in a course when an announcement is posted.
 *
 * This is a pure service function (no Express req/res), so it can be safely
 * called from controllers, jobs, queues, etc.
 */
const createAnnouncementNotification = async ({
    courseId,
    announcementId,
    creatorId,
}: AnnouncementNotificationProps): Promise<void> => {
    const courseObjectId = new Types.ObjectId(courseId);

    const enrollments = await Enrollment.find({
        course: courseObjectId,
        deletedAt: null,
    }).select("user");

    if (enrollments.length === 0) return;

    const notifications = enrollments.map((enrollment) => ({
        message: "New announcement posted",
        creator: creatorId,
        announcementId,
        recipients: [enrollment.user],
        type: NotificationTypeEnum.ANNOUNCEMENT,
    }));

    await Notification.insertMany(notifications);
};

export { createAnnouncementNotification };