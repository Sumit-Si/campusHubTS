import mongoose, { Schema } from "mongoose";
import { CourseSchemaProps } from "../types/common.types";


const courseSchema = new Schema<CourseSchemaProps>({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        trim: true,
    },
    materials: [
        {
            type: Schema.Types.ObjectId,
            ref: "Material",
        }
    ],
    priceInPaise: {
        type: Number,
        required: true,
        min: 0,     // avoid negative prices and more e.g: -234
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    deletedAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
});

courseSchema.index({ title: 1, deletedAt: 1 });
courseSchema.index({ creator: 1, deletedAt: 1 });
courseSchema.index({ title: "text" });


const Course = mongoose.model<CourseSchemaProps>("Course", courseSchema);

export default Course; 