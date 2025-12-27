import { QueryFilter, Types } from "mongoose";
import { AnnouncementStatusEnum, AnnouncementStatusType, AnnouncementTargetEnum, AnnouncementTargetType, AnnouncementTypesType, UserRolesEnum } from "../constants";
import Announcement from "../models/announcement.model";
import Course from "../models/course.model";
import { AnnouncementSchemaProps, GetRequestPayloads } from "../types/common.types";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { createAnnouncementNotification } from "../services/notification.service";

type CreateAnnouncementRequestBody = {
    title: string;
    message: string;
    type?: AnnouncementTypesType;
    courseId?: string;
    publishedAt?: Date;
    expiresAt?: Date;
    target?: AnnouncementTargetType;
    status?: "draft";
}

const createAnnouncement = asyncHandler(async (req, res) => {
    const { title, message, type, courseId, expiresAt, target, status } = req.body as CreateAnnouncementRequestBody;

    if (!courseId && req.user?.role === UserRolesEnum.FACULTY) {
        throw new ApiError({ statusCode: 400, message: "courseId is required for faculty" });
    }

    if (courseId) {
        const courseExists = await Course.findOne({
            _id: courseId,
            deletedAt: null,
        }).select("_id creator");

        if (!courseExists) {
            throw new ApiError({ statusCode: 404, message: "Course not exists" });
        }

        if (req.user?.role === UserRolesEnum.FACULTY) {
            if (!courseExists.creator.equals(req.user?._id)) {
                throw new ApiError({ statusCode: 403, message: "Forbidden: not course owner" });
            }

            if (target !== AnnouncementTargetEnum.COURSE_STUDENTS) {
                throw new ApiError({ statusCode: 400, message: "Faculty can only target course students" });
            }
        }
    }

    const announcement = await Announcement.create({
        title,
        message,
        type,
        course: courseId ? courseId : undefined,
        creator: req.user?._id,
        expiresAt,
        target,
        status,
    });

    const createdAnnouncement = await Announcement.findById(announcement?._id)
        .select("-expiresAt")
        .populate("creator", "username fullName avatar")
        .populate("course", "title creator");

    if (!createdAnnouncement) {
        throw new ApiError({ statusCode: 500, message: "Problem while creating announcement" });
    }

    res.status(201)
        .json(new ApiResponse({
            statusCode: 201,
            message: "Announcement created successfully",
            data: createdAnnouncement,
        }));
});

const publishAnnouncementById = asyncHandler(async (req, res) => {
    const { status, publishedAt } = req.body as Pick<CreateAnnouncementRequestBody, "status" | "courseId" | "publishedAt">
    const { id } = req.params as { id: string };

    const announcement = await Announcement.findOne({
        _id: id,
        deletedAt: null,
    }).select("title course status");

    if (!announcement) {
        throw new ApiError({ statusCode: 404, message: "Announcement not exists" });
    }

    const announcementObjectId = new Types.ObjectId(id);

    let publishDate: Date | null = null;
    if (!publishedAt) { publishDate = new Date(); }

    if (publishedAt && new Date(publishedAt) < new Date()) {
        throw new ApiError({ statusCode: 400, message: "PublishedAt must be in the future" });
    }

    const publishAnnouncement = await Announcement.findOneAndUpdate(announcementObjectId, {
        status,
        publishedAt: publishedAt ? new Date(publishedAt) : publishDate,
    }, { new: true })
        .populate("creator", "username fullName avatar")
        .populate("course", "title creator");

    if (!publishAnnouncement) {
        throw new ApiError({ statusCode: 500, message: "Problem while publishing announcement" });
    }

    // Queue notifications for students enrolled in the course (async, non-blocking)
    if (publishAnnouncement.course && publishAnnouncement.status === AnnouncementStatusEnum.PUBLISHED) {
        await createAnnouncementNotification({
            courseId: publishAnnouncement.course,
            announcementId: announcementObjectId,
            creatorId: req.user!._id,
            message: publishAnnouncement.message,
        });
    }

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            message: "Announcement published successfully",
            data: publishAnnouncement,
        }));

})

const getAllAnnouncements = asyncHandler(async (req, res) => {
    const {
        page: rawPage = "1",
        limit: rawLimit = "10",
        order = "asc",
        sortBy = "createdAt",
        search,
        createdBy,
        courseId,
    } = req.query as unknown as GetRequestPayloads & { courseId?: string };

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    const filters: QueryFilter<AnnouncementSchemaProps> = { deletedAt: null };

    if (search && typeof search === "string") filters.title = { $regex: search, $options: "i" };
    if (createdBy && typeof createdBy === "string") filters.creator = createdBy;
    if (courseId && typeof courseId === "string") filters.course = courseId;

    const announcements = await Announcement.find(filters)
        .populate("creator", "username fullName avatar")
        .populate("course", "title creator")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

    const totalAnnouncements = await Announcement.countDocuments(filters);
    const totalPages = Math.ceil(totalAnnouncements / limit);

    res.status(200).json(new ApiResponse({
        statusCode: 200,
        message: "Announcements fetched successfully",
        data: {
            announcements,
            metadata: {
                totalPages,
                currentPage: page,
                currentLimit: limit,
                totalAnnouncements,
            }
        },

    }));
});


export {
    createAnnouncement,
    publishAnnouncementById,
    getAllAnnouncements,
}