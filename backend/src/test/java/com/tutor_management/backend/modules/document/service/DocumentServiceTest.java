package com.tutor_management.backend.modules.document.service;

import com.tutor_management.backend.modules.auth.Role;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.document.DocumentCategoryType;
import com.tutor_management.backend.modules.document.dto.request.DocumentRequest;
import com.tutor_management.backend.modules.document.dto.response.DocumentResponse;
import com.tutor_management.backend.modules.document.entity.Document;
import com.tutor_management.backend.modules.document.entity.DocumentCategory;
import com.tutor_management.backend.modules.document.repository.DocumentCategoryRepository;
import com.tutor_management.backend.modules.document.repository.DocumentRepository;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.shared.service.CloudinaryService;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
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
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentService Unit Tests (Multi-tenancy)")
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentCategoryRepository documentCategoryRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private TutorRepository tutorRepository;
    @Mock
    private SessionRecordRepository sessionRecordRepository;
    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private DocumentService documentService;

    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    private User adminUser;
    private User tutorUser;
    private User studentUser;
    private Tutor tutor;
    private Student student;

    @BeforeEach
    void setUp() {
        adminUser = User.builder().id(1L).email("admin@test.com").role(Role.ADMIN).build();
        tutorUser = User.builder().id(2L).email("tutor@test.com").role(Role.TUTOR).build();
        studentUser = User.builder().id(3L).email("student@test.com").role(Role.STUDENT).studentId(10L).build();

        tutor = Tutor.builder().id(20L).fullName("Tutor Name").build();
        student = Student.builder().id(10L).name("Student Name").tutorId(20L).build();

        SecurityContextHolder.setContext(securityContext);
    }

    private void mockAuthentication(User user) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);
    }

    @Test
    @DisplayName("Admin should see all documents")
    void getAllDocuments_Admin_Success() {
        mockAuthentication(adminUser);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Document> page = new PageImpl<>(List.of());
        
        when(documentRepository.findAllWithStudent(null, null, null, false, pageable)).thenReturn(page);

        documentService.getAllDocuments(null, false, pageable);

        verify(documentRepository).findAllWithStudent(null, null, null, false, pageable);
    }

    @Test
    @DisplayName("Tutor should only see their own documents")
    void getAllDocuments_Tutor_Success() {
        mockAuthentication(tutorUser);
        when(tutorRepository.findByUserId(2L)).thenReturn(Optional.of(tutor));
        
        Pageable pageable = PageRequest.of(0, 10);
        Page<Document> page = new PageImpl<>(List.of());
        
        when(documentRepository.findAllWithStudent(20L, null, null, false, pageable)).thenReturn(page);

        documentService.getAllDocuments(null, false, pageable);

        verify(documentRepository).findAllWithStudent(20L, null, null, false, pageable);
    }

    @Test
    @DisplayName("Student should see public documents and their own private ones from their tutor")
    void getAllDocuments_Student_Success() {
        mockAuthentication(studentUser);
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        
        Pageable pageable = PageRequest.of(0, 10);
        Page<Document> page = new PageImpl<>(List.of());
        
        when(documentRepository.findAllWithStudent(20L, 10L, null, false, pageable)).thenReturn(page);

        documentService.getAllDocuments(null, false, pageable);

        verify(documentRepository).findAllWithStudent(20L, 10L, null, false, pageable);
    }

    @Test
    @DisplayName("Upload should set tutor ownership")
    void uploadDocument_Tutor_Success() throws Exception {
        mockAuthentication(tutorUser);
        when(tutorRepository.findByUserId(2L)).thenReturn(Optional.of(tutor));
        when(tutorRepository.findById(20L)).thenReturn(Optional.of(tutor));
        
        DocumentRequest request = new DocumentRequest();
        request.setTitle("Test Doc");
        request.setCategory("GRAMMAR");
        
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("test.pdf");
        when(file.getSize()).thenReturn(1024L);
        when(file.getContentType()).thenReturn("application/pdf");
        
        DocumentCategory category = DocumentCategory.builder().code("GRAMMAR").name("Grammar").build();
        when(documentCategoryRepository.findByCode("GRAMMAR")).thenReturn(Optional.of(category));
        when(cloudinaryService.uploadFile(any())).thenReturn("http://cloudinary.com/test.pdf");

        when(documentRepository.save(any(Document.class))).thenAnswer(i -> {
            Document d = i.getArgument(0);
            assertEquals(20L, d.getTutor().getId());
            return d;
        });

        documentService.uploadDocument(file, request);

        verify(documentRepository).save(any(Document.class));
    }

    @Test
    @DisplayName("Tutor should be able to delete their own document")
    void deleteDocument_Owner_Success() {
        mockAuthentication(tutorUser);
        when(tutorRepository.findByUserId(2L)).thenReturn(Optional.of(tutor));
        
        Document document = Document.builder()
                .id(100L)
                .tutor(tutor)
                .filePath("http://test.com/file")
                .build();
        
        when(documentRepository.findById(100L)).thenReturn(Optional.of(document));

        documentService.deleteDocument(100L);

        verify(documentRepository).delete(document);
    }

    @Test
    @DisplayName("Tutor should NOT be able to delete another tutor's document")
    void deleteDocument_NotOwner_ThrowsException() {
        mockAuthentication(tutorUser);
        when(tutorRepository.findByUserId(2L)).thenReturn(Optional.of(tutor));
        
        Tutor otherTutor = Tutor.builder().id(99L).build();
        Document document = Document.builder()
                .id(100L)
                .tutor(otherTutor)
                .build();
        
        when(documentRepository.findById(100L)).thenReturn(Optional.of(document));

        assertThrows(RuntimeException.class, () -> documentService.deleteDocument(100L));
        verify(documentRepository, never()).delete(any());
    }
}
