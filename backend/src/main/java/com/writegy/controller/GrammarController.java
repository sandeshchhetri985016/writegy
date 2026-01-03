package com.writegy.controller;

import com.writegy.dto.GrammarCheckRequest;
import com.writegy.service.GrammarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/grammar")
public class GrammarController {

    @Autowired
    private GrammarService grammarService;

    @PostMapping("/check")
    public ResponseEntity<String> checkGrammar(@RequestBody GrammarCheckRequest request) {
        String result = grammarService.checkGrammar(request.getText());
        return ResponseEntity.ok(result);
    }
}
