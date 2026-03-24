package com.writegy.service;

import com.writegy.model.entity.Document;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Pattern;

@Service
public class ExportService {

    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    /**
     * Generate Markdown export from document content
     * Strips HTML tags and converts to markdown format
     */
    public String generateMarkdown(Document document) {
        String content = document.getContent();
        
        if (content == null || content.trim().isEmpty()) {
            return "# " + document.getTitle() + "\n\n*No content*";
        }

        // Check if content is already markdown (doesn't contain HTML tags)
        if (!containsHtml(content)) {
            return "# " + document.getTitle() + "\n\n" + content;
        }

        // Convert HTML to Markdown
        String markdownContent = convertHtmlToMarkdown(content);
        
        return "# " + document.getTitle() + "\n\n" + markdownContent;
    }

    /**
     * Generate PDF export from document content
     * Uses iText7 to convert HTML to PDF
     */
    public byte[] generatePdf(Document document) throws IOException {
        String content = document.getContent();
        
        if (content == null || content.trim().isEmpty()) {
            content = "<p><em>No content</em></p>";
        }

        // If content is markdown, convert to HTML first
        if (!containsHtml(content)) {
            content = convertMarkdownToHtml(content);
        }

        // Create full HTML document
        String fullHtml = createFullHtmlDocument(document.getTitle(), content);

        // Use iText7 to convert HTML to PDF
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            // Create PDF writer and document
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(outputStream);
            com.itextpdf.kernel.pdf.PdfDocument pdfDoc = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document documentLayout = new com.itextpdf.layout.Document(pdfDoc);

            // Parse HTML and add to PDF
            org.jsoup.nodes.Document htmlDoc = Jsoup.parse(fullHtml);
            
            // Add title
            com.itextpdf.layout.element.Paragraph title = new com.itextpdf.layout.element.Paragraph(document.getTitle())
                .setFontSize(20)
                .setBold();
            documentLayout.add(title);

            // Add content - convert HTML elements to PDF elements
            Element body = htmlDoc.body();
            addHtmlToPdf(body, documentLayout);

            documentLayout.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new IOException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Generate DOCX export from document content
     * Uses Apache POI to create Word document
     */
    public byte[] generateDocx(Document document) throws IOException {
        String content = document.getContent();
        
        if (content == null || content.trim().isEmpty()) {
            content = "<p><em>No content</em></p>";
        }

        // If content is markdown, convert to HTML first
        if (!containsHtml(content)) {
            content = convertMarkdownToHtml(content);
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            // Create Word document
            org.apache.poi.xwpf.usermodel.XWPFDocument docx = new org.apache.poi.xwpf.usermodel.XWPFDocument();

            // Add title
            org.apache.poi.xwpf.usermodel.XWPFParagraph titleParagraph = docx.createParagraph();
            org.apache.poi.xwpf.usermodel.XWPFRun titleRun = titleParagraph.createRun();
            titleRun.setText(document.getTitle());
            titleRun.setBold(true);
            titleRun.setFontSize(20);

            // Parse HTML content
            org.jsoup.nodes.Document htmlDoc = Jsoup.parse(content);
            Element body = htmlDoc.body();

            // Convert HTML elements to DOCX
            addHtmlToDocx(body, docx);

            docx.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new IOException("Failed to generate DOCX: " + e.getMessage(), e);
        }
    }

    /**
     * Generate export filename with timestamp
     */
    public String generateFilename(Document document, String extension) {
        String sanitizedTitle = sanitizeFilename(document.getTitle());
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        return sanitizedTitle + "-" + timestamp + "." + extension;
    }

    /**
     * Get content type for export format
     */
    public String getContentType(String format) {
        return switch (format.toLowerCase()) {
            case "pdf" -> "application/pdf";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "md", "markdown" -> "text/markdown; charset=UTF-8";
            default -> throw new IllegalArgumentException("Invalid export format: " + format);
        };
    }

    /**
     * Validate export format
     */
    public boolean isValidFormat(String format) {
        if (format == null) return false;
        String lowerFormat = format.toLowerCase();
        return lowerFormat.equals("pdf") || lowerFormat.equals("docx") || 
               lowerFormat.equals("md") || lowerFormat.equals("markdown");
    }

    // Private helper methods

    private boolean containsHtml(String content) {
        return content.contains("<") && content.contains(">");
    }

    private String convertHtmlToMarkdown(String html) {
        org.jsoup.nodes.Document doc = Jsoup.parse(html);
        Element body = doc.body();
        StringBuilder markdown = new StringBuilder();

        for (Element element : body.children()) {
            processElementToMarkdown(element, markdown, 0);
        }

        return markdown.toString().trim();
    }

    private void processElementToMarkdown(Element element, StringBuilder markdown, int indentLevel) {
        String tagName = element.tagName().toLowerCase();
        String indent = "  ".repeat(indentLevel);

        switch (tagName) {
            case "h1":
                markdown.append("# ").append(element.text()).append("\n\n");
                break;
            case "h2":
                markdown.append("## ").append(element.text()).append("\n\n");
                break;
            case "h3":
                markdown.append("### ").append(element.text()).append("\n\n");
                break;
            case "h4":
                markdown.append("#### ").append(element.text()).append("\n\n");
                break;
            case "h5":
                markdown.append("##### ").append(element.text()).append("\n\n");
                break;
            case "h6":
                markdown.append("###### ").append(element.text()).append("\n\n");
                break;
            case "p":
                processInlineElements(element, markdown);
                markdown.append("\n\n");
                break;
            case "ul":
                for (Element li : element.children()) {
                    if (li.tagName().equalsIgnoreCase("li")) {
                        markdown.append(indent).append("- ");
                        processInlineElements(li, markdown);
                        markdown.append("\n");
                    }
                }
                markdown.append("\n");
                break;
            case "ol":
                int counter = 1;
                for (Element li : element.children()) {
                    if (li.tagName().equalsIgnoreCase("li")) {
                        markdown.append(indent).append(counter++).append(". ");
                        processInlineElements(li, markdown);
                        markdown.append("\n");
                    }
                }
                markdown.append("\n");
                break;
            case "blockquote":
                markdown.append("> ");
                processInlineElements(element, markdown);
                markdown.append("\n\n");
                break;
            case "pre":
            case "code":
                if (element.children().isEmpty()) {
                    markdown.append("```\n").append(element.text()).append("\n```\n\n");
                } else {
                    markdown.append("```\n");
                    for (Element child : element.children()) {
                        markdown.append(child.text()).append("\n");
                    }
                    markdown.append("```\n\n");
                }
                break;
            case "table":
                processTableToMarkdown(element, markdown);
                break;
            case "br":
                markdown.append("\n");
                break;
            case "hr":
                markdown.append("---\n\n");
                break;
            default:
                // Process children for unknown elements
                for (Element child : element.children()) {
                    processElementToMarkdown(child, markdown, indentLevel);
                }
                break;
        }
    }

    private void processInlineElements(Element element, StringBuilder markdown) {
        for (org.jsoup.nodes.Node node : element.childNodes()) {
            if (node instanceof TextNode textNode) {
                markdown.append(textNode.text());
            } else if (node instanceof Element childElement) {
                String tagName = childElement.tagName().toLowerCase();
                switch (tagName) {
                    case "strong", "b":
                        markdown.append("**").append(childElement.text()).append("**");
                        break;
                    case "em", "i":
                        markdown.append("*").append(childElement.text()).append("*");
                        break;
                    case "code":
                        markdown.append("`").append(childElement.text()).append("`");
                        break;
                    case "a":
                        markdown.append("[").append(childElement.text()).append("](")
                            .append(childElement.attr("href")).append(")");
                        break;
                    case "img":
                        markdown.append("![").append(childElement.attr("alt")).append("](")
                            .append(childElement.attr("src")).append(")");
                        break;
                    default:
                        markdown.append(childElement.text());
                        break;
                }
            }
        }
    }

    private void processTableToMarkdown(Element table, StringBuilder markdown) {
        Element thead = table.selectFirst("thead");
        Element tbody = table.selectFirst("tbody");

        if (thead != null) {
            // Process header row
            Element headerRow = thead.selectFirst("tr");
            if (headerRow != null) {
                for (Element th : headerRow.children()) {
                    markdown.append("| ").append(th.text()).append(" ");
                }
                markdown.append("|\n");

                // Add separator
                for (int i = 0; i < headerRow.children().size(); i++) {
                    markdown.append("|---");
                }
                markdown.append("|\n");
            }
        }

        // Process body rows
        if (tbody != null) {
            for (Element tr : tbody.children()) {
                for (Element td : tr.children()) {
                    markdown.append("| ").append(td.text()).append(" ");
                }
                markdown.append("|\n");
            }
        }

        markdown.append("\n");
    }

    private String convertMarkdownToHtml(String markdown) {
        // Simple markdown to HTML conversion
        String html = markdown;

        // Headers
        html = Pattern.compile("^######\\s+(.*)$", Pattern.MULTILINE).matcher(html).replaceAll("<h6>$1</h6>");
        html = Pattern.compile("^#####\\s+(.*)$", Pattern.MULTILINE).matcher(html).replaceAll("<h5>$1</h5>");
        html = Pattern.compile("^####\\s+(.*)$", Pattern.MULTILINE).matcher(html).replaceAll("<h4>$1</h4>");
        html = Pattern.compile("^###\\s+(.*)$", Pattern.MULTILINE).matcher(html).replaceAll("<h3>$1</h3>");
        html = Pattern.compile("^##\\s+(.*)$", Pattern.MULTILINE).matcher(html).replaceAll("<h2>$1</h2>");
        html = Pattern.compile("^#\\s+(.*)$", Pattern.MULTILINE).matcher(html).replaceAll("<h1>$1</h1>");

        // Bold and italic
        html = Pattern.compile("\\*\\*(.*?)\\*\\*").matcher(html).replaceAll("<strong>$1</strong>");
        html = Pattern.compile("\\*(.*?)\\*").matcher(html).replaceAll("<em>$1</em>");
        html = Pattern.compile("`(.*?)`").matcher(html).replaceAll("<code>$1</code>");

        // Line breaks and paragraphs
        html = html.replace("\n\n", "</p><p>");
        html = "<p>" + html + "</p>";
        html = html.replace("\n", "<br>");

        // Links
        html = Pattern.compile("\\[(.*?)\\]\\((.*?)\\)").matcher(html).replaceAll("<a href=\"$2\">$1</a>");

        return html;
    }

    private String createFullHtmlDocument(String title, String content) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
                    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; }
                    p { margin-bottom: 16px; }
                    ul, ol { margin-bottom: 16px; padding-left: 30px; }
                    li { margin-bottom: 8px; }
                    blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin-left: 0; color: #666; }
                    code { background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
                    pre { background-color: #f4f4f4; padding: 16px; border-radius: 5px; overflow-x: auto; }
                    table { border-collapse: collapse; width: 100%%; margin-bottom: 16px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                </style>
            </head>
            <body>
                %s
            </body>
            </html>
            """.formatted(title, content);
    }

    private void addHtmlToPdf(Element element, com.itextpdf.layout.Document pdfDoc) {
        for (Element child : element.children()) {
            String tagName = child.tagName().toLowerCase();
            
            switch (tagName) {
                case "h1":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text())
                        .setFontSize(24).setBold());
                    break;
                case "h2":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text())
                        .setFontSize(20).setBold());
                    break;
                case "h3":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text())
                        .setFontSize(16).setBold());
                    break;
                case "h4":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text())
                        .setFontSize(14).setBold());
                    break;
                case "h5":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text())
                        .setFontSize(12).setBold());
                    break;
                case "h6":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text())
                        .setFontSize(10).setBold());
                    break;
                case "p":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text()));
                    break;
                case "ul":
                    com.itextpdf.layout.element.List ul = new com.itextpdf.layout.element.List()
                        .setListSymbol("• ");
                    for (Element li : child.children()) {
                        ul.add(new com.itextpdf.layout.element.ListItem(li.text()));
                    }
                    pdfDoc.add(ul);
                    break;
                case "ol":
                    com.itextpdf.layout.element.List ol = new com.itextpdf.layout.element.List()
                        .setListSymbol("1. ");
                    for (Element li : child.children()) {
                        ol.add(new com.itextpdf.layout.element.ListItem(li.text()));
                    }
                    pdfDoc.add(ol);
                    break;
                case "blockquote":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text())
                        .setMarginLeft(20).setItalic());
                    break;
                case "pre":
                case "code":
                    pdfDoc.add(new com.itextpdf.layout.element.Paragraph(child.text())
                        .setFont(com.itextpdf.kernel.font.PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.COURIER))
                        .setFontSize(10));
                    break;
                default:
                    // Process children for unknown elements
                    addHtmlToPdf(child, pdfDoc);
                    break;
            }
        }
    }

    private void addHtmlToDocx(Element element, org.apache.poi.xwpf.usermodel.XWPFDocument docx) {
        for (Element child : element.children()) {
            String tagName = child.tagName().toLowerCase();
            
            org.apache.poi.xwpf.usermodel.XWPFParagraph paragraph = docx.createParagraph();
            org.apache.poi.xwpf.usermodel.XWPFRun run = paragraph.createRun();
            
            switch (tagName) {
                case "h1":
                    run.setText(child.text());
                    run.setBold(true);
                    run.setFontSize(24);
                    break;
                case "h2":
                    run.setText(child.text());
                    run.setBold(true);
                    run.setFontSize(20);
                    break;
                case "h3":
                    run.setText(child.text());
                    run.setBold(true);
                    run.setFontSize(16);
                    break;
                case "h4":
                    run.setText(child.text());
                    run.setBold(true);
                    run.setFontSize(14);
                    break;
                case "h5":
                    run.setText(child.text());
                    run.setBold(true);
                    run.setFontSize(12);
                    break;
                case "h6":
                    run.setText(child.text());
                    run.setBold(true);
                    run.setFontSize(10);
                    break;
                case "p":
                    processInlineElementsForDocx(child, run);
                    break;
                case "ul":
                    for (Element li : child.children()) {
                        org.apache.poi.xwpf.usermodel.XWPFParagraph liParagraph = docx.createParagraph();
                        liParagraph.setSpacingBefore(0);
                        liParagraph.setSpacingAfter(0);
                        org.apache.poi.xwpf.usermodel.XWPFRun liRun = liParagraph.createRun();
                        liRun.setText("• " + li.text());
                    }
                    break;
                case "ol":
                    int counter = 1;
                    for (Element li : child.children()) {
                        org.apache.poi.xwpf.usermodel.XWPFParagraph liParagraph = docx.createParagraph();
                        liParagraph.setSpacingBefore(0);
                        liParagraph.setSpacingAfter(0);
                        org.apache.poi.xwpf.usermodel.XWPFRun liRun = liParagraph.createRun();
                        liRun.setText(counter++ + ". " + li.text());
                    }
                    break;
                case "blockquote":
                    run.setText(child.text());
                    run.setItalic(true);
                    paragraph.setIndentationLeft(360); // 0.5 inch
                    break;
                case "pre":
                case "code":
                    run.setText(child.text());
                    run.setFontFamily("Courier New");
                    run.setFontSize(10);
                    break;
                default:
                    // Process children for unknown elements
                    addHtmlToDocx(child, docx);
                    break;
            }
        }
    }

    private void processInlineElementsForDocx(Element element, org.apache.poi.xwpf.usermodel.XWPFRun run) {
        for (org.jsoup.nodes.Node node : element.childNodes()) {
            if (node instanceof TextNode textNode) {
                run.setText(textNode.text());
            } else if (node instanceof Element childElement) {
                String tagName = childElement.tagName().toLowerCase();
                switch (tagName) {
                    case "strong", "b":
                        org.apache.poi.xwpf.usermodel.XWPFRun boldRun = element.parent() instanceof org.apache.poi.xwpf.usermodel.XWPFParagraph 
                            ? ((org.apache.poi.xwpf.usermodel.XWPFParagraph) element.parent()).createRun() 
                            : run;
                        boldRun.setText(childElement.text());
                        boldRun.setBold(true);
                        break;
                    case "em", "i":
                        org.apache.poi.xwpf.usermodel.XWPFRun italicRun = element.parent() instanceof org.apache.poi.xwpf.usermodel.XWPFParagraph 
                            ? ((org.apache.poi.xwpf.usermodel.XWPFParagraph) element.parent()).createRun() 
                            : run;
                        italicRun.setText(childElement.text());
                        italicRun.setItalic(true);
                        break;
                    case "code":
                        run.setText(childElement.text());
                        run.setFontFamily("Courier New");
                        break;
                    case "a":
                        run.setText(childElement.text());
                        run.setColor("0563C1");
                        run.setUnderline(org.apache.poi.xwpf.usermodel.UnderlinePatterns.SINGLE);
                        break;
                    default:
                        run.setText(childElement.text());
                        break;
                }
            }
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return "document";
        }
        
        // Remove or replace invalid characters
        String sanitized = filename
            .replaceAll("[<>:\"/\\\\|?*]", "-")  // Replace invalid chars with dash
            .replaceAll("\\s+", "-")             // Replace spaces with dash
            .replaceAll("-+", "-")               // Replace multiple dashes with single dash
            .replaceAll("^-|-$", "")             // Remove leading/trailing dashes
            .trim();
        
        // Limit length
        if (sanitized.length() > 50) {
            sanitized = sanitized.substring(0, 50);
        }
        
        return sanitized.isEmpty() ? "document" : sanitized;
    }
}