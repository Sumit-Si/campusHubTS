import { type UserSchemaProps } from "../models/user.model";

export type UserRequestAction = Omit<UserSchemaProps, "avatar" | "refreshToken">;