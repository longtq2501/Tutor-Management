package com.tutor_management.backend.modules.document.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderRequest {
    private String name;
    private Long parentId;
}
