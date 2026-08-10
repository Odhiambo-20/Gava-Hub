-- Hibernate maps Java String to VARCHAR. Normalize this one JPA-managed column while
-- preserving the existing three-character currency constraint.
ALTER TABLE gavahub.payment
    ALTER COLUMN currency TYPE varchar(3) USING trim(currency);
