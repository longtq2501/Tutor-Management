package com.tutor_management.backend.modules.submission.service;

import com.tutor_management.backend.modules.submission.dto.request.CreateSubmissionRequest;
import com.tutor_management.backend.modules.submission.dto.request.GradeSubmissionRequest;
import com.tutor_management.backend.modules.submission.dto.response.SubmissionIdentityReconcileResponse;
import com.tutor_management.backend.modules.submission.dto.response.SubmissionListItemResponse;
import com.tutor_management.backend.modules.submission.dto.response.SubmissionResponse;

import java.util.List;

/**
 * Service interface for managing student submissions.
 * Handles draft saving, final submission, auto-grading coordination, and tutor evaluation.
 */
public interface SubmissionService {
    
    /**
     * Records a draft state for a student's attempt. 
     * Allows students to save progress without triggering the evaluation phase.
     */
    SubmissionResponse saveDraft(CreateSubmissionRequest request, String studentId);
    
    /**
     * Finalizes a student's attempt. 
     * Triggers the auto-grading sequence for MCQ items and notifies relevant tutors.
     */
    SubmissionResponse submit(CreateSubmissionRequest request, String studentId);
    
    /**
     * Retrieves full submission details including individual answers.
     */
    SubmissionResponse getSubmission(String id);
    
    /**
     * Finds the latest attempt record for a specific student on a given exercise.
     */
    SubmissionResponse getSubmissionByExerciseAndStudent(String exerciseId, String studentId);
    
    /**
     * Aggregates all attempts for a specific exercise (Administrative view).
     */
    List<SubmissionListItemResponse> listSubmissionsByExercise(String exerciseId);
    
    /**
     * Retrieves all historically submitted work for a specific student.
     */
    List<SubmissionResponse> listSubmissionsByStudent(String studentId);
    
    /**
     * Records tutor-provided grades and feedback for essay/written responses.
     */
    SubmissionResponse gradeSubmission(String submissionId, GradeSubmissionRequest request);

    /**
     * Reconciles duplicate submissions created under mixed student identity keys
     * (student profile id vs user account id), preserving the best attempt per exercise.
     */
    SubmissionIdentityReconcileResponse reconcileStudentIdentitySubmissions(Long studentProfileId, boolean dryRun);
}
