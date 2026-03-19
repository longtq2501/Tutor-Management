package com.tutor_management.backend.modules.submission.service;

import com.tutor_management.backend.modules.submission.entity.Submission;

/**
 * Service for automated evaluation of student attempts.
 * Primarily handles logic for Multiple Choice Questions (MCQ).
 */
public interface AutoGradingService {
    
    /**
     * Executes auto-grading logic and updates the submission's component scores.
     * 
     * @param submissionId Unique identifier of the attempt record.
     * @return The calculated score for MCQ items.
     */
    double gradeSubmission(String submissionId);

    /**
     * Executes auto-grading logic on a hydrated submission entity.
     * Avoids redundant database lookups when called from a parent transaction.
     */
    double gradeSubmission(Submission submission);
}
