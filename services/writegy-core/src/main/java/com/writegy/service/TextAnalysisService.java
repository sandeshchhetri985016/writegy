package com.writegy.service;

import org.springframework.stereotype.Service;

@Service
public class TextAnalysisService {
    public String analyze(String inputText) {
        return inputText != null && !inputText.isEmpty()
                ? inputText.substring(0, 1).toUpperCase() + inputText.substring(1)
                : "No text provided!";
    }
}