import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import {
  QmsDocument, DocumentStatus, DocumentType, ConfidentialityLevel,
  ChangeType, DocumentListFilter, DocumentDashboardMetrics,
} from '../models/document.model';

const API_BASE_URL = 'http://localhost:8082/api/v1';

type ApiPage<T> = { content?: T[] };

export interface AttachmentFile {
  id: string;
  recordType: string;
  recordId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  description?: string;
  uploadedBy?: { id: string; displayName: string; email: string };
  uploadedDate: string;
}

export interface PlantSiteOption {
  id: string;
  name: string;
  code: string;
  isActive?: boolean;
}

export interface DepartmentOption {
  id: string;
  plantSiteId?: string;
  plantSiteName?: string;
  name: string;
  code: string;
  isActive?: boolean;
}

function daysAgo(days: number): Date {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(9, 0, 0, 0); return d;
}
function daysFromNow(days: number): Date {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(17, 0, 0, 0); return d;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly apiUrl = `${API_BASE_URL}/documents`;
  private readonly attachmentApiUrl = `${API_BASE_URL}/attachments`;
  private readonly adminApiUrl = `${API_BASE_URL}/admin`;

  constructor(private http: HttpClient) {}

  getDocuments(filter?: DocumentListFilter): Observable<QmsDocument[]> {
    let params = new HttpParams().set('page', '0').set('size', '100').set('sort', 'createdAt,desc');
    filter?.status?.forEach(s => (params = params.append('status', s)));
    filter?.documentType?.forEach(t => (params = params.append('documentType', t)));
    if (filter?.category) params = params.set('category', filter.category);
    if (filter?.search) params = params.set('search', filter.search);

    return this.http
      .get<ApiPage<any>>(this.apiUrl, { headers: this.authHeaders(), params })
      .pipe(
        map(page => (page.content || []).map((item: any) => this.toDocument(item))),
        catchError(() => of(this.mockDocuments()))
      );
  }

  getDocumentById(id: string): Observable<QmsDocument | undefined> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() })
      .pipe(
        map(item => this.toDocument(item)),
        catchError(() => of(this.mockDocuments().find(d => d.id === id)))
      );
  }

  createDocument(doc: Partial<QmsDocument>): Observable<QmsDocument> {
    const payload = {
      title: doc.title, description: doc.description,
      documentType: doc.documentType, category: doc.category,
      subCategory: doc.subCategory, departmentId: doc.departmentId,
      plantSiteId: doc.plantSiteId, reviewPeriodMonths: doc.reviewPeriodMonths,
      confidentialityLevel: doc.confidentialityLevel,
      regulatoryReference: doc.regulatoryReference, keywords: doc.keywords,
    };
    return this.http
      .post<any>(this.apiUrl, payload, { headers: this.authHeaders() })
      .pipe(map(item => this.toDocument(item)));
  }

  getPlantSites(): Observable<PlantSiteOption[]> {
    return this.http.get<PlantSiteOption[]>(`${this.adminApiUrl}/plant-sites`, { headers: this.authHeaders() });
  }

  getDepartments(plantSiteId?: string): Observable<DepartmentOption[]> {
    let params = new HttpParams();
    if (plantSiteId) params = params.set('plantSiteId', plantSiteId);
    return this.http.get<DepartmentOption[]>(`${this.adminApiUrl}/departments`, { headers: this.authHeaders(), params });
  }

  uploadAttachment(file: File, recordType: string, recordId: string, category = 'OTHER', description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recordType', recordType);
    formData.append('recordId', recordId);
    formData.append('category', category);
    if (description) formData.append('description', description);

    return this.http.post<any>(this.attachmentApiUrl, formData, { headers: this.authHeaders() });
  }

  getAttachments(recordType: string, recordId: string): Observable<AttachmentFile[]> {
    const params = new HttpParams().set('recordType', recordType).set('recordId', recordId);
    return this.http.get<AttachmentFile[]>(this.attachmentApiUrl, { headers: this.authHeaders(), params });
  }

  getAttachmentUrl(id: string, download = false): Observable<string> {
    const params = new HttpParams().set('download', String(download));
    return this.http
      .get<{ url: string }>(`${this.attachmentApiUrl}/${id}/download`, { headers: this.authHeaders(), params })
      .pipe(map(response => response.url));
  }

  getAttachmentContent(id: string, download = false): Observable<Blob> {
    const params = new HttpParams().set('download', String(download));
    return this.http.get(`${this.attachmentApiUrl}/${id}/content`, {
      headers: this.authHeaders(),
      params,
      responseType: 'blob',
    });
  }

  getDashboardMetrics(): Observable<DocumentDashboardMetrics> {
    return this.http
      .get<DocumentDashboardMetrics>(`${this.apiUrl}/dashboard`, { headers: this.authHeaders() })
      .pipe(catchError(() => of(this.mockMetrics())));
  }

  submitForReview(id: string): Observable<QmsDocument> {
    return this.http
      .patch<any>(`${this.apiUrl}/${id}/status`, { status: 'PENDING_REVIEW' }, { headers: this.authHeaders() })
      .pipe(map(item => this.toDocument(item)));
  }

  markReviewed(id: string, comments?: string): Observable<QmsDocument> {
    return this.http
      .patch<any>(`${this.apiUrl}/${id}/status`, { status: 'PENDING_APPROVAL', comments }, { headers: this.authHeaders() })
      .pipe(map(item => this.toDocument(item)));
  }

  approveDocument(id: string, comments?: string): Observable<QmsDocument> {
    return this.http
      .patch<any>(`${this.apiUrl}/${id}/status`, { status: 'APPROVED', comments }, { headers: this.authHeaders() })
      .pipe(map(item => this.toDocument(item)));
  }

  acknowledgeDistribution(distributionId: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/distributions/${distributionId}/acknowledge`, {},
      { headers: this.authHeaders() }
    );
  }

  markTrainingComplete(distributionId: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/distributions/${distributionId}/training-complete`, {},
      { headers: this.authHeaders() }
    );
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private toDocument(api: any): QmsDocument {
    return {
      ...api,
      effectiveDate: api.effectiveDate ? new Date(api.effectiveDate) : undefined,
      nextReviewDate: api.nextReviewDate ? new Date(api.nextReviewDate) : undefined,
      distributions: (api.distributions || []).map((item: any) => ({
        ...item,
        distributionDate: item.distributionDate ? new Date(item.distributionDate) : undefined,
        acknowledgedDate: item.acknowledgedDate ? new Date(item.acknowledgedDate) : undefined,
      })),
      auditTrail: (api.auditTrail || []).map((item: any) => ({
        id: item.id,
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        userId: item.userId,
        userName: item.userName,
        action: item.action,
        field: item.fieldName,
        oldValue: item.oldValue,
        newValue: item.newValue,
        comments: item.comments || item.reasonForChange,
      })),
      createdAt: new Date(api.createdAt), updatedAt: new Date(api.updatedAt),
    };
  }

  private mockDocuments(): QmsDocument[] {
    return [
      {
        id: 'doc-001', documentNumber: 'SOP-2025-001',
        title: 'Batch Manufacturing Record - Tablet Compression',
        description: 'Standard operating procedure for tablet compression operations on Cadmach CU-65D rotary press including setup, in-process checks, yield reconciliation, and cleaning.',
        documentType: DocumentType.SOP, category: 'Production', subCategory: 'Tablet Manufacturing',
        departmentId: 'dept-prod', departmentName: 'Production',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        owner: { id: 'u-001', displayName: 'Ramesh Kumar', email: 'ramesh.kumar@example.com' },
        status: DocumentStatus.EFFECTIVE, currentVersion: '3.0',
        effectiveDate: daysAgo(180), nextReviewDate: daysFromNow(180),
        reviewPeriodMonths: 24, confidentialityLevel: ConfidentialityLevel.INTERNAL,
        regulatoryReference: 'Schedule M Sec 14.3, 21 CFR 211.186', isTemplate: false,
        versions: [
          { id: 'v-001', versionNumber: '3.0', majorVersion: 3, minorVersion: 0, changeDescription: 'Updated compression parameters per revised BMR format and added yield reconciliation checklist.', changeType: ChangeType.MAJOR_REVISION, status: 'EFFECTIVE', fileName: 'SOP-2025-001-v3.0.pdf', fileSize: 2450000, contentType: 'application/pdf', author: { id: 'u-001', displayName: 'Ramesh Kumar', email: 'ramesh.kumar@example.com' }, approvedDate: daysAgo(180), effectiveDate: daysAgo(180), createdAt: daysAgo(195) },
          { id: 'v-002', versionNumber: '2.0', majorVersion: 2, minorVersion: 0, changeDescription: 'Added in-process check parameters for hardness and friability.', changeType: ChangeType.MAJOR_REVISION, status: 'SUPERSEDED', fileName: 'SOP-2025-001-v2.0.pdf', fileSize: 2100000, contentType: 'application/pdf', supersededDate: daysAgo(180), createdAt: daysAgo(550) },
        ],
        reviews: [
          { id: 'r-001', reviewType: 'PERIODIC', reviewDueDate: daysFromNow(180), status: 'PENDING', reviewer: { id: 'u-002', displayName: 'Priya Sharma', email: 'priya.sharma@example.com' } },
        ],
        createdAt: daysAgo(730), updatedAt: daysAgo(180),
      },
      {
        id: 'doc-002', documentNumber: 'SOP-2025-002',
        title: 'Cleaning Validation Protocol - OSD Line 3',
        description: 'Cleaning validation protocol for oral solid dosage manufacturing Line 3 including swab and rinse sampling methods.',
        documentType: DocumentType.SOP, category: 'Quality Control', subCategory: 'Validation',
        departmentId: 'dept-qc', departmentName: 'Quality Control',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        owner: { id: 'u-002', displayName: 'Priya Sharma', email: 'priya.sharma@example.com' },
        status: DocumentStatus.UNDER_REVIEW, currentVersion: '2.0',
        nextReviewDate: daysFromNow(30), reviewPeriodMonths: 24,
        confidentialityLevel: ConfidentialityLevel.INTERNAL,
        regulatoryReference: 'WHO TRS 937 Annex 4', isTemplate: false,
        createdAt: daysAgo(365), updatedAt: daysAgo(5),
      },
      {
        id: 'doc-003', documentNumber: 'WI-2025-001',
        title: 'HPLC Method for Assay of Metformin HCl',
        description: 'Work instruction for high-performance liquid chromatography assay method for Metformin Hydrochloride tablets USP.',
        documentType: DocumentType.WORK_INSTRUCTION, category: 'Quality Control', subCategory: 'Analytical Methods',
        departmentId: 'dept-qc', departmentName: 'Quality Control',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        owner: { id: 'u-003', displayName: 'Sanjay Reddy', email: 'sanjay.reddy@example.com' },
        status: DocumentStatus.EFFECTIVE, currentVersion: '1.1',
        effectiveDate: daysAgo(90), nextReviewDate: daysFromNow(640),
        reviewPeriodMonths: 24, confidentialityLevel: ConfidentialityLevel.CONFIDENTIAL,
        regulatoryReference: 'USP <621>, ICH Q2(R2)', isTemplate: false,
        createdAt: daysAgo(180), updatedAt: daysAgo(90),
      },
      {
        id: 'doc-004', documentNumber: 'POL-2025-001',
        title: 'Data Integrity Policy per ALCOA+ Principles',
        description: 'Corporate policy establishing data integrity requirements for all GMP-relevant computerized systems and paper-based records per ALCOA+ principles.',
        documentType: DocumentType.POLICY, category: 'Quality Assurance',
        departmentId: 'dept-qa', departmentName: 'Quality Assurance',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        owner: { id: 'u-004', displayName: 'Anjali Desai', email: 'anjali.desai@example.com' },
        status: DocumentStatus.APPROVED, currentVersion: '2.0',
        effectiveDate: daysAgo(30), nextReviewDate: daysFromNow(700),
        reviewPeriodMonths: 24, confidentialityLevel: ConfidentialityLevel.INTERNAL,
        regulatoryReference: '21 CFR Part 11, EU Annex 11, WHO DI Guidance', isTemplate: false,
        createdAt: daysAgo(400), updatedAt: daysAgo(30),
      },
      {
        id: 'doc-005', documentNumber: 'SOP-2025-003',
        title: 'Deviation Management Procedure',
        description: 'SOP for reporting, investigating, and closing deviations per Schedule M and WHO GMP requirements. Links to CAPA initiation criteria.',
        documentType: DocumentType.SOP, category: 'Quality Assurance', subCategory: 'QMS Procedures',
        departmentId: 'dept-qa', departmentName: 'Quality Assurance',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        owner: { id: 'u-002', displayName: 'Priya Sharma', email: 'priya.sharma@example.com' },
        status: DocumentStatus.DRAFT, currentVersion: '1.0',
        reviewPeriodMonths: 12, confidentialityLevel: ConfidentialityLevel.INTERNAL,
        regulatoryReference: 'Schedule M Sec 16, ICH Q10', isTemplate: false,
        createdAt: daysAgo(7), updatedAt: daysAgo(1),
      },
    ];
  }

  private mockMetrics(): DocumentDashboardMetrics {
    return {
      totalDocuments: 48, effectiveDocuments: 32, draftDocuments: 5,
      pendingReview: 4, pendingApproval: 3, overdueReviews: 2, expiringNext30Days: 3,
      byType: [
        { type: 'SOP', count: 22 }, { type: 'WORK_INSTRUCTION', count: 10 },
        { type: 'POLICY', count: 5 }, { type: 'FORM', count: 6 },
        { type: 'PROTOCOL', count: 3 }, { type: 'SPECIFICATION', count: 2 },
      ],
      byStatus: [
        { status: 'EFFECTIVE', count: 32 }, { status: 'DRAFT', count: 5 },
        { status: 'UNDER_REVIEW', count: 4 }, { status: 'PENDING_APPROVAL', count: 3 },
        { status: 'SUPERSEDED', count: 3 }, { status: 'OBSOLETE', count: 1 },
      ],
      byDepartment: [
        { department: 'Quality Assurance', count: 15 }, { department: 'Production', count: 12 },
        { department: 'Quality Control', count: 10 }, { department: 'Engineering', count: 6 },
        { department: 'Warehouse', count: 5 },
      ],
    };
  }
}
