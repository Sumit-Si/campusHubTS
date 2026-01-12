import { Document, Types } from "mongoose";
import { AnnouncementStatusType, AnnouncementTargetType, AnnouncementTypesType, EnrollmentStatus, MaterialType, NotificationPriority, NotificationType, ResultGrade, SubmissionStatus, UserRole } from "../constants";

export interface UserSchemaProps extends Document  {
    username: string;
    fullName?: string;
    email: string;
    password: string;
    role: UserRole;
    institution?: Types.ObjectId;
    avatar?: string;
    refreshToken?: string;
    deletedAt: Date | null;
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
    institution: Types.ObjectId;
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
    institution: Types.ObjectId;
    course: Types.ObjectId;
    isPreview: boolean;     // Free preview or not
    published: boolean;     // Published or not [Draft Vs Published]
    deletedAt: Date | null;
}

// Enrollment Schema Types
export type EnrollmentSchemaProps = {
    user: Types.ObjectId;
    course: Types.ObjectId;
    institution: Types.ObjectId;
    role: UserRole;
    // enrolledAt: Date;
    status: EnrollmentStatus;
    remarks?: string;
    deletedAt: Date | null;
}

// Announcement Schema Types
export type AnnouncementSchemaProps = {
    title: string;
    message: string;
    type: AnnouncementTypesType;
    course?: Types.ObjectId;
    creator: Types.ObjectId;
    institution: Types.ObjectId;
    publishedAt?: Date;
    expiresAt?: Date;
    attachments?: string[];
    target: AnnouncementTargetType;
    status: AnnouncementStatusType;
    deletedAt: Date | null;
};

// Notification Schema Types
export type NotificationMetadata = {
    announcementId?: Types.ObjectId;
    resultId?: Types.ObjectId;
    assessmentId?: Types.ObjectId;
    submissionId?: Types.ObjectId;
    courseId?: Types.ObjectId;
    // Additional context for message templates
    [key: string]: any;
};

export type NotificationSchemaProps = {
    message: string;
    creator: Types.ObjectId;
    institution: Types.ObjectId;
    type: NotificationType;
    recipients: Types.ObjectId[];
    metadata?: NotificationMetadata;
    priority?: NotificationPriority;
    expiresAt?: Date;
    isRead: boolean;
    readAt?: Date;
    deletedAt: Date | null;
}

// Submission Schema Types
export type SubmissionSchemaProps = {
    user: Types.ObjectId;
    assessment: Types.ObjectId;
    institution: Types.ObjectId;
    submissionDate: Date | null;
    submissionFiles?: string[];
    marks?: number;  // Optional - only set after grading
    feedback?: string;
    status: SubmissionStatus;
    result?: Types.ObjectId;  // Reference to Result after grading
    deletedAt: Date | null;
}

// Result Schema Types
export type ResultSchemaProps = {
    enrollment: Types.ObjectId;
    assessment: Types.ObjectId;  // Reference to Assessment
    submission: Types.ObjectId;  // Reference to Submission
    course: Types.ObjectId;
    user: Types.ObjectId;
    creator: Types.ObjectId;
    institution: Types.ObjectId;
    marks: number;
    grade: ResultGrade;
    academicYear: number;
    remarks?: string;
    deletedAt?: Date | null;
}