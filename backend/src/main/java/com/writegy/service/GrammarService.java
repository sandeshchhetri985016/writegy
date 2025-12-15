package com.writegy.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GrammarService {

    @Value("${languagetool.api.url}")
    private String apiUrl;

    @Value("${languagetool.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Cacheable("grammar-checks")
    public String checkGrammar(String text) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(apiUrl)
                .queryParam("language", "auto")
                .queryParam("text", text);

        if (apiKey != null && !apiKey.isEmpty()) {
            builder.queryParam("apiKey", apiKey);
        }

        return restTemplate.getForObject(builder.toUriString(), String.class);
    }
}
