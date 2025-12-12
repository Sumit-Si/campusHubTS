import { Document, Types } from "mongoose";
import { UserRole } from "../constants";

export interface UserSchemaProps extends Document  {
    username: string;
    fullName?: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
    refreshToken?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

export type UserDocument = {
    _id: Types.ObjectId;
    username: string;
    fullName?: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export type GetRequestPayloads = {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: string;
};