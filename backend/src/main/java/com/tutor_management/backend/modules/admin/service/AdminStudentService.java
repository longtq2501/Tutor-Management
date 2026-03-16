package com.tutor_management.backend.modules.admin.service;

import com.tutor_management.backend.modules.admin.dto.response.AdminStudentResponse;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service class for managing students in the admin module.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStudentService {

    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;
    private final com.tutor_management.backend.modules.auth.UserRepository userRepository;

    /**
     * Retrieves a paginated list of students based on search criteria.
     *
     * @param search   the search keyword for filtering students by name or phone
     * @param tutorId  the ID of the tutor to filter students by
     * @param active   the active status to filter students by
     * @param pageable the pagination information
     * @return a paginated list of AdminStudentResponse objects
     */
    public Page<AdminStudentResponse> getAllStudents(String search, Long tutorId, Boolean active, Pageable pageable) {
        Page<Student> students = studentRepository.findAdminStudents(search, tutorId, active, pageable);
        
        // Batch fetch tutor names for optimization
        Set<Long> tutorIds = students.getContent().stream()
                .map(Student::getTutorId)
                .collect(Collectors.toSet());
        
        Map<Long, String> tutorNames = tutorRepository.findAllById(tutorIds).stream()
                .collect(Collectors.toMap(Tutor::getId, Tutor::getFullName));

        // Batch fetch student avatars
        List<Long> studentIds = students.getContent().stream().map(Student::getId).toList();
        Map<Long, String> avatarMap = userRepository.findByStudentIdIn(studentIds).stream()
                .filter(u -> u.getAvatarUrl() != null)
                .collect(Collectors.toMap(com.tutor_management.backend.modules.auth.User::getStudentId, com.tutor_management.backend.modules.auth.User::getAvatarUrl));

        return students.map(s -> mapToResponse(s, tutorNames.get(s.getTutorId()), avatarMap.get(s.getId())));
    }

    /**
     * Retrieves a student by their ID.
     *
     * @param id the ID of the student
     * @return an AdminStudentResponse object containing the student's details
     */
    public AdminStudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
        
        String tutorName = tutorRepository.findById(student.getTutorId())
                .map(Tutor::getFullName)
                .orElse("N/A");

        String avatarUrl = userRepository.findByStudentId(id)
                .map(com.tutor_management.backend.modules.auth.User::getAvatarUrl)
                .orElse(null);

        return mapToResponse(student, tutorName, avatarUrl);
    }

    /**
     * Maps a Student entity to an AdminStudentResponse DTO.
     *
     * @param student   the Student entity to map
     * @param tutorName the name of the tutor associated with the student
     * @param avatarUrl the URL of the student's avatar
     * @return an AdminStudentResponse object containing the mapped data
     */
    private AdminStudentResponse mapToResponse(Student student, String tutorName, String avatarUrl) {
        return AdminStudentResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .tutorId(student.getTutorId())
                .tutorName(tutorName)
                .phone(student.getPhone())
                .schedule(student.getSchedule())
                .pricePerHour(student.getPricePerHour())
                .active(student.getActive())
                .totalDebt(studentRepository.calculateTotalDebt(student.getId()))
                .createdAt(student.getCreatedAt().toString())
                .avatarUrl(avatarUrl)
                .build();
    }
}
