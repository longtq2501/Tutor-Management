package com.tutor_management.backend.modules.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Event published when an exam/submission has been graded by a tutor.
 */
@Getter
@AllArgsConstructor
@Builder
public class ExamGradedEvent {
    /** ID of the submission that was graded */
    private final String submissionId;
    
    /** ID of the student who owns the exam */
    private final String studentId;
    
    /** ID of the associated exercise */
    private final String exerciseId;
    
    /** Title of the exercise for display in notifications */
    private final String exerciseTitle;
    
    /** The actual score given to the student */
    private final Double score;
}
