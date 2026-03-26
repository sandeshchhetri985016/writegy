package com.writegy.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * SEC-001 FIX: Server-side text extraction service.
 * Extracts text content from uploaded files to prevent trust boundary inversion.
 * Uses Apache PDFBox for lightweight PDF extraction.
 */
@Service
public class TextExtractionService {

    /**
     * Extract text content from an uploaded file.
     * Supports PDF and DOC/DOCX formats.
     * 
     * @param file The uploaded file
     * @return Extracted text content
     * @throws IOException If extraction fails
     */
    public String extractText(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return "";
        }

        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        if (contentType == null) {
            throw new IOException("Unable to determine file type");
        }

        // Determine file type and extract accordingly
        if (contentType.equals("application/pdf") || 
            (filename != null && filename.toLowerCase().endsWith(".pdf"))) {
            return extractPdfText(file);
        } else if (contentType.equals("application/msword") ||
                   contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                   (filename != null && (filename.toLowerCase().endsWith(".doc") || 
                                         filename.toLowerCase().endsWith(".docx")))) {
            return extractDocxText(file);
        } else {
            throw new IOException("Unsupported file type: " + contentType);
        }
    }

    /**
     * Extract text from PDF files using Apache PDFBox.
     * PDFBox is lightweight and memory-efficient for text extraction.
     */
    private String extractPdfText(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            // PDFBox 3.x uses Loader.loadPDF() instead of PDDocument.load()
            PDDocument document = Loader.loadPDF(inputStream.readAllBytes());
            
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            
            document.close();
            
            // Clean up extracted text
            return cleanExtractedText(text);
        } catch (IOException e) {
            throw new IOException("Failed to extract text from PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Extract text from DOCX files.
     * Uses Apache POI which is already in the classpath for document export.
     */
    private String extractDocxText(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            // For .docx files (OOXML format)
            if (file.getOriginalFilename() != null && 
                file.getOriginalFilename().toLowerCase().endsWith(".docx")) {
                return extractDocxFromStream(inputStream);
            } else {
                // For legacy .doc files, we have limited support
                // Return a message indicating manual extraction needed
                return "[Legacy DOC format - text extraction limited. Consider converting to DOCX or PDF.]";
            }
        } catch (IOException e) {
            throw new IOException("Failed to extract text from DOCX: " + e.getMessage(), e);
        }
    }

    /**
     * Extract text from DOCX (Office Open XML) format using Apache POI.
     */
    private String extractDocxFromStream(InputStream inputStream) throws IOException {
        try {
            org.apache.poi.xwpf.usermodel.XWPFDocument document = 
                new org.apache.poi.xwpf.usermodel.XWPFDocument(inputStream);
            
            StringBuilder textBuilder = new StringBuilder();
            
            // Extract text from paragraphs
            for (org.apache.poi.xwpf.usermodel.XWPFParagraph para : document.getParagraphs()) {
                String text = para.getText();
                if (text != null && !text.trim().isEmpty()) {
                    textBuilder.append(text).append("\n");
                }
            }
            
            // Extract text from tables
            for (org.apache.poi.xwpf.usermodel.XWPFTable table : document.getTables()) {
                for (org.apache.poi.xwpf.usermodel.XWPFTableRow row : table.getRows()) {
                    for (org.apache.poi.xwpf.usermodel.XWPFTableCell cell : row.getTableCells()) {
                        String cellText = cell.getText();
                        if (cellText != null && !cellText.trim().isEmpty()) {
                            textBuilder.append(cellText).append(" ");
                        }
                    }
                    textBuilder.append("\n");
                }
            }
            
            document.close();
            return cleanExtractedText(textBuilder.toString());
            
        } catch (Exception e) {
            throw new IOException("Failed to parse DOCX file: " + e.getMessage(), e);
        }
    }

    /**
     * Clean up extracted text by removing excessive whitespace and normalizing line breaks.
     */
    private String cleanExtractedText(String text) {
        if (text == null) {
            return "";
        }
        
        // Remove excessive whitespace
        text = text.replaceAll("\\s+", " ");
        
        // Normalize line breaks
        text = text.replaceAll("\\r\\n", "\n");
        text = text.replaceAll("\\r", "\n");
        
        // Remove excessive blank lines
        text = text.replaceAll("\\n{3,}", "\n\n");
        
        return text.trim();
    }

    /**
     * Validate that extracted content length is reasonable for the file size.
     * This provides a sanity check against malicious content injection.
     * 
     * @param content The extracted content
     * @param fileSizeBytes The original file size in bytes
     * @return true if content length is reasonable
     */
    public boolean validateContentLength(String content, long fileSizeBytes) {
        if (content == null || content.isEmpty()) {
            return true;
        }
        
        // Rough heuristic: text content shouldn't exceed 10x the file size
        // (accounts for encoding differences and compression)
        long maxExpectedLength = fileSizeBytes * 10;
        
        return content.length() <= maxExpectedLength;
    }
}