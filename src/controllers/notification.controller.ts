import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { GetRequestPayloads, NotificationSchemaProps } from "../types/common.types";
import { QueryFilter, Types } from "mongoose";
import Notification from "../models/notification.model";


const getMyNotifications = asyncHandler(async (req, res) => {
    const {
        page: rawPage = "1",
        limit: rawLimit = "10",
        order = "asc",
        sortBy = "createdAt",
        search,
        createdBy,
    } = req.query as unknown as GetRequestPayloads;

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    const filters: QueryFilter<NotificationSchemaProps> = {
        deletedAt: null,
        // Only notifications where the current user is a recipient
        recipients: req.user!._id,
    };

    if (search && typeof search === "string") {
        filters.message = { $regex: search, $options: "i" };
    }

    if (createdBy && typeof createdBy === "string") {
        filters.creator = createdBy;
    }

    try {
        const notifications = await Notification.find(filters)
            .populate("creator", "username fullName avatar")
            .populate("announcementId", "title target")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        const totalNotifications = await Notification.countDocuments(filters);
        const totalPages = Math.ceil(totalNotifications / limit);

        res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Notifications fetched successfully",
                data: {
                    notifications,
                    metadata: {
                        totalPages,
                        currentPage: page,
                        currentLimit: limit,
                        totalNotifications,
                    },
                },
            }),
        );
    } catch (error) {
        throw new ApiError({ statusCode: 500, message: "Problem while fetching notifications" });
    }
});

const getAllUnreadNotifications = asyncHandler(async (req, res) => {
    const {
        page: rawPage = "1",
        limit: rawLimit = "10",
        order = "asc",
        sortBy = "createdAt",
    } = req.query as unknown as GetRequestPayloads;

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    try {
        const notifications = await Notification.find({
            recipients: req.user!._id,
            isRead: false,
            deletedAt: null,
        })
            .populate("creator", "username fullName avatar")
            .populate("announcementId", "title target")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        const totalNotifications = await Notification.countDocuments({
            recipients: req.user!._id,
            isRead: false,
            deletedAt: null,
        });
        const totalPages = Math.ceil(totalNotifications / limit);

        res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Notifications fetched successfully",
                data: {
                    notifications,
                    metadata: {
                        totalPages,
                        currentPage: page,
                        currentLimit: limit,
                        totalNotifications,
                    },
                },
            }),
        );
    } catch (error) {
        throw new ApiError({ statusCode: 500, message: "Problem while fetching notifications" });
    }
});

const updateNotificationById = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const notificationObjectId = new Types.ObjectId(id);

    const notification = await Notification.findOne({
        _id: notificationObjectId,
        deletedAt: null,
    }).select("isRead");

    if (!notification) {
        throw new ApiError({ statusCode: 404, message: "Notification not exists" });
    }

    const updateNotification = await Notification.findByIdAndUpdate(notificationObjectId, {
        isRead: true,
    }, { new: true });

    if (!updateNotification) {
        throw new ApiError({ statusCode: 500, message: "Problem while updating notification" });
    }

    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Notification updated successfully",
            data: updateNotification,
        }),
    );
});

const updateBulkNotifications = asyncHandler(async (req, res) => {
    const { notificationIds } = req.body as { notificationIds: string[] };

    const notificationObjectIds = notificationIds.map(id => new Types.ObjectId(id));

    const updateNotifications = await Notification.updateMany(
        {
            _id: { $in: notificationObjectIds },
            isRead: false,
            
            deletedAt: null,
        },
        {
            $set: {
                isRead: true,
            },
        });

    if (updateNotifications.modifiedCount === 0) {
        throw new ApiError({ statusCode: 404, message: "No notifications found or already marked as read" });
    }

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Notifications marked as read successfully",
            data: {
                modifiedCount: updateNotifications.modifiedCount
            }
        }))
})

export { getMyNotifications, updateNotificationById, updateBulkNotifications, getAllUnreadNotifications };