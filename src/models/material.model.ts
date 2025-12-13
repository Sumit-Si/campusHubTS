import mongoose, {Schema} from "mongoose";
import { AvailableMaterialTypes, MaterialType, MaterialTypesEnum } from "../constants";

interface MaterialFileUpload {
    fileUrl: string;
    fileType: string;
    size: number;
    publicId?: string;
}

type MaterialSchemaProps = {
    name: string;
    description?: string;
    type: MaterialType;
    content?: string;       // // markdown / html (for articles)
    uploadFiles?: MaterialFileUpload[];
    tags?: string[];
    order: number;
    duration?: number;
    creator: Schema.Types.ObjectId;
    course: Schema.Types.ObjectId;
    isPreview: boolean;     // Free preview or not
    published: boolean;     // Published or not [Draft Vs Published]
    deletedAt: Date | null;
}

const materialSchema = new Schema<MaterialSchemaProps>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        enum: AvailableMaterialTypes,
        default: MaterialTypesEnum.TEXT,
    },
    content: {
        type: String,
        trim: true,
    },
    uploadFiles: [
        {
            fileUrl: { type: String, required: true },
            fileType: String,
            size: Number,
            publicId: String,
        }
    ],
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    tags: [String],
    order: {
        type: Number,
        required: true,
    },
    duration: {
        type: Number,
    },
    isPreview: {
        type: Boolean,
        default: false,
    },
    published: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

materialSchema.index({ course: 1, order: 1}, {unique: true});
materialSchema.index({ course: 1, name: 1}, {unique: true});
materialSchema.index({ course: 1, type: 1});

const Material = mongoose.model<MaterialSchemaProps>("Material", materialSchema);

export default Material;