import z from "zod"
import { UserSchemaProps } from "../types/common.types"
import { AvailableUserRoles, UserRolesEnum } from "../constants"

// ----- Auth Validations -----
const registerValidator = z.object({
    username: z.string()
        .nonempty("Username is required")
        .lowercase("Username must be in lowercase")
        .min(3, "Username must be at least 3 characters long")
        .max(50, "Username must be at most 50 characters long")
        .trim(),

    email: z.string()
        .nonempty("Email is required")
        .email("Invalid email address")
        .lowercase("Email must be in lowercase")
        .trim(),

    password: z.string()
        .nonempty("Password is required")
        .min(8, "Password must be at least 8 characters long")
        .max(20, "Password must be at most 20 characters long")
        .trim(),

    fullName: z.preprocess((val) => val === "" ? undefined : val, z.string()
        .trim()
        .min(3, "Full name must be at least 3 characters long")
        .max(50, "Full name must be at most 50 characters long")
        .optional()
    ),

    role: z.enum(AvailableUserRoles)
        .optional()
        .default(UserRolesEnum.STUDENT),
});

const loginValidator = z.object({
    email: z.email("Invalid email address")
        .nonempty("Email is required")
        .lowercase("Email must be in lowercase")
        .trim(),

    password: z.string()
        .nonempty("Password is required")
        .min(8, "Password must be at least 8 characters long")
        .max(20, "Password must be at most 20 characters long")
        .trim(),
});

const apiKeyValidator = z.object({
    expiresAt: z
        .coerce
        .date()
        .refine((val) => new Date(val) > new Date(), "ExpiresAt must be in the future")
        .optional(),

    description: z
        .string()
        .min(20, "Description must be at least 20 characters long")
        .max(1000, "Description must be at most 1000 characters long")
        .trim()
        .optional(),
});


export {
    registerValidator,
    loginValidator,
    apiKeyValidator,
}