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
export type AnnouncementStatusType = "draft" | "global";
export type AnnouncementTargetType = "course_students" | "department_students" |
  "all_users" | "admins_only";
export type AnnouncementTypesType = "info" | "warning" | "event";

export const AnnouncementStatusEnum = {
    DRAFT: "draft",
    GLOBAL: "global",
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

export const DB_NAME = "campusHubTS" as const;