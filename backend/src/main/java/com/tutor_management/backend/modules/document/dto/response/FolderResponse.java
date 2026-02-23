package com.tutor_management.backend.modules.document.dto.response;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderResponse {
    private Long id;
    private String name;
    private Long parentId;
    private List<FolderResponse> subfolders;
    private Integer documentCount;
    private String createdAt;
}
