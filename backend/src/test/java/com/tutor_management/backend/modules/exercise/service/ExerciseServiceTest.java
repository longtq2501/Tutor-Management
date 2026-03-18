package com.tutor_management.backend.modules.exercise.service;

import com.tutor_management.backend.util.SecurityContextUtils;

import com.tutor_management.backend.modules.exercise.domain.AssignmentStatus;
import com.tutor_management.backend.modules.exercise.dto.response.TutorStudentSummaryResponse;
import com.tutor_management.backend.modules.exercise.repository.ExerciseAssignmentRepository;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
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
    @DisplayName("getStudentSummaries should aggregate assignments with submission status")
    void testGetStudentSummariesFilter() {
        // Arrange
        Student student = new Student();
        student.setId(1001L);
        student.setName("Test Student");
        
        List<Student> students = List.of(student);
        Page<Student> studentPage = new PageImpl<>(students, pageable, 1);
        
        when(studentRepository.findByTutorIdAndActiveTrueWithParent(anyLong(), any())).thenReturn(studentPage);
        
        List<Object[]> stats = new ArrayList<>();
        stats.add(new Object[]{student.getId().toString(), com.tutor_management.backend.modules.submission.entity.SubmissionStatus.GRADED, 1L});
        stats.add(new Object[]{student.getId().toString(), com.tutor_management.backend.modules.submission.entity.SubmissionStatus.PENDING, 2L});
        
        when(assignmentRepository.countAssignmentsWithSubmissionStatus(anyList(), anyLong())).thenReturn(stats);
        when(userRepository.findByStudentIdIn(anyList())).thenReturn(List.of());

        // Act
        Page<TutorStudentSummaryResponse> result = exerciseService.getStudentSummaries(tutorId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        TutorStudentSummaryResponse summary = result.getContent().get(0);
        
        assertEquals(1, summary.getGradedCount());
        assertEquals(2, summary.getPendingCount());
        assertEquals(3, summary.getTotalAssigned());
        
        verify(studentRepository).findByTutorIdAndActiveTrueWithParent(eq(tutorId), eq(pageable));
        verify(assignmentRepository).countAssignmentsWithSubmissionStatus(anyList(), eq(tutorId));
    }
}
