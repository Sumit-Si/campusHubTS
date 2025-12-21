import { ResultGrade, ResultGradeEnum } from "../constants";

/**
 * Calculate grade based on marks (out of 100)
 * Standard grading scale:
 * O: 90-100
 * A: 80-89
 * B: 70-79
 * C: 60-69
 * D: 50-59
 * E: 40-49
 * F: 0-39
 */
export const calculateGrade = (marks: number): ResultGrade => {
    if (marks >= 90) return ResultGradeEnum.O;
    if (marks >= 80) return ResultGradeEnum.A;
    if (marks >= 70) return ResultGradeEnum.B;
    if (marks >= 60) return ResultGradeEnum.C;
    if (marks >= 50) return ResultGradeEnum.D;
    if (marks >= 40) return ResultGradeEnum.E;
    return ResultGradeEnum.F;
};


