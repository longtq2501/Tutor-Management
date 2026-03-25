package com.tutor_management.backend.modules.exercise.service;

import com.tutor_management.backend.modules.exercise.dto.response.TutorStudentSummaryResponse;
import com.tutor_management.backend.modules.exercise.domain.ExerciseAssignment;
import com.tutor_management.backend.modules.exercise.repository.ExerciseAssignmentRepository;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.submission.entity.Submission;
import com.tutor_management.backend.modules.submission.entity.SubmissionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExerciseServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ExerciseAssignmentRepository assignmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.tutor_management.backend.modules.submission.repository.SubmissionRepository submissionRepository;

    @Mock
    private com.tutor_management.backend.util.SecurityContextUtils securityContextUtils;

    @InjectMocks
    private ExerciseServiceImpl exerciseService;

    private Long tutorId = 1L;
    private PageRequest pageable = PageRequest.of(0, 10);

    @Test
    @DisplayName("getStudentSummaries should aggregate deduped assignment statuses")
    void testGetStudentSummariesFilter() {
        // Arrange
        Student student = new Student();
        student.setId(1001L);
        student.setName("Test Student");
        
        List<Student> students = List.of(student);
        Page<Student> studentPage = new PageImpl<>(students, pageable, 1);
        
        when(studentRepository.findByTutorIdAndActiveTrueWithParent(anyLong(), any())).thenReturn(studentPage);
        
        List<ExerciseAssignment> assignments = List.of(
            ExerciseAssignment.builder().exerciseId("ex-1").studentId(student.getId().toString()).build(),
            ExerciseAssignment.builder().exerciseId("ex-2").studentId(student.getId().toString()).build()
        );

        List<Submission> submissions = List.of(
            Submission.builder().exerciseId("ex-1").studentId(student.getId().toString()).status(SubmissionStatus.GRADED).build(),
            Submission.builder().exerciseId("ex-2").studentId(student.getId().toString()).status(SubmissionStatus.SUBMITTED).build()
        );

        when(assignmentRepository.findAllByStudentIdsAndTutorId(anyList(), anyLong())).thenReturn(assignments);
        when(submissionRepository.findByStudentIdAndExerciseIdIn(eq(student.getId().toString()), anyList())).thenReturn(submissions);
        when(userRepository.findByStudentIdIn(anyList())).thenReturn(List.of());

        // Act
        Page<TutorStudentSummaryResponse> result = exerciseService.getStudentSummaries(tutorId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        TutorStudentSummaryResponse summary = result.getContent().get(0);
        
        assertEquals(1, summary.getGradedCount());
        assertEquals(0, summary.getPendingCount());
        assertEquals(1, summary.getSubmittedCount());
        assertEquals(2, summary.getTotalAssigned());
        
        verify(studentRepository).findByTutorIdAndActiveTrueWithParent(eq(tutorId), eq(pageable));
        verify(assignmentRepository).findAllByStudentIdsAndTutorId(anyList(), eq(tutorId));
    }
}
