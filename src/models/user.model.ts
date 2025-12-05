import mongoose, { Schema } from "mongoose";
import { AvailableUserRoles, UserRolesEnum, type UserRole } from "../constants";
import bcrypt from "bcryptjs";
import { NextFunction } from "express";

export type UserSchemaProps = {
    username: string;
    fullName?: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
    refreshToken?: string;
}

const userSchema = new Schema<UserSchemaProps>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullName: {
        type: String,
        required: false,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: AvailableUserRoles,
        default: UserRolesEnum.STUDENT,
    },
    avatar: {
        type: String,
    },
    refreshToken: {
        type: String,
    }
}, {
    timestamps: true,
});


const User = mongoose.model<UserSchemaProps>("User", userSchema);


// hooks
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);

    // next();

});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
}




export default User;