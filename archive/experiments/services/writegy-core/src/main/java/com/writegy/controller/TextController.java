package com.writegy.controller;

import com.writegy.model.TextRequest;
import com.writegy.service.TextAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class TextController {

    @Autowired
    private TextAnalysisService textAnalysisService;

    @GetMapping("/")
    public String showEditor(Model model) {
        model.addAttribute("textRequest", new TextRequest());
        return "index";
    }

    @PostMapping("/analyze")
    public String analyzeText(@ModelAttribute TextRequest textRequest, Model model) {
        String analyzedText = textAnalysisService.analyze(textRequest.getInputText());
        textRequest.setResult(analyzedText);
        model.addAttribute("textRequest", textRequest);
        return "result";
    }
}