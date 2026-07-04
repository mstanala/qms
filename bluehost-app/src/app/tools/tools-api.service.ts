import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:8082/api/v1';

export interface ApiPage<T> {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export interface DashboardOverview {
  openCapas: number;
  openDeviations: number;
  openChangeRequests: number;
  overdueCapas: number;
  overdueDeviations: number;
  overdueChangeRequests: number;
  pendingReviews: number;
  capasByStatus: Record<string, number>;
  deviationsByStatus: Record<string, number>;
  changeRequestsByStatus: Record<string, number>;
}

export interface CapaMetrics {
  totalCapas: number;
  openCapas: number;
  overdueCapas: number;
  closedCapas: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byDepartment: Record<string, number>;
}

export interface DeviationMetrics {
  totalDeviations: number;
  openDeviations: number;
  overdueDeviations: number;
  closedDeviations: number;
  byStatus: Record<string, number>;
  byClassification: Record<string, number>;
  byCategory: Record<string, number>;
  byDepartment: Record<string, number>;
}

export interface ChangeControlMetrics {
  totalChangeRequests: number;
  openChangeRequests: number;
  overdueChangeRequests: number;
  closedChangeRequests: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byClassification: Record<string, number>;
  byDepartment: Record<string, number>;
}

export interface AuditTrailEntry {
  id: string;
  recordType: string;
  recordId: string;
  recordNumber: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  comments?: string;
  reasonForChange?: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface RecordSummary {
  id: string;
  number: string;
  title: string;
  status?: string;
  type: 'CAPA' | 'DEVIATION' | 'CHANGE_CONTROL';
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category?: string;
  description?: string;
  uploadedBy?: string;
  uploadedDate?: string;
}

export interface SearchResponse {
  results: unknown[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ToolsApiService {
  constructor(private http: HttpClient) {}

  getDashboardOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${API_BASE_URL}/dashboard/overview`);
  }

  getCapaMetrics(): Observable<CapaMetrics> {
    return this.http.get<CapaMetrics>(`${API_BASE_URL}/dashboard/capa-metrics`);
  }

  getDeviationMetrics(): Observable<DeviationMetrics> {
    return this.http.get<DeviationMetrics>(`${API_BASE_URL}/dashboard/deviation-metrics`);
  }

  getChangeControlMetrics(): Observable<ChangeControlMetrics> {
    return this.http.get<ChangeControlMetrics>(`${API_BASE_URL}/dashboard/change-control-metrics`);
  }

  searchAuditTrail(recordType: string, recordId: string): Observable<ApiPage<AuditTrailEntry>> {
    const params = new HttpParams()
      .set('recordType', recordType)
      .set('recordId', recordId)
      .set('page', '0')
      .set('size', '100')
      .set('sort', 'timestamp,desc');

    return this.http.get<ApiPage<AuditTrailEntry>>(`${API_BASE_URL}/audit-trail`, { params });
  }

  getAuditTrailByRecord(recordType: string, recordId: string): Observable<AuditTrailEntry[]> {
    return this.http.get<AuditTrailEntry[]>(`${API_BASE_URL}/audit-trail/record/${recordType}/${recordId}`);
  }

  getRecords(recordType: 'CAPA' | 'DEVIATION' | 'CHANGE_CONTROL', size = 100): Observable<ApiPage<Record<string, unknown>>> {
    const endpoint = recordType === 'CAPA' ? 'capas' : recordType === 'DEVIATION' ? 'deviations' : 'change-requests';
    const params = new HttpParams()
      .set('page', '0')
      .set('size', String(size))
      .set('sort', 'createdAt,desc');

    return this.http.get<ApiPage<Record<string, unknown>>>(`${API_BASE_URL}/${endpoint}`, { params });
  }

  globalSearch(query: string, type?: string): Observable<SearchResponse> {
    let params = new HttpParams().set('q', query);
    if (type) params = params.set('type', type);
    return this.http.get<SearchResponse>(`${API_BASE_URL}/search`, { params });
  }

  advancedSearch(payload: {
    query?: string;
    recordTypes?: string[];
    filters?: Record<string, string[]>;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
  }): Observable<SearchResponse> {
    return this.http.post<SearchResponse>(`${API_BASE_URL}/search/advanced`, payload);
  }

  listAttachments(recordType: string, recordId: string): Observable<Attachment[]> {
    const params = new HttpParams().set('recordType', recordType).set('recordId', recordId);
    return this.http.get<Attachment[]>(`${API_BASE_URL}/attachments`, { params });
  }

  uploadAttachment(payload: {
    file: File;
    recordType: string;
    recordId: string;
    category?: string;
    description?: string;
  }): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('recordType', payload.recordType);
    formData.append('recordId', payload.recordId);
    if (payload.category) formData.append('category', payload.category);
    if (payload.description) formData.append('description', payload.description);
    return this.http.post<Attachment>(`${API_BASE_URL}/attachments`, formData);
  }

  getDownloadUrl(id: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${API_BASE_URL}/attachments/${id}/download`);
  }

  toRecordSummaries(recordType: 'CAPA' | 'DEVIATION' | 'CHANGE_CONTROL', page: ApiPage<Record<string, unknown>>): RecordSummary[] {
    return (page.content || []).map((item) => ({
      id: String(item['id'] || ''),
      number: String(item['capaNumber'] || item['deviationNumber'] || item['changeNumber'] || ''),
      title: String(item['title'] || ''),
      status: item['status'] ? String(item['status']) : undefined,
      type: recordType,
    }));
  }
}
