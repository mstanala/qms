import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../../shared/core-lookup.service';

export interface Equipment {
  id: string;
  equipmentNumber: string;
  name: string;
  description: string;
  equipmentType: string;
  category: string;
  status: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  assetTag: string;
  plantSite: { id: string; name: string; code: string } | null;
  department: { id: string; name: string; code: string } | null;
  area: string;
  roomNumber: string;
  installationDate: string | null;
  commissioningDate: string | null;
  qualificationDate: string | null;
  nextQualificationDate: string | null;
  decommissionDate: string | null;
  qualificationStatus: string;
  calibrationRequired: boolean;
  calibrationFrequencyDays: number | null;
  lastCalibrationDate: string | null;
  nextCalibrationDate: string | null;
  calibrationStatus: string;
  maintenanceFrequencyDays: number | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  owner: { id: string; displayName: string; email: string } | null;
  gxpRelevant: boolean;
  computerizedSystem: boolean;
  dataIntegrityClass: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalibrationRecord {
  id: string;
  calibrationNumber: string;
  equipmentId: string;
  equipmentNumber: string;
  equipmentName: string;
  calibrationType: string;
  status: string;
  scheduledDate: string;
  performedDate: string | null;
  performedBy: { id: string; displayName: string } | null;
  result: string | null;
  standardUsed: string | null;
  standardCertificate: string | null;
  asFoundReading: string | null;
  asLeftReading: string | null;
  tolerance: string | null;
  uncertainty: string | null;
  adjustmentMade: boolean;
  adjustmentDetails: string | null;
  reviewedBy: { id: string; displayName: string } | null;
  reviewDate: string | null;
  nextCalibrationDate: string | null;
  impactAssessmentRequired: boolean;
  impactOnResults: string | null;
  deviationId: string | null;
  certificatePath: string | null;
}

export interface MaintenanceRecord {
  id: string;
  maintenanceNumber: string;
  equipmentId: string;
  equipmentNumber: string;
  equipmentName: string;
  maintenanceType: string;
  status: string;
  priority: string;
  scheduledDate: string;
  completedDate: string | null;
  performedBy: { id: string; displayName: string } | null;
  workPerformed: string | null;
  partsReplaced: string | null;
  nextMaintenanceDate: string | null;
  downtimeHours: number | null;
  impactOnProduction: boolean;
  requalificationRequired: boolean;
  deviationId: string | null;
}

export interface WorkflowStep {
  id: string;
  stepName: string;
  status: string;
  assignedTo: { id: string; displayName: string; email: string } | null;
  startedAt: string | null;
  completedAt: string | null;
  comments: string | null;
  stepOrder: number;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly baseUrl = 'http://localhost:8082/api/v1/equipment';

  constructor(private http: HttpClient) {}

  // Equipment CRUD
  list(params?: Record<string, string>): Observable<Page<Equipment>> {
    return this.http.get<Page<Equipment>>(this.baseUrl, { params: this.toParams(params) });
  }

  getById(id: string): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.baseUrl}/${id}`);
  }

  create(request: Record<string, unknown>): Observable<Equipment> {
    return this.http.post<Equipment>(this.baseUrl, request);
  }

  update(id: string, request: Record<string, unknown>): Observable<Equipment> {
    return this.http.put<Equipment>(`${this.baseUrl}/${id}`, request);
  }

  // Qualification
  completeQualificationPhase(id: string, phase: string): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/${id}/qualify/${phase}`, {});
  }

  // Calibration
  listCalibrations(equipmentId: string): Observable<CalibrationRecord[]> {
    return this.http.get<CalibrationRecord[]>(`${this.baseUrl}/${equipmentId}/calibrations`);
  }

  createCalibration(equipmentId: string, request: Record<string, unknown>): Observable<CalibrationRecord> {
    return this.http.post<CalibrationRecord>(`${this.baseUrl}/${equipmentId}/calibrations`, request);
  }

  updateCalibration(id: string, request: Record<string, unknown>): Observable<CalibrationRecord> {
    return this.http.put<CalibrationRecord>(`${this.baseUrl}/calibrations/${id}`, request);
  }

  reviewCalibration(id: string, request: Record<string, unknown>): Observable<CalibrationRecord> {
    return this.http.post<CalibrationRecord>(`${this.baseUrl}/calibrations/${id}/review`, request);
  }

  // Maintenance
  listMaintenance(equipmentId: string): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceRecord[]>(`${this.baseUrl}/${equipmentId}/maintenance`);
  }

  createMaintenance(equipmentId: string, request: Record<string, unknown>): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(`${this.baseUrl}/${equipmentId}/maintenance`, request);
  }

  completeMaintenance(id: string, request: Record<string, unknown>): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(`${this.baseUrl}/maintenance/${id}/complete`, request);
  }

  reportBreakdown(id: string): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(`${this.baseUrl}/maintenance/${id}/report-breakdown`, {});
  }

  // Re-qualification
  startRequalification(id: string): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/${id}/requalification/start`, {});
  }

  completeRequalification(id: string): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/${id}/requalification/complete`, {});
  }

  // Decommission
  decommission(id: string, request: Record<string, unknown>): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/${id}/decommission`, request);
  }

  // Workflow History
  getWorkflowHistory(id: string): Observable<WorkflowStep[]> {
    return this.http.get<WorkflowStep[]>(`${this.baseUrl}/${id}/workflow-history`);
  }

  // Dashboard
  getDashboard(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/dashboard`);
  }

  private toParams(params?: Record<string, string>): HttpParams {
    let p = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return p;
  }
}
