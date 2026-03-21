package com.tutor_management.backend.modules.submission.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionIdentityReconcileResponse {
    private String canonicalStudentId;
    private List<String> identityCandidates;
    private Integer scannedSubmissions;
    private Integer affectedExercises;
    private Integer mergedExercises;
    private Integer deletedSubmissions;
    private Integer canonicalizedSubmissions;
    private Boolean dryRun;
}
