package com.writegy.controller;

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
    public ResponseEntity<String> checkGrammar(@RequestBody String text) {
        String result = grammarService.checkGrammar(text);
        return ResponseEntity.ok(result);
    }
}
