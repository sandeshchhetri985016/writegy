package com.writegy.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Entity
@Table(name = "writing_metrics", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "date"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class WritingMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Builder.Default
    private Integer wordCount = 0;

    @Builder.Default
    private Integer documentsCreated = 0;

    @Builder.Default
    private Double grammarScore = 100.0;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> commonErrors;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Converter
    public static class StringListConverter implements AttributeConverter<List<String>, String> {
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public String convertToDatabaseColumn(List<String> attribute) {
            try {
                return attribute != null ? objectMapper.writeValueAsString(attribute) : null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to convert list to JSON", e);
            }
        }

        @Override
        public List<String> convertToEntityAttribute(String dbData) {
            try {
                return dbData != null ? objectMapper.readValue(dbData, new TypeReference<List<String>>() {}) : null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to convert JSON to list", e);
            }
        }
    }
}
