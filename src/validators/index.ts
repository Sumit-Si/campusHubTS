import z from "zod"
import { UserSchemaProps } from "../types/common.types"
import { AvailableUserRoles, UserRolesEnum } from "../constants"

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
})


export {
    registerValidator,
    loginValidator,
}