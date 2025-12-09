import { type UserSchemaProps } from "./common.types";

export type UserRequestAction = Omit<UserSchemaProps, "avatar" | "refreshToken">;

export type UserLoginAction = Pick<UserSchemaProps, "email" | "password">;

export type CookieOptions = {
    httpOnly: boolean,
    secure: boolean,
    sameSite: "lax" | "strict" | "none",
    maxAge?: number,
}