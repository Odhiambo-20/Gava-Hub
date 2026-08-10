package com.gavahub.shared.validation;

public final class PhoneNumbers {
    private PhoneNumbers() {}

    public static String normalizeKenyan(String value) {
        String digits = value == null ? "" : value.replaceAll("\\D", "");
        if (digits.startsWith("0") && digits.length() == 10) digits = "254" + digits.substring(1);
        if (digits.startsWith("7") && digits.length() == 9) digits = "254" + digits;
        if (!digits.matches("254[17]\\d{8}")) {
            throw new IllegalArgumentException("A valid Kenyan mobile number is required");
        }
        return digits;
    }
}
