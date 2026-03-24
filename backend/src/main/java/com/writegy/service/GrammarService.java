package com.writegy.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GrammarService {

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Value("${openrouter.model}")
    private String model;

    @Value("${openrouter.base.url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Cacheable("grammar-checks")
    public String checkGrammar(String text) {
        System.out.println("DEBUG: Grammar check called with text: '" + text + "'");
        System.out.println("DEBUG: API Key configured: " + (apiKey != null && !apiKey.isEmpty()));
        System.out.println("DEBUG: Model: " + model);
        System.out.println("DEBUG: Base URL: " + baseUrl);

        // Check if API key is configured
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.out.println("DEBUG: OpenRouter API key not configured, using fallback");
            return performBasicGrammarCheck(text);
        }

        try {
            // Create AI prompt for grammar checking
            String prompt = createGrammarPrompt(text);
            System.out.println("DEBUG: Created prompt for grammar check");

            // Call OpenRouter API
            String aiResponse = callOpenRouterAPI(prompt);
            System.out.println("DEBUG: OpenRouter API response received: " + aiResponse);

            // Validate response is JSON
            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                System.out.println("DEBUG: Empty response from API, using fallback");
                return performBasicGrammarCheck(text);
            }

            // Try to parse as JSON to validate
            try {
                objectMapper.readTree(aiResponse);
                System.out.println("DEBUG: Response is valid JSON");
                return aiResponse;
            } catch (Exception jsonError) {
                System.out.println("DEBUG: Response is not valid JSON, wrapping in fallback format: " + jsonError.getMessage());
                // If not valid JSON, wrap the response in our fallback format
                return createFallbackJsonResponse(aiResponse, text);
            }

        } catch (Exception e) {
            // Fallback to basic checks if AI fails
            System.out.println("DEBUG: OpenRouter API failed, using fallback. Error: " + e.getMessage());
            e.printStackTrace();
            return performBasicGrammarCheck(text);
        }
    }

    private String createGrammarPrompt(String text) {
        return """
            Act as a strict JSON API for grammar correction.
            Analyze the text below and return a RAW JSON object. Do not use markdown code blocks. Do not add explanations.

            Instructions:
            1. Provide a fully corrected version of the entire input text
            2. For suggestions, focus on complete sentences or meaningful phrases, not individual words
            3. Each suggestion should be a complete, properly formatted sentence alternative
            4. Include explanations for why the suggested sentence is better

            Response Schema:
            {
              "corrected": "The fully corrected text",
              "suggestions": [
                {
                  "original": "original sentence or phrase",
                  "replacement": "complete corrected sentence",
                  "explanation": "why this sentence structure is better"
                }
              ]
            }

            Input Text:
            """ + text;
    }

    private String callOpenRouterAPI(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // Create request body
        String requestBody = String.format("""
            {
                "model": "%s",
                "messages": [
                    {
                        "role": "user",
                        "content": "%s"
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 800
            }
            """, model, prompt.replace("\"", "\\\"").replace("\n", "\\n"));

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
            baseUrl + "/chat/completions",
            HttpMethod.POST,
            entity,
            String.class
        );

        // Parse the response
        JsonNode jsonResponse = objectMapper.readTree(response.getBody());
        return jsonResponse.get("choices").get(0).get("message").get("content").asText();
    }

    private String formatGrammarSuggestions(String aiResponse) {
        // Return raw JSON response for frontend parsing
        return aiResponse;
    }

    private String performBasicGrammarCheck(String text) {
        System.out.println("DEBUG: Performing basic grammar check on text: '" + text + "'");

        // Strip HTML tags for basic check
        String plainText = text.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
        System.out.println("DEBUG: Plain text after HTML stripping: '" + plainText + "'");

        // Basic fallback checks
        StringBuilder suggestions = new StringBuilder();
        String lowerText = plainText.toLowerCase();

        System.out.println("DEBUG: Lower case text: '" + lowerText + "'");

        // Simple checks as fallback
        if (plainText.contains("  ")) {
            suggestions.append("• Multiple spaces detected\n");
            System.out.println("DEBUG: Found multiple spaces");
        }

        if (!plainText.matches(".*[.!?]\\s*$")) {
            suggestions.append("• Consider ending with proper punctuation\n");
            System.out.println("DEBUG: Missing ending punctuation");
        }

        // Check for common misspellings (expanded list)
        String[] commonErrors = {
            "teh", "recieve", "seperate", "occured", "begining",
            "grammer", "writting", "seperate", "definitly", "wich",
            "thier", "peice", "realy", "neccessary", "exaggerate",
            "embarass", "occassion", "priviledge", "exhilarate", "concious"
        };

        for (String error : commonErrors) {
            if (lowerText.contains(error)) {
                suggestions.append("• Possible misspelling: '").append(error).append("' (should be '").append(getCorrection(error)).append("')\n");
                System.out.println("DEBUG: Found misspelling: " + error);
            }
        }

        // Check for specific errors from user's example
        if (lowerText.contains("anc")) {
            suggestions.append("• Possible misspelling: 'anc' (should be 'and')\n");
            System.out.println("DEBUG: Found 'anc' in text");
        }

        if (lowerText.contains("grammer")) {
            suggestions.append("• Possible misspelling: 'grammer' (should be 'grammar')\n");
            System.out.println("DEBUG: Found 'grammer' in text");
        }

        // Check for capitalization issues
        if (plainText.matches(".*[a-z][A-Z].*")) {
            suggestions.append("• Inconsistent capitalization detected\n");
            System.out.println("DEBUG: Found capitalization issues");
        }

        // Check for repeated words
        String[] words = plainText.split("\\s+");
        for (int i = 0; i < words.length - 1; i++) {
            if (words[i].equalsIgnoreCase(words[i + 1]) && !words[i].isEmpty()) {
                suggestions.append("• Repeated word: '").append(words[i]).append("'\n");
                System.out.println("DEBUG: Found repeated word: " + words[i]);
                break;
            }
        }

        String result = suggestions.length() > 0 ?
            "Basic grammar check found some issues:\n" + suggestions.toString() :
            "Basic grammar check passed. AI analysis unavailable.";

        System.out.println("DEBUG: Basic check result: " + result);
        return result;
    }

    private String getCorrection(String misspelling) {
        // Simple correction mapping for common errors
        switch (misspelling.toLowerCase()) {
            case "teh": return "the";
            case "recieve": return "receive";
            case "seperate": return "separate";
            case "occured": return "occurred";
            case "begining": return "beginning";
            case "grammer": return "grammar";
            case "writting": return "writing";
            case "definitly": return "definitely";
            case "wich": return "which";
            case "thier": return "their";
            case "peice": return "piece";
            case "realy": return "really";
            case "neccessary": return "necessary";
            case "anc": return "and";
            default: return "[correct spelling]";
        }
    }

    /**
     * Create a fallback JSON response when the AI returns non-JSON text
     */
    private String createFallbackJsonResponse(String aiResponse, String originalText) {
        try {
            // Create a simple JSON response with the AI's text as a suggestion
            return String.format("""
                {
                  "corrected": "%s",
                  "suggestions": [
                    {
                      "original": "AI Analysis",
                      "replacement": "%s",
                      "explanation": "The AI provided analysis but not in the expected JSON format"
                    }
                  ]
                }
                """, 
                originalText.replace("\"", "\\\"").replace("\n", "\\n"),
                aiResponse.replace("\"", "\\\"").replace("\n", "\\n")
            );
        } catch (Exception e) {
            System.out.println("DEBUG: Failed to create fallback JSON: " + e.getMessage());
            // Return a basic JSON structure
            return """
                {
                  "corrected": "Analysis unavailable",
                  "suggestions": []
                }
                """;
        }
    }
}
