package com.writegy.dto;

public class SettingsRequest {
    private String name;
    private String bio;
    private String avatar;
    private String timezone;
    private String theme;
    private String language;
    private Boolean autoSaveEnabled;
    private Boolean grammarCheckEnabled;
    private Boolean spellCheckEnabled;

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Boolean getAutoSaveEnabled() { return autoSaveEnabled; }
    public void setAutoSaveEnabled(Boolean autoSaveEnabled) { this.autoSaveEnabled = autoSaveEnabled; }

    public Boolean getGrammarCheckEnabled() { return grammarCheckEnabled; }
    public void setGrammarCheckEnabled(Boolean grammarCheckEnabled) { this.grammarCheckEnabled = grammarCheckEnabled; }

    public Boolean getSpellCheckEnabled() { return spellCheckEnabled; }
    public void setSpellCheckEnabled(Boolean spellCheckEnabled) { this.spellCheckEnabled = spellCheckEnabled; }
}