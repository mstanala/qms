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
  plantSite: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  area: string;
  roomNumber: string;
  qualificationStatus: string;
  calibrationRequired: boolean;
  calibrationFrequencyDays: number | null;
  lastCalibrationDate: string | null;
  nextCalibrationDate: string | null;
  calibrationStatus: string;
  gxpRelevant: boolean;
  computerizedSystem: boolean;
  dataIntegrityClass: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalibrationRecord {
  id: string;
  calibrationNumber: string;
  calibrationType: string;
  status: string;
  scheduledDate: string;
  performedDate: string | null;
  result: string | null;
  standardUsed: string | null;
  asFoundReading: string | null;
  asLeftReading: string | null;
  tolerance: string | null;
  nextCalibrationDate: string | null;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly baseUrl = 'http://localhost:8082/api/v1/equipment';

  constructor(private http: HttpClient) {}

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

  listCalibrations(equipmentId: string): Observable<CalibrationRecord[]> {
    return this.http.get<CalibrationRecord[]>(`${this.baseUrl}/${equipmentId}/calibrations`);
  }

  createCalibration(equipmentId: string, request: Record<string, unknown>): Observable<CalibrationRecord> {
    return this.http.post<CalibrationRecord>(`${this.baseUrl}/${equipmentId}/calibrations`, request);
  }

  updateCalibration(id: string, request: Record<string, unknown>): Observable<CalibrationRecord> {
    return this.http.put<CalibrationRecord>(`${this.baseUrl}/calibrations/${id}`, request);
  }

  getDashboard(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/dashboard`);
  }

  private toParams(params?: Record<string, string>): HttpParams {
    let p = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return p;
  }
}
