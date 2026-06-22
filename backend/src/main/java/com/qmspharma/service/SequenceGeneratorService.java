package com.qmspharma.service;

import com.qmspharma.model.entity.SequenceCounter;
import com.qmspharma.repository.SequenceCounterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

@Service
@RequiredArgsConstructor
public class SequenceGeneratorService {

    private final SequenceCounterRepository sequenceCounterRepository;

    @Transactional
    public String generateNumber(String sequenceName) {
        int year = Year.now().getValue();
        SequenceCounter counter = sequenceCounterRepository
                .findBySequenceNameAndYearForUpdate(sequenceName, year)
                .orElseGet(() -> {
                    SequenceCounter newCounter = new SequenceCounter();
                    newCounter.setSequenceName(sequenceName);
                    newCounter.setYear(year);
                    newCounter.setCurrentValue(0);
                    newCounter.setPrefix(getPrefix(sequenceName));
                    newCounter.setFormatPattern("{PREFIX}-{YEAR}-{SEQ:3}");
                    return sequenceCounterRepository.save(newCounter);
                });
        counter.setCurrentValue(counter.getCurrentValue() + 1);
        sequenceCounterRepository.save(counter);
        return String.format("%s-%d-%03d", counter.getPrefix(), year, counter.getCurrentValue());
    }

    private String getPrefix(String sequenceName) {
        return switch (sequenceName) {
            case "DEVIATION" -> "DEV";
            case "CAPA" -> "CAPA";
            case "CHANGE_CONTROL" -> "CC";
            case "DOCUMENT" -> "DOC";
            case "TRAINING" -> "TRN";
            default -> sequenceName.substring(0, Math.min(3, sequenceName.length()));
        };
    }
}
