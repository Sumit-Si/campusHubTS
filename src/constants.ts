type WhitelistOrigin = string[];

export const WHITELIST_ORIGINS: WhitelistOrigin = [
    "http://localhost:5173",
    "http://localhost:5174",
];

export type UserRole = "admin" | "faculty" | "student";

export const UserRolesEnum = {
    ADMIN: "admin",
    FACULTY: "faculty",
    STUDENT: "student",
} as const;

export const AvailableUserRoles = Object.values(UserRolesEnum) as readonly UserRole[];

export type MaterialType = "text" | "video" | "pdf" | "article";

export const MaterialTypesEnum = {
    TEXT: "text",
    VIDEO: "video",
    PDF: "pdf",
    ARTICLE: "article",
} as const;

export const AvailableMaterialTypes = Object.values(MaterialTypesEnum) as readonly MaterialType[];

// Enrollment constants
export type EnrollmentStatus = "active" | "completed" | "dropped";

export const EnrollmentStatusEnum = {
    ACTIVE: "active",
    COMPLETED: "completed",
    DROPPED: "dropped",
} as const;

export const AvailableEnrollmentStatus = Object.values(EnrollmentStatusEnum) as readonly EnrollmentStatus[];

// Announcement constants
export type AnnouncementStatusType = "draft" | "published";
export type AnnouncementTargetType = "course_students" | "department_students" |
    "all_users" | "admins_only";
export type AnnouncementTypesType = "info" | "warning" | "event";

export const AnnouncementStatusEnum = {
    DRAFT: "draft",
    PUBLISHED: "published",
} as const;

export const AvailableAnnouncementStatus = Object.values(AnnouncementStatusEnum) as readonly AnnouncementStatusType[];

export const AnnouncementTargetEnum = {
    COURSE_STUDENTS: "course_students",
    DEPARTMENT_STUDENTS: "department_students",
    ALL_USERS: "all_users", // admin only
    ADMINS_ONLY: "admins_only",
} as const;

export const AvailableAnnouncementTargetStatus = Object.values(AnnouncementTargetEnum) as readonly AnnouncementTargetType[];

export const AnnouncementTypesEnum = {
    INFO: "info",
    WARNING: "warning",
    EVENT: "event",
} as const;

export const AvailableAnnouncementTypes = Object.values(AnnouncementTypesEnum) as readonly AnnouncementTypesType[];

// Notification constants
export type NotificationType = "announcement" | "result" | "assessment" | "submission";

export const NotificationTypeEnum = {
    ANNOUNCEMENT: "announcement",
    RESULT: "result",
    ASSESSMENT: "assessment",
    SUBMISSION: "submission",
} as const;

export const AvailableNotificationTypes = Object.values(NotificationTypeEnum) as readonly string[];

// Notification priority levels
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export const NotificationPriorityEnum = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    URGENT: "urgent",
} as const;

export const AvailableNotificationPriorities = Object.values(NotificationPriorityEnum) as readonly NotificationPriority[];

// Submission constants
export type SubmissionStatus = "draft" | "submitted" | "graded" | "late";

export const SubmissionStatusEnum = {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    GRADED: "graded",
    LATE: "late",
} as const;

export const AvailableSubmissionStatus = Object.values(SubmissionStatusEnum) as readonly SubmissionStatus[];

// Result constants
export type ResultGrade = "O" | "A" | "B" | "C" | "D" | "E" | "F";

export const ResultGradeEnum = {
    O: "O",
    A: "A",
    B: "B",
    C: "C",
    D: "D",
    E: "E",
    F: "F",
} as const;

export const AvailableResultGrades = Object.values(ResultGradeEnum) as readonly ResultGrade[];

export const DB_NAME = "campusHubTS" as const;