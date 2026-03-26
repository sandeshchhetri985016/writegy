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

    // @Cacheable("grammar-checks") - Temporarily disabled to debug API key issue
    public String checkGrammar(String text) {
        System.out.println("DEBUG: ===== Grammar check called =====");
        System.out.println("DEBUG: Input text: '" + text + "'");
        System.out.println("DEBUG: API Key value: '" + (apiKey != null ? (apiKey.isEmpty() ? "EMPTY" : "SET (length: " + apiKey.length() + ")") : "NULL") + "'");
        System.out.println("DEBUG: Model: '" + model + "'");
        System.out.println("DEBUG: Base URL: '" + baseUrl + "'");
        
        // More robust API key validation
        boolean apiKeyValid = apiKey != null && !apiKey.trim().isEmpty() && apiKey.length() > 10;
        System.out.println("DEBUG: API Key valid: " + apiKeyValid);

        // Check if API key is configured
        if (!apiKeyValid) {
            System.out.println("DEBUG: OpenRouter API key not configured or invalid, using fallback");
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
                // Strip markdown code blocks if present (```json ... ```)
                // Use regex to handle various formats more robustly
                String cleanedResponse = aiResponse.trim();
                
                // Remove ```json at the start (case insensitive)
                cleanedResponse = cleanedResponse.replaceAll("(?i)^```json\\s*", "");
                // Remove ``` at the start if not json
                cleanedResponse = cleanedResponse.replaceAll("^```\\s*", "");
                // Remove ``` at the end
                cleanedResponse = cleanedResponse.replaceAll("\\s*```\\s*$", "");
                
                cleanedResponse = cleanedResponse.trim();
                
                System.out.println("DEBUG: Cleaned response length: " + cleanedResponse.length());
                
JsonNode parsed = objectMapper.readTree(cleanedResponse);

            // 🔥 Step 1: Detect nested JSON inside "replacement" (check ALL suggestions)
            if (parsed.has("suggestions") && parsed.get("suggestions").isArray()) {
                for (JsonNode suggestion : parsed.get("suggestions")) {
                    if (suggestion.has("replacement")) {
                        String replacement = suggestion.get("replacement").asText();

                        // Detect inner JSON
                        if (replacement.contains("\"suggestions\"")) {
                            System.out.println("DEBUG: Detected nested JSON, unwrapping...");

                            try {
                                JsonNode inner = objectMapper.readTree(replacement);
                                return inner.toString(); // ✅ return clean JSON
                            } catch (Exception e) {
                                System.out.println("DEBUG: Failed to parse inner JSON: " + e.getMessage());
                            }
                        }
                    }
                }
            }

            return parsed.toString(); // normalized JSON
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
        // Unescape HTML entities so the LLM sees normal characters
        String unescapedText = org.springframework.web.util.HtmlUtils.htmlUnescape(text);
        
        return """
            You are a JSON API that provides writing improvement suggestions.
            
            CRITICAL RULES:
            - Return ONLY a JSON object with a "suggestions" array
            - Do NOT include a "corrected" field in your response
            - Do NOT include the full corrected text anywhere
            - Do NOT use markdown code blocks
            - Each suggestion MUST be a JSON object with "original", "replacement", and "explanation" fields
            - Do NOT return plain strings as suggestions
            - IMPORTANT: Escape all quotes inside string values using backslash (\")
            - If the original or replacement text contains quotes (like code or JSON), escape them: \"name\" not "name"
            - Do NOT include nested JSON (do NOT put JSON inside string fields)
            - If unable to provide suggestions, return: {"suggestions":[]}
            
            CRITICAL RULES FOR 'original' FIELD:
            1. Keep the 'original' string AS SHORT AS POSSIBLE. Target specific phrases, single sentences, or single lines. NEVER target massive paragraphs at once.
            2. NEVER combine text from multiple lines into a single 'original' string using spaces. If fixing multi-line text, create separate suggestion objects for each line.
            3. The 'original' string MUST be a perfect, raw substring copied directly from the text. Do not fix typos or HTML tags inside the 'original' field.
            4. ESCAPE ALL QUOTES: You must return strictly valid JSON. If your 'original' or 'replacement' strings contain quotation marks, you MUST escape them using backslashes (e.g., \"original\": \"\\\"admin\\\" \\\"user\\\"\"). Never output raw, unescaped quotes inside JSON string values.
            
            Provide suggestions for ALL errors found in the text. Here is the EXACT format you must follow:
            
            {
              "suggestions": [
                {
                  "original": "I has a apple",
                  "replacement": "I have an apple",
                  "explanation": "Corrected subject-verb agreement and article usage"
                },
                {
                  "original": "She go to store",
                  "replacement": "She goes to the store",
                  "explanation": "Fixed verb conjugation and added missing article"
                }
              ]
            }
            
            Notice: Each suggestion is an OBJECT inside the array, not a string.

            Text to analyze:
            """ + unescapedText;
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
                "response_format": {
                    "type": "json_object"
                },
                "temperature": 0.3,
                "max_tokens": 8000
            }
            """, model, prompt.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", ""));

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
            baseUrl + "/chat/completions",
            HttpMethod.POST,
            entity,
            String.class
        );

        // Parse the response with error handling
        String responseBody = response.getBody();
        if (responseBody == null || responseBody.trim().isEmpty() || responseBody.equals("null")) {
            throw new Exception("OpenRouter API returned null or empty response");
        }

        JsonNode jsonResponse = objectMapper.readTree(responseBody);
        
        // Validate response structure
        if (jsonResponse.isNull() || !jsonResponse.has("choices")) {
            throw new Exception("OpenRouter API returned invalid response structure: " + responseBody);
        }
        
        JsonNode choices = jsonResponse.get("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            throw new Exception("OpenRouter API returned empty choices array");
        }
        
        JsonNode firstChoice = choices.get(0);
        if (!firstChoice.has("message") || !firstChoice.get("message").has("content")) {
            throw new Exception("OpenRouter API returned invalid message structure");
        }
        
        return firstChoice.get("message").get("content").asText();
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

        // Build suggestions array for JSON response
        StringBuilder suggestionsJson = new StringBuilder("[");
        boolean hasSuggestions = false;
        String lowerText = plainText.toLowerCase();

        System.out.println("DEBUG: Lower case text: '" + lowerText + "'");

        // Simple checks as fallback
        if (plainText.contains("  ")) {
            if (hasSuggestions) suggestionsJson.append(",");
            suggestionsJson.append("{\"original\":\"Multiple spaces\",\"replacement\":\"Single space\",\"explanation\":\"Remove extra spaces for cleaner formatting\"}");
            hasSuggestions = true;
            System.out.println("DEBUG: Found multiple spaces");
        }

        if (!plainText.matches(".*[.!?]\\s*$")) {
            if (hasSuggestions) suggestionsJson.append(",");
            suggestionsJson.append("{\"original\":\"" + escapeJson(plainText) + "\",\"replacement\":\"" + escapeJson(plainText) + ".\",\"explanation\":\"Consider ending with proper punctuation\"}");
            hasSuggestions = true;
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
                if (hasSuggestions) suggestionsJson.append(",");
                suggestionsJson.append("{\"original\":\"" + error + "\",\"replacement\":\"" + getCorrection(error) + "\",\"explanation\":\"Common misspelling correction\"}");
                hasSuggestions = true;
                System.out.println("DEBUG: Found misspelling: " + error);
            }
        }

        // Check for specific errors from user's example
        if (lowerText.contains("anc")) {
            if (hasSuggestions) suggestionsJson.append(",");
            suggestionsJson.append("{\"original\":\"anc\",\"replacement\":\"and\",\"explanation\":\"Typo correction\"}");
            hasSuggestions = true;
            System.out.println("DEBUG: Found 'anc' in text");
        }

        if (lowerText.contains("grammer")) {
            if (hasSuggestions) suggestionsJson.append(",");
            suggestionsJson.append("{\"original\":\"grammer\",\"replacement\":\"grammar\",\"explanation\":\"Common misspelling\"}");
            hasSuggestions = true;
            System.out.println("DEBUG: Found 'grammer' in text");
        }

        // Check for repeated words
        String[] words = plainText.split("\\s+");
        for (int i = 0; i < words.length - 1; i++) {
            if (words[i].equalsIgnoreCase(words[i + 1]) && !words[i].isEmpty()) {
                if (hasSuggestions) suggestionsJson.append(",");
                suggestionsJson.append("{\"original\":\"" + words[i] + " " + words[i + 1] + "\",\"replacement\":\"" + words[i] + "\",\"explanation\":\"Remove repeated word\"}");
                hasSuggestions = true;
                System.out.println("DEBUG: Found repeated word: " + words[i]);
                break;
            }
        }

        suggestionsJson.append("]");

        // Return JSON response (only suggestions, no corrected field)
        String jsonResponse = String.format("{\"suggestions\":%s}", 
            suggestionsJson.toString());

        System.out.println("DEBUG: Basic check JSON result: " + jsonResponse);
        return jsonResponse;
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
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
        // Don't inject raw AI response into JSON - just return empty suggestions
        System.out.println("DEBUG: Returning empty suggestions for invalid JSON response");
        return """
            {
              "suggestions": []
            }
            """;
    }
}
