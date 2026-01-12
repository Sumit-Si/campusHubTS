import { Types } from "mongoose";
import { type UserSchemaProps } from "./common.types";

export type CreateUserRequestBody = Omit<UserSchemaProps, "avatar" | "refreshToken">;

export type UserLoginAction = Pick<UserSchemaProps, "email" | "password">;

export type CookieOptions = {
    httpOnly: boolean,
    secure: boolean,
    sameSite: "lax" | "strict" | "none",
    maxAge?: number,
}

export type ApiKeyScheamProps = {
    key: string;
    expiresAt?: Date;
    createdBy: Types.ObjectId;
    institution: Types.ObjectId;
    isDeleted: boolean;
    description?: string;
}