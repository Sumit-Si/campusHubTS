import z from "zod"
import { UserSchemaProps } from "../types/common.types"
import { AvailableMaterialTypes, AvailableUserRoles, MaterialTypesEnum, UserRolesEnum } from "../constants"

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


// ----- Admin Validations -----
const updateUserRoleByIdValidator = z.object({
    role: z.enum(AvailableUserRoles)
        .default(UserRolesEnum.STUDENT)
})

const userIdParamValidator = z.object({
    id: z.string()
        // Mongo ObjectId pattern
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user id")
});


// ----- Course Validations -----
const createCourseValidator = z.object({
    title: z.string()
        .nonempty("Title is required")
        .min(5, "Title must be at least 5 characters long")
        .max(100, "Title must be at most 100 characters long")
        .trim(),

    content: z.string()
        .min(20, "Content must be at least 20 characters long")
        .max(5000, "Content must be at most 5000 characters long")
        .trim()
        .optional(),

    priceInPaise: z.number()
        .int("Price must be an integer")
        .min(0, "Price must be at least 0 or more")

});


// ----- Course Material Validations -----
const createMaterialValidator = z.object({
    name: z.string()
        .nonempty("Name is required")
        .min(5, "Name must be at least 5 characters long")
        .max(200, "Name must be at most 200 characters long")
        .trim(),

    description: z.string()
        .min(20, "Description must be at least 20 characters long")
        .max(1000, "Description must be at most 1000 characters long")
        .trim()
        .optional(),

    type: z.enum(AvailableMaterialTypes)
        .default(MaterialTypesEnum.TEXT)
        .optional(),

    content: z.string()
        .min(20, "Content must be at least 20 characters long")
        .max(5000, "Content must be at most 5000 characters long")
        .trim()
        .optional(),

    tags: z.union([
        z.string()
            .transform((val) => val.split(",").map((tag) => tag.trim())),
        z.array(z.string())
    ]).optional(),

    order: z.coerce
        .number()
        .int("Order must be an integer")
        .min(1, "Order must be at least 1 or more"),

    duration: z.coerce
        .number()
        .int()
        .positive()
        .optional(),

    isPreview: z.boolean()
        .default(false)
        .optional(),

    published: z.boolean()
        .default(false)
        .optional(),

});

export {
    registerValidator,
    loginValidator,
    apiKeyValidator,
    updateUserRoleByIdValidator,
    userIdParamValidator,
    createCourseValidator,
    createMaterialValidator,
}