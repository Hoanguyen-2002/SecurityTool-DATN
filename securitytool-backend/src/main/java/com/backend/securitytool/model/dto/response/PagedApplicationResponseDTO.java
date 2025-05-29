package com.backend.securitytool.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class PagedApplicationResponseDTO {
    private List<ApplicationResponseDTO> content;
    private int pageNo;
    private int pageSize;
    private long totalElement;
    private int totalPages;
}
