package com.tutor_management.backend.service;

//import com.tutor_management.backend.dto.*;
import com.tutor_management.backend.dto.request.StudentRequest;
import com.tutor_management.backend.dto.response.StudentResponse;
import com.tutor_management.backend.entity.*;
import com.tutor_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

// ============= Student Service =============
@Service
@RequiredArgsConstructor
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

    public List<StudentResponse> getAllStudents() {
        List<Student> students = studentRepository.findAllByOrderByCreatedAtDesc();
        return students.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return convertToResponse(student);
    }

    public StudentResponse createStudent(StudentRequest request) {
        Student student = Student.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .schedule(request.getSchedule())
                .pricePerHour(request.getPricePerHour())
                .notes(request.getNotes())
                .build();

        Student saved = studentRepository.save(student);
        return convertToResponse(saved);
    }

    public StudentResponse updateStudent(Long id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setName(request.getName());
        student.setPhone(request.getPhone());
        student.setSchedule(request.getSchedule());
        student.setPricePerHour(request.getPricePerHour());
        student.setNotes(request.getNotes());

        Student updated = studentRepository.save(student);
        return convertToResponse(updated);
    }

    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Delete all session records for this student
        List<SessionRecord> records = sessionRecordRepository.findByStudentIdOrderByCreatedAtDesc(id);
        sessionRecordRepository.deleteAll(records);

        studentRepository.delete(student);
    }

    private StudentResponse convertToResponse(Student student) {
        List<SessionRecord> records = sessionRecordRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());

        Long totalPaid = records.stream()
                .filter(SessionRecord::getPaid)
                .mapToLong(SessionRecord::getTotalAmount)
                .sum();

        Long totalUnpaid = records.stream()
                .filter(r -> !r.getPaid())
                .mapToLong(SessionRecord::getTotalAmount)
                .sum();

        return StudentResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .phone(student.getPhone())
                .schedule(student.getSchedule())
                .pricePerHour(student.getPricePerHour())
                .notes(student.getNotes())
                .createdAt(student.getCreatedAt().format(formatter))
                .totalPaid(totalPaid)
                .totalUnpaid(totalUnpaid)
                .build();
    }
}