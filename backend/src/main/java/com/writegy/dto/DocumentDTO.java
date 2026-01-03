package com.writegy.dto;

import com.writegy.model.enums.DocumentStatus;

import java.time.LocalDateTime;

public class DocumentDTO {
    private Long id;
    private String title;
    private String content;
    private DocumentStatus status;
    private Integer wordCount;
    private Integer characterCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    // Hierarchy fields
    private Long parentId;
    private Integer depth;
    private Integer treeOrder;

    // User info (without circular reference)
    private Long userId;
    private String userEmail;
    private String userName;

    // Default constructor
    public DocumentDTO() {}

    // Constructor with all fields
    public DocumentDTO(Long id, String title, String content, DocumentStatus status,
                      Integer wordCount, Integer characterCount, LocalDateTime createdAt,
                      LocalDateTime updatedAt, LocalDateTime deletedAt,
                      Long userId, String userEmail, String userName) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.status = status;
        this.wordCount = wordCount;
        this.characterCount = characterCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.userId = userId;
        this.userEmail = userEmail;
        this.userName = userName;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public DocumentStatus getStatus() { return status; }
    public void setStatus(DocumentStatus status) { this.status = status; }

    public Integer getWordCount() { return wordCount; }
    public void setWordCount(Integer wordCount) { this.wordCount = wordCount; }

    public Integer getCharacterCount() { return characterCount; }
    public void setCharacterCount(Integer characterCount) { this.characterCount = characterCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public Integer getDepth() { return depth; }
    public void setDepth(Integer depth) { this.depth = depth; }

    public Integer getTreeOrder() { return treeOrder; }
    public void setTreeOrder(Integer treeOrder) { this.treeOrder = treeOrder; }
}
