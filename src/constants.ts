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

export const DB_NAME = "campusHubTS" as const;