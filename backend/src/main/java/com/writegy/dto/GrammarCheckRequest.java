package com.writegy.dto;

public class GrammarCheckRequest {
    private String text;

    public GrammarCheckRequest() {}

    public GrammarCheckRequest(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
