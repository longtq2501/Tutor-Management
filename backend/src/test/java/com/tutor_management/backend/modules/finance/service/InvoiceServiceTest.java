package com.tutor_management.backend.modules.finance.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.finance.dto.request.InvoiceRequest;
import com.tutor_management.backend.modules.finance.dto.response.InvoiceResponse;
import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private SessionRecordRepository sessionRecordRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private InvoiceService invoiceService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void generateInvoice_ShouldUseAuthenticatedUserBankInfo() {
        // Arrange
        InvoiceRequest request = InvoiceRequest.builder()
                .studentId(1L)
                .month("2024-12")
                .build();

        Student student = Student.builder()
                .id(1L)
                .name("Test Student")
                .build();

        SessionRecord record = SessionRecord.builder()
                .student(student)
                .month("2024-12")
                .sessionDate(LocalDate.now())
                .totalAmount(500000L)
                .paid(false)
                .sessions(1)
                .hours(1.0)
                .build();

        User user = User.builder()
                .id(1L)
                .bankName("My Custom Bank")
                .accountNumber("999999999")
                .accountName("Custom Name")
                .build();

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(sessionRecordRepository.findByStudentIdAndMonth(1L, "2024-12")).thenReturn(Collections.singletonList(record));
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Act
        InvoiceResponse response = invoiceService.generateInvoice(request);

        // Assert
        assertNotNull(response);
        assertEquals("My Custom Bank", response.getBankInfo().getBankName());
        assertEquals("999999999", response.getBankInfo().getAccountNumber());
        assertEquals("Custom Name", response.getBankInfo().getAccountName());
        assertTrue(response.getQrCodeUrl().contains("999999999"));
        assertTrue(response.getQrCodeUrl().contains("970436"));
    }

    @Test
    void generateInvoice_ShouldFallbackToDefaultWhenNoUser() {
        // Arrange
        InvoiceRequest request = InvoiceRequest.builder()
                .studentId(1L)
                .month("2024-12")
                .build();

        Student student = Student.builder()
                .id(1L)
                .name("Test Student")
                .build();

        SessionRecord record = SessionRecord.builder()
                .student(student)
                .month("2024-12")
                .sessionDate(LocalDate.now())
                .totalAmount(500000L)
                .paid(false)
                .sessions(1)
                .hours(1.0)
                .build();

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(sessionRecordRepository.findByStudentIdAndMonth(1L, "2024-12")).thenReturn(Collections.singletonList(record));
        when(securityContext.getAuthentication()).thenReturn(null);

        // Act
        InvoiceResponse response = invoiceService.generateInvoice(request);

        // Assert
        assertNotNull(response);
        assertEquals("Vietcombank", response.getBankInfo().getBankName());
        assertEquals("1041819355", response.getBankInfo().getAccountNumber());
        assertTrue(response.getQrCodeUrl().contains("1041819355"));
    }
}
