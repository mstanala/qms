package com.qmspharma.workflow;

import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Slf4j
@Component("equipmentCalibrationDelegate")
public class EquipmentCalibrationDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        String calibrationNumber = (String) execution.getVariable("calibrationNumber");
        String equipmentName = (String) execution.getVariable("equipmentName");
        log.info("Calibration status updated via BPMN for {} ({})", equipmentName, calibrationNumber);
    }
}
