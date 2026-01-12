import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import Institution, { InstitutionSchemaProps } from "../models/institution.model";
import { GetRequestPayloads } from "../types/common.types";
import { QueryFilter, Types } from "mongoose";
import { InstitutionStatus } from "../constants";

export type CreateInstitutionRequestBody = {
    name: string;
    code: string;
    academicYear: number;
    email: string;
    status: InstitutionStatus;
}

const createInstitution = asyncHandler(async (req, res) => {
    const { name, code, academicYear, email, status } = req.body as CreateInstitutionRequestBody;

    const existingInstitute = await Institution.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        code,
        deletedAt: null,
    }).select("_id");

    if (existingInstitute) {
        throw new ApiError({
            statusCode: 400,
            message: "Institute already exists",
        });
    }

    const institute = await Institution.create({
        name,
        code,
        academic: {
            currentYear: academicYear.toString(),
        },
        email,
        creator: req.user?._id,
        status,
    });

    const createdInstitute = await Institution.findById(institute._id)
        .populate("creator", "username fullName avatar");

    if (!createdInstitute) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while creating institute",
        });
    }

    res.status(201)
        .json(new ApiResponse({
            statusCode: 201,
            data: createdInstitute,
            message: "Institution created successfully",
        }));
});

const getInstitutions = asyncHandler(async (req, res) => {
    const { page: rawPage = "1", limit: rawLimit = "10", order = "asc", sortBy = "createdAt", search } = req.query as unknown as GetRequestPayloads & { status: InstitutionStatus };

    let page = Number(rawPage);
    let limit = Number(rawLimit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;

    const filters: QueryFilter<InstitutionSchemaProps> = { deletedAt: null };

    if (search && typeof search === "string") filters.name = { $regex: search, $options: "i" };
    if (status && typeof status === "string") filters.status = status;

    const institutions = await Institution.find(filters)
        .populate("creator", "username fullName avatar")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

    const totalInstitutions = await Institution.countDocuments(filters);
    const totalPages = Math.ceil(totalInstitutions / limit);

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            data: {
                institutions,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit,
                    totalInstitutions,
                }
            },
            message: "Institutions fetched successfully",
        }));
});

const getInstitutionById = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const institutionObjectId = new Types.ObjectId(id);

    const institution = await Institution.findOne({
        _id: institutionObjectId,
        deletedAt: null,
    })
        .populate("creator", "username fullName avatar");

    if (!institution) {
        throw new ApiError({
            statusCode: 404,
            message: "Institution not exists",
        });
    }

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            data: institution,
            message: "Institution fetched successfully",
        }));
});

const updateInstitutionById = asyncHandler(async (req, res) => {
    const {id} = req.params as {id: string};

    const {status, academicYear, name} = req.body as {name: string,status: InstitutionStatus, academicYear: string};

    const institutionObjectId = new Types.ObjectId(id);

    const institution = await Institution.findOne({
        _id: institutionObjectId,
        deletedAt: null,
    }).select("_id");

    if (!institution) {
        throw new ApiError({
            statusCode: 404,
            message: "Institution not exists",
        });
    }

    const updateInstitution = await Institution.findByIdAndUpdate(institutionObjectId, {
        status,
        academic: {
            currentYear: academicYear,
        },
        name,
    }, { new: true });

    if (!updateInstitution) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while updating institution",
        });
    }

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            data: updateInstitution,
            message: "Institution updated successfully",
        }));
});

const deleteInstitutionById = asyncHandler(async (req, res) => {
    const {id} = req.params as {id: string};

    const institutionObjectId = new Types.ObjectId(id);

    const institution = await Institution.findOne({
        _id: institutionObjectId,
        deletedAt: null,
    }).select("_id");

    if (!institution) {
        throw new ApiError({
            statusCode: 404,
            message: "Institution not exists",
        });
    }

    const deleteInstitution = await Institution.findByIdAndUpdate(institutionObjectId, {
        deletedAt: new Date(),
    }, { new: true });

    if (!deleteInstitution) {
        throw new ApiError({
            statusCode: 500,
            message: "Problem while deleting institution",
        });
    }

    res.status(200)
        .json(new ApiResponse({
            statusCode: 200,
            data: deleteInstitution,
            message: "Institution deleted successfully",
        }));
});


export {
    createInstitution,
    getInstitutions,
    getInstitutionById,
    updateInstitutionById,
    deleteInstitutionById,
}