package com.writegy.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequest {
    private String title;
    private String content;
    // Note: file will be handled separately as MultipartFile in controller
}
