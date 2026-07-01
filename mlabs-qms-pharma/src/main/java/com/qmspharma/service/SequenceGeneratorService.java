package com.qmspharma.service;

import com.qmspharma.model.entity.SequenceCounter;
import com.qmspharma.repository.SequenceCounterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SequenceGeneratorService {

    private final SequenceCounterRepository sequenceCounterRepository;

    @Transactional
    public String generateNumber(String sequenceName) {
        int year = Year.now().getValue();
        SequenceCounter counter = getOrCreateGlobalCounter(sequenceName, year);
        counter.setCurrentValue(counter.getCurrentValue() + 1);
        sequenceCounterRepository.save(counter);
        return String.format("%s-%d-%03d", counter.getPrefix(), year, counter.getCurrentValue());
    }

    private SequenceCounter getOrCreateGlobalCounter(String sequenceName, int year) {
        List<SequenceCounter> counters = sequenceCounterRepository.findAllBySequenceNameAndYearForUpdate(sequenceName, year);
        if (counters.isEmpty()) {
            SequenceCounter newCounter = new SequenceCounter();
            newCounter.setSequenceName(sequenceName);
            newCounter.setYear(year);
            newCounter.setCurrentValue(0);
            newCounter.setPrefix(getPrefix(sequenceName));
            newCounter.setFormatPattern("{PREFIX}-{YEAR}-{SEQ:3}");
            return sequenceCounterRepository.save(newCounter);
        }

        SequenceCounter counter = counters.stream()
                .max(Comparator.comparing(SequenceCounter::getCurrentValue))
                .orElseThrow();
        int currentValue = counters.stream()
                .map(SequenceCounter::getCurrentValue)
                .max(Integer::compareTo)
                .orElse(counter.getCurrentValue());
        counter.setCurrentValue(currentValue);

        if (counters.size() > 1) {
            counters.stream()
                    .filter(duplicate -> !duplicate.getId().equals(counter.getId()))
                    .forEach(sequenceCounterRepository::delete);
        }

        return counter;
    }

    private String getPrefix(String sequenceName) {
        return switch (sequenceName) {
            case "DEVIATION" -> "DEV";
            case "CAPA" -> "CAPA";
            case "CHANGE_CONTROL" -> "CC";
            case "DOCUMENT" -> "DOC";
            case "TRAINING" -> "TRN";
            case "RISK_REGISTER" -> "RSK";
            case "RISK_ASSESSMENT" -> "RA";
            case "RISK_CONTROL" -> "RC";
            case "AUDIT_PLAN" -> "AP";
            case "AUDIT" -> "AUD";
            case "AUDIT_FINDING" -> "AF";
            case "SUPPLIER" -> "SUP";
            case "SUPPLIER_QUAL" -> "SQ";
            case "COMPLAINT" -> "CMP";
            case "NONCONFORMANCE" -> "NC";
            case "EQUIPMENT" -> "EQP";
            case "CALIBRATION" -> "CAL";
            case "MAINTENANCE" -> "MNT";
            case "VALIDATION" -> "VAL";
            case "MGMT_REVIEW" -> "MR";
            case "REG_INSPECTION" -> "RI";
            case "REG_OBSERVATION" -> "RO";
            case "REG_COMMITMENT" -> "RC";
            case "PERIODIC_REVIEW" -> "PR";
            default -> sequenceName.substring(0, Math.min(3, sequenceName.length()));
        };
    }
}
