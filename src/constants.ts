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

export const DB_NAME = "campusHubTS" as const;