package com.qmspharma.service;

import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.enums.*;
import com.qmspharma.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CapaRepository capaRepository;
    private final DeviationRepository deviationRepository;
    private final ChangeRequestRepository changeRequestRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getOverview() {
        return DashboardResponse.builder()
                .openCapas(capaRepository.count() - capaRepository.countByStatus(CapaStatus.CLOSED) - capaRepository.countByStatus(CapaStatus.REJECTED))
                .openDeviations(deviationRepository.count() - deviationRepository.countByStatus(DeviationStatus.CLOSED) - deviationRepository.countByStatus(DeviationStatus.REJECTED))
                .openChangeRequests(changeRequestRepository.count() - changeRequestRepository.countByStatus(ChangeStatus.CLOSED) - changeRequestRepository.countByStatus(ChangeStatus.REJECTED))
                .overdueCapas(capaRepository.countOverdue())
                .overdueDeviations(deviationRepository.countOverdue())
                .overdueChangeRequests(changeRequestRepository.countOverdue())
                .capasByStatus(toMap(capaRepository.countByStatusGrouped()))
                .deviationsByStatus(toMap(deviationRepository.countByStatusGrouped()))
                .changeRequestsByStatus(toMap(changeRequestRepository.countByStatusGrouped()))
                .build();
    }

    @Transactional(readOnly = true)
    public CapaMetricsResponse getCapaMetrics() {
        return CapaMetricsResponse.builder()
                .totalCapas(capaRepository.count())
                .openCapas(capaRepository.count() - capaRepository.countByStatus(CapaStatus.CLOSED) - capaRepository.countByStatus(CapaStatus.REJECTED))
                .overdueCapas(capaRepository.countOverdue())
                .closedCapas(capaRepository.countByStatus(CapaStatus.CLOSED))
                .byStatus(toMap(capaRepository.countByStatusGrouped()))
                .byPriority(toMap(capaRepository.countByPriority()))
                .byDepartment(toMap(capaRepository.countByDepartment()))
                .build();
    }

    @Transactional(readOnly = true)
    public DeviationMetricsResponse getDeviationMetrics() {
        return DeviationMetricsResponse.builder()
                .totalDeviations(deviationRepository.count())
                .openDeviations(deviationRepository.count() - deviationRepository.countByStatus(DeviationStatus.CLOSED) - deviationRepository.countByStatus(DeviationStatus.REJECTED))
                .overdueDeviations(deviationRepository.countOverdue())
                .closedDeviations(deviationRepository.countByStatus(DeviationStatus.CLOSED))
                .byStatus(toMap(deviationRepository.countByStatusGrouped()))
                .byClassification(toMap(deviationRepository.countByClassification()))
                .byCategory(toMap(deviationRepository.countByCategory()))
                .byDepartment(toMap(deviationRepository.countByDepartment()))
                .build();
    }

    @Transactional(readOnly = true)
    public ChangeControlMetricsResponse getChangeControlMetrics() {
        return ChangeControlMetricsResponse.builder()
                .totalChangeRequests(changeRequestRepository.count())
                .openChangeRequests(changeRequestRepository.count() - changeRequestRepository.countByStatus(ChangeStatus.CLOSED) - changeRequestRepository.countByStatus(ChangeStatus.REJECTED))
                .overdueChangeRequests(changeRequestRepository.countOverdue())
                .closedChangeRequests(changeRequestRepository.countByStatus(ChangeStatus.CLOSED))
                .byStatus(toMap(changeRequestRepository.countByStatusGrouped()))
                .byType(toMap(changeRequestRepository.countByType()))
                .byClassification(toMap(changeRequestRepository.countByClassification()))
                .byDepartment(toMap(changeRequestRepository.countByDepartment()))
                .build();
    }

    private Map<String, Long> toMap(List<Object[]> results) {
        return results.stream().collect(Collectors.toMap(r -> r[0].toString(), r -> (Long) r[1], (a, b) -> a, LinkedHashMap::new));
    }
}
