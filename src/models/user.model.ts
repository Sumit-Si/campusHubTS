import mongoose, { Schema } from "mongoose";
import { AvailableUserRoles, UserRolesEnum, type UserRole } from "../constants";
import bcrypt from "bcryptjs";
import { UserSchemaProps } from "../types/common.types";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import config from "../config/config";


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
    institution: {
        type: Schema.Types.ObjectId,
        ref: "Institution",
    },
    avatar: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    deletedAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
});


// hooks
userSchema.pre("save", async function () {
    // Allow existing password to remain unchanged on non-password updates
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {

    console.log("accessTokenSec: ", config.ACCESS_TOKEN_SECRET);
    console.log("accessTokenExpiry: ", config.ACCESS_TOKEN_EXPIRY);


    const secret: Secret = config.ACCESS_TOKEN_SECRET;
    const expiresIn = config.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"];

    return jwt.sign({ _id: this._id.toString() }, secret, { expiresIn });
}

userSchema.methods.generateRefreshToken = function () {

    const secret: Secret = config.REFRESH_TOKEN_SECRET;
    const expiresIn = config.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"];

    return jwt.sign({ _id: this._id.toString() }, secret, { expiresIn });
}

const User = mongoose.model<UserSchemaProps>("User", userSchema);


export default User;