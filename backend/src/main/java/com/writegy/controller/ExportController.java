package com.writegy.controller;

import com.writegy.model.entity.Document;
import com.writegy.service.DocumentService;
import com.writegy.service.ExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documents")
public class ExportController {

    @Autowired
    private ExportService exportService;

    @Autowired
    private DocumentService documentService;

    /**
     * Export document to specified format (PDF, DOCX, or Markdown)
     * 
     * @param id Document ID
     * @param format Export format (pdf, docx, md, or markdown)
     * @return File binary data with appropriate Content-Type header
     */
    @PostMapping("/{id}/export")
    public ResponseEntity<byte[]> exportDocument(
            @PathVariable Long id,
            @RequestParam String format) {
        
        // Validate format parameter
        if (!exportService.isValidFormat(format)) {
            return ResponseEntity.badRequest()
                .body("{\"error\": \"Invalid export format. Use: pdf, docx, or md\"}".getBytes());
        }

        try {
            // Get document (includes ownership validation)
            Document document = documentService.getDocument(id);

            // Normalize format
            String normalizedFormat = format.toLowerCase();
            if (normalizedFormat.equals("markdown")) {
                normalizedFormat = "md";
            }

            // Generate export based on format
            byte[] fileContent;
            String filename;
            String contentType;

            switch (normalizedFormat) {
                case "pdf":
                    fileContent = exportService.generatePdf(document);
                    filename = exportService.generateFilename(document, "pdf");
                    contentType = exportService.getContentType("pdf");
                    break;
                
                case "docx":
                    fileContent = exportService.generateDocx(document);
                    filename = exportService.generateFilename(document, "docx");
                    contentType = exportService.getContentType("docx");
                    break;
                
                case "md":
                    String markdownContent = exportService.generateMarkdown(document);
                    fileContent = markdownContent.getBytes("UTF-8");
                    filename = exportService.generateFilename(document, "md");
                    contentType = exportService.getContentType("md");
                    break;
                
                default:
                    return ResponseEntity.badRequest()
                        .body("{\"error\": \"Invalid export format. Use: pdf, docx, or md\"}".getBytes());
            }

            // Set response headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(fileContent.length);

            // Add cache control headers
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);

        } catch (RuntimeException e) {
            // Handle document not found or unauthorized access
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"Document not found\"}".getBytes());
            } else if (e.getMessage().contains("Not authorized") || e.getMessage().contains("authorization")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"You don't have permission to export this document\"}".getBytes());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Failed to generate export. Please try again\"}".getBytes());
            }
        } catch (Exception e) {
            // Handle export generation errors
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\": \"Failed to generate export. Please try again\"}".getBytes());
        }
    }

    /**
     * Get available export formats
     * 
     * @return List of available export formats
     */
    @GetMapping("/export/formats")
    public ResponseEntity<String> getAvailableFormats() {
        String formats = """
            {
                "formats": [
                    {
                        "id": "pdf",
                        "name": "PDF",
                        "description": "Portable Document Format",
                        "extension": ".pdf",
                        "contentType": "application/pdf"
                    },
                    {
                        "id": "docx",
                        "name": "Microsoft Word",
                        "description": "Office Open XML Document",
                        "extension": ".docx",
                        "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    },
                    {
                        "id": "md",
                        "name": "Markdown",
                        "description": "Plain text with markdown formatting",
                        "extension": ".md",
                        "contentType": "text/markdown; charset=UTF-8"
                    }
                ]
            }
            """;
        
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(formats);
    }
}