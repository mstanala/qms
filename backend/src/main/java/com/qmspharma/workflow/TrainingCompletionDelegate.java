package com.qmspharma.workflow;

import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Slf4j
@Component("trainingCompletionDelegate")
public class TrainingCompletionDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        String recordId = (String) execution.getVariable("recordId");
        String trainingNumber = (String) execution.getVariable("trainingNumber");
        log.info("Training completion recorded via BPMN for assignment {} ({})", trainingNumber, recordId);
    }
}
