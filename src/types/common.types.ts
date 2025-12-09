import { Document } from "mongoose";
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