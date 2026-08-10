package com.gavahub.contact.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("gava-hub.contact")
public record ContactProperties(String supportEmail) {
    public ContactProperties {
        supportEmail = supportEmail == null || supportEmail.isBlank()
                ? "support@gavahub.co.ke" : supportEmail;
    }
}
