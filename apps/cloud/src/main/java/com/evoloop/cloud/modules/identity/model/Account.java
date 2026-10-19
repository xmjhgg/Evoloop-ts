package com.evoloop.cloud.modules.identity.model;

public record Account(String id, String username, boolean aiAllowed, boolean healthAllowed, long purposeVersion) {}
