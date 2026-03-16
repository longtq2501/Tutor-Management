package com.tutor_management.backend.modules.submission.service;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.exercise.domain.Option;
import com.tutor_management.backend.modules.exercise.domain.Question;
import com.tutor_management.backend.modules.exercise.domain.QuestionType;
import com.tutor_management.backend.modules.exercise.repository.QuestionRepository;
import com.tutor_management.backend.modules.submission.entity.StudentAnswer;
import com.tutor_management.backend.modules.submission.entity.Submission;
import com.tutor_management.backend.modules.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Standard implementation of {@link AutoGradingService}.
 * Compares student selections against predefined correct options.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AutoGradingServiceImpl implements AutoGradingService {
    
    private final SubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;
    
    // Auto-grades a submission by its ID, returning the total MCQ score.
    @Override
    public int gradeSubmission(String submissionId) {
        log.info("🤖 Auto-grading submission: {}", submissionId);
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp với ID: " + submissionId));
        
        return gradeSubmission(submission);
    }

    // Core grading logic that processes the submission and updates scores.
    @Override
    public int gradeSubmission(Submission submission) {
        log.debug("Auto-grading entity attempt for ID: {}", submission.getId());

        List<Question> questions = questionRepository.findByExerciseIdWithDetails(submission.getExerciseId());
        
        Map<String, String> correctMap = new HashMap<>();
        Map<String, Integer> pointMap = new HashMap<>();
        
        for (Question q : questions) {
            if (q.getType() == QuestionType.MCQ && q.getOptions() != null) {
                for (Option opt : q.getOptions()) {
                    if (opt.getIsCorrect()) {
                        correctMap.put(q.getId(), opt.getLabel());
                        pointMap.put(q.getId(), q.getPoints());
                        break;
                    }
                }
            }
        }
        
        int mcqTotal = 0;
        for (StudentAnswer ans : submission.getAnswers()) {
            if (correctMap.containsKey(ans.getQuestionId())) {
                String correct = correctMap.get(ans.getQuestionId());
                String student = ans.getSelectedOption();
                
                boolean isMatch = Objects.equals(
                        safeTrim(correct), 
                        safeTrim(student)
                );

                if (isMatch) {
                    ans.setIsCorrect(true);
                    int pts = pointMap.getOrDefault(ans.getQuestionId(), 0);
                    ans.setPoints(pts);
                    mcqTotal += pts;
                } else {
                    ans.setIsCorrect(false);
                    ans.setPoints(0);
                }
            }
        }
        
        submission.setMcqScore(mcqTotal);
        submission.calculateTotalScore();
        
        // Finalize state
        submissionRepository.save(submission);
        log.info("Auto-grading complete for {}. Score: {}", submission.getId(), mcqTotal);
        return mcqTotal;
    }

    private String safeTrim(String s) {
        return s == null ? "" : s.trim().toUpperCase();
    }
}
