import { Document, Types } from "mongoose";
import { AnnouncementStatusType, AnnouncementTargetType, AnnouncementTypesType, EnrollmentStatus, MaterialType, NotificationType, UserRole } from "../constants";

export interface UserSchemaProps extends Document  {
    username: string;
    fullName?: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
    refreshToken?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

export type UserDocument = {
    _id: Types.ObjectId;
    username: string;
    fullName?: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export type GetRequestPayloads = {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: string;
    createdBy?: string;
};

// Course Schema Types
export type CourseSchemaProps = {
    title: string;
    content: string;
    materials?: Types.ObjectId[];
    priceInPaise: number;
    creator: Types.ObjectId;
    deletedAt: Date | null;
}

// Material Schema Types
export interface MaterialFileUpload {
    fileUrl: string;
    fileType: string;
    size: number;
    publicId?: string;
}

export type MaterialSchemaProps = {
    name: string;
    description?: string;
    type: MaterialType;
    content?: string;       // // markdown / html (for articles)
    uploadFiles?: MaterialFileUpload[];
    tags?: string[];
    order: number;
    duration?: number;
    creator: Types.ObjectId;
    course: Types.ObjectId;
    isPreview: boolean;     // Free preview or not
    published: boolean;     // Published or not [Draft Vs Published]
    deletedAt: Date | null;
}

export type EnrollmentSchemaProps = {
    user: Types.ObjectId;
    course: Types.ObjectId;
    role: UserRole;
    // enrolledAt: Date;
    status: EnrollmentStatus;
    remarks?: string;
    deletedAt: Date | null;
}

export type AnnouncementSchemaProps = {
    title: string;
    message: string;
    type: AnnouncementTypesType;
    course?: Types.ObjectId;
    creator: Types.ObjectId;
    publishedAt?: Date;
    expiresAt?: Date;
    attachments?: string[];
    target: AnnouncementTargetType;
    status: AnnouncementStatusType;
    deletedAt: Date | null;
};


export type NotificationSchemaProps = {
    message: string;
    creator: Types.ObjectId;
    type: NotificationType;
    recipients: Types.ObjectId[];
    announcementId?: Types.ObjectId;
    isRead: boolean;
    deletedAt: Date | null;
}