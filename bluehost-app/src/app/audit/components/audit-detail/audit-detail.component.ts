import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuditService, Audit, AuditFinding } from '../../services/audit.service';

@Component({
  selector: 'qms-audit-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTableModule, MatMenuModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSnackBarModule, MatTabsModule, MatTooltipModule],
  template: `
    <div class="page" *ngIf="audit">
      <div class="page-header">
        <div class="header-info">
          <div class="header-top">
            <span class="audit-number">{{ audit.auditNumber }}</span>
            <span class="lifecycle-badge" [ngClass]="'lc-' + (audit.lifecycleState || 'DRAFT').toLowerCase()">
              {{ formatEnum(audit.lifecycleState || 'DRAFT') }}
            </span>
            <span class="status-badge" [ngClass]="'st-' + audit.status.toLowerCase()">
              {{ formatEnum(audit.status) }}
            </span>
            <span class="priority-badge" [ngClass]="'pr-' + (audit.priority || 'MEDIUM').toLowerCase()">
              {{ audit.priority || 'MEDIUM' }}
            </span>
          </div>
          <h1>{{ audit.title }}</h1>
          <p class="description" *ngIf="audit.description">{{ audit.description }}</p>
        </div>
        <div class="actions">
          <!-- Workflow action buttons based on current status -->
          <button mat-raised-button color="primary" *ngIf="audit.status === 'PLANNED'" (click)="changeStatus('SCHEDULED')">
            <mat-icon>event</mat-icon> Schedule
          </button>
          <button mat-raised-button color="primary" *ngIf="audit.status === 'SCHEDULED'" (click)="changeStatus('IN_PROGRESS')">
            <mat-icon>play_arrow</mat-icon> Start Audit
          </button>
          <button mat-raised-button color="accent" *ngIf="audit.status === 'IN_PROGRESS'" (click)="changeStatus('REPORT_DRAFTING')">
            <mat-icon>description</mat-icon> Draft Report
          </button>
          <button mat-raised-button color="accent" *ngIf="audit.status === 'REPORT_DRAFTING'" (click)="changeStatus('UNDER_REVIEW')">
            <mat-icon>rate_review</mat-icon> Submit for Review
          </button>
          <button mat-raised-button color="primary" *ngIf="audit.status === 'UNDER_REVIEW'" (click)="changeStatus('COMPLETED')">
            <mat-icon>check_circle</mat-icon> Complete Audit
          </button>

          <button mat-stroked-button [matMenuTriggerFor]="statusMenu">
            <mat-icon>more_vert</mat-icon> More
          </button>
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
          <mat-menu #statusMenu="matMenu">
            <button mat-menu-item *ngFor="let s of statuses" (click)="changeStatus(s)">{{ formatEnum(s) }}</button>
          </mat-menu>
        </div>
      </div>

      <mat-tab-group>
        <!-- Overview Tab -->
        <mat-tab label="Overview">
          <mat-card class="detail-card">
            <mat-card-header><mat-card-title>Audit Overview</mat-card-title></mat-card-header>
            <mat-card-content class="info-grid">
              <div><label>Audit Type</label><span>{{ formatEnum(audit.auditType) }}</span></div>
              <div><label>Category</label><span>{{ audit.category || '—' }}</span></div>
              <div><label>Frequency</label><span>{{ formatEnum(audit.frequency) || '—' }}</span></div>
              <div><label>Lead Auditor</label><span>{{ audit.leadAuditor?.displayName || '—' }}</span></div>
              <div><label>Department</label><span>{{ audit.auditeeDepartment?.name || '—' }}</span></div>
              <div><label>Plant Site</label><span>{{ audit.plantSite?.name || '—' }}</span></div>
              <div><label>Area Audited</label><span>{{ audit.areaAudited || '—' }}</span></div>
              <div><label>Standards</label><span>{{ audit.standardsReference || '—' }}</span></div>
              <div><label>Scheduled Start</label><span>{{ audit.scheduledStartDate | date:'dd-MMM-yyyy' }}</span></div>
              <div><label>Scheduled End</label><span>{{ audit.scheduledEndDate | date:'dd-MMM-yyyy' }}</span></div>
              <div><label>Actual Start</label><span>{{ audit.actualStartDate ? (audit.actualStartDate | date:'dd-MMM-yyyy') : '—' }}</span></div>
              <div><label>Actual End</label><span>{{ audit.actualEndDate ? (audit.actualEndDate | date:'dd-MMM-yyyy') : '—' }}</span></div>
            </mat-card-content>
          </mat-card>

          <mat-card class="detail-card" *ngIf="audit.auditScope">
            <mat-card-header><mat-card-title>Scope</mat-card-title></mat-card-header>
            <mat-card-content><p class="text-block">{{ audit.auditScope }}</p></mat-card-content>
          </mat-card>

          <mat-card class="detail-card" *ngIf="audit.executiveSummary">
            <mat-card-header><mat-card-title>Executive Summary</mat-card-title></mat-card-header>
            <mat-card-content><p class="text-block">{{ audit.executiveSummary }}</p></mat-card-content>
          </mat-card>

          <!-- Editable Report Section for REPORT_DRAFTING status -->
          <mat-card class="detail-card" *ngIf="audit.status === 'REPORT_DRAFTING' || audit.status === 'IN_PROGRESS'">
            <mat-card-header><mat-card-title>Audit Report</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Executive Summary</mat-label>
                <textarea matInput [(ngModel)]="reportData.executiveSummary" rows="4"
                  placeholder="Summary of audit objectives, scope, and key conclusions"></textarea>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Findings Summary</mat-label>
                <textarea matInput [(ngModel)]="reportData.findingsSummary" rows="4"
                  placeholder="Summary of all findings and their classifications"></textarea>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Proposed Actions</mat-label>
                <textarea matInput [(ngModel)]="reportData.proposedAction" rows="3"
                  placeholder="Recommended actions and next steps"></textarea>
              </mat-form-field>
              <div class="report-actions">
                <button mat-raised-button color="primary" (click)="saveReport()">
                  <mat-icon>save</mat-icon> Save Report
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Read-only report sections for other statuses -->
          <mat-card class="detail-card" *ngIf="audit.findingsSummary && audit.status !== 'REPORT_DRAFTING' && audit.status !== 'IN_PROGRESS'">
            <mat-card-header><mat-card-title>Findings Summary</mat-card-title></mat-card-header>
            <mat-card-content><p class="text-block">{{ audit.findingsSummary }}</p></mat-card-content>
          </mat-card>

          <mat-card class="detail-card" *ngIf="audit.proposedAction && audit.status !== 'REPORT_DRAFTING' && audit.status !== 'IN_PROGRESS'">
            <mat-card-header><mat-card-title>Proposed Actions</mat-card-title></mat-card-header>
            <mat-card-content><p class="text-block">{{ audit.proposedAction }}</p></mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Findings Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            Findings <span class="tab-count" *ngIf="findings.length">({{ findings.length }})</span>
          </ng-template>

          <mat-card class="detail-card">
            <mat-card-header>
              <mat-card-title>Audit Findings</mat-card-title>
              <button mat-raised-button color="primary" class="add-finding-btn"
                *ngIf="audit.status === 'IN_PROGRESS' || audit.status === 'REPORT_DRAFTING'"
                (click)="showFindingForm = !showFindingForm">
                <mat-icon>{{ showFindingForm ? 'close' : 'add' }}</mat-icon>
                {{ showFindingForm ? 'Cancel' : 'Add Finding' }}
              </button>
            </mat-card-header>
            <mat-card-content>
              <!-- Add Finding Form -->
              <div class="finding-form" *ngIf="showFindingForm">
                <h4>Record New Finding</h4>
                <div class="form-grid">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Finding Title</mat-label>
                    <input matInput [(ngModel)]="newFinding.title" placeholder="Brief description of the finding">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description</mat-label>
                    <textarea matInput [(ngModel)]="newFinding.description" rows="3"
                      placeholder="Detailed description including what was observed and the impact"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Classification</mat-label>
                    <mat-select [(ngModel)]="newFinding.classification">
                      <mat-option value="CRITICAL">Critical</mat-option>
                      <mat-option value="MAJOR">Major</mat-option>
                      <mat-option value="MINOR">Minor</mat-option>
                      <mat-option value="OBSERVATION">Observation</mat-option>
                      <mat-option value="OFI">Opportunity for Improvement</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Area</mat-label>
                    <input matInput [(ngModel)]="newFinding.area" placeholder="e.g., Production Floor, QC Lab">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Objective Evidence</mat-label>
                    <textarea matInput [(ngModel)]="newFinding.objectiveEvidence" rows="2"
                      placeholder="Evidence observed during the audit"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Standard Reference</mat-label>
                    <input matInput [(ngModel)]="newFinding.standardReference"
                      placeholder="e.g., 21 CFR 211.68">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>CAPA Required?</mat-label>
                    <mat-select [(ngModel)]="newFinding.capaRequired">
                      <mat-option [value]="true">Yes</mat-option>
                      <mat-option [value]="false">No</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="finding-form-actions">
                  <button mat-raised-button color="primary" (click)="submitFinding()"
                    [disabled]="!newFinding.title || !newFinding.description || !newFinding.classification">
                    <mat-icon>add_circle</mat-icon> Save Finding
                  </button>
                </div>
              </div>

              <!-- Findings Table -->
              <table mat-table [dataSource]="findings" class="full-table" *ngIf="findings.length > 0">
                <ng-container matColumnDef="findingNumber">
                  <th mat-header-cell *matHeaderCellDef>Finding #</th>
                  <td mat-cell *matCellDef="let r">{{ r.findingNumber }}</td>
                </ng-container>
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Title</th>
                  <td mat-cell *matCellDef="let r">{{ r.title }}</td>
                </ng-container>
                <ng-container matColumnDef="classification">
                  <th mat-header-cell *matHeaderCellDef>Classification</th>
                  <td mat-cell *matCellDef="let r">
                    <span class="cls-badge" [ngClass]="'cls-' + r.classification.toLowerCase()">{{ r.classification }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="area">
                  <th mat-header-cell *matHeaderCellDef>Area</th>
                  <td mat-cell *matCellDef="let r">{{ r.area || '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let r">
                    <span class="status-badge" [ngClass]="'fst-' + r.status.toLowerCase()">{{ formatEnum(r.status) }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let r">
                    <button mat-icon-button [matMenuTriggerFor]="findingMenu" matTooltip="Actions">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #findingMenu="matMenu">
                      <button mat-menu-item (click)="selectFinding(r)">
                        <mat-icon>visibility</mat-icon> View Details
                      </button>
                      <button mat-menu-item *ngIf="r.status === 'OPEN' && (r.classification === 'CRITICAL' || r.classification === 'MAJOR' || r.capaRequired)"
                        (click)="initiateCapaForFinding(r)">
                        <mat-icon>assignment_late</mat-icon> Initiate CAPA
                      </button>
                      <button mat-menu-item *ngIf="r.status === 'OPEN'" (click)="respondToFinding(r)">
                        <mat-icon>reply</mat-icon> Add Response
                      </button>
                      <button mat-menu-item *ngIf="r.status === 'IN_PROGRESS' || r.status === 'CAPA_ASSIGNED'"
                        (click)="markForVerification(r)">
                        <mat-icon>fact_check</mat-icon> Send to Verification
                      </button>
                      <button mat-menu-item *ngIf="r.status === 'VERIFICATION'" (click)="verifyFinding(r)">
                        <mat-icon>verified</mat-icon> Verify & Close
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="findingCols"></tr>
                <tr mat-row *matRowDef="let row; columns: findingCols;" [class.selected-row]="selectedFinding?.id === row.id" (click)="selectFinding(row)"></tr>
              </table>
              <p *ngIf="findings.length === 0 && !showFindingForm" class="empty-state">No findings recorded. Start the audit and add findings during execution.</p>
            </mat-card-content>
          </mat-card>

          <!-- Selected Finding Detail -->
          <mat-card class="detail-card" *ngIf="selectedFinding">
            <mat-card-header>
              <mat-card-title>{{ selectedFinding.findingNumber }} - {{ selectedFinding.title }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div><label>Classification</label><span class="cls-badge" [ngClass]="'cls-' + selectedFinding.classification.toLowerCase()">{{ selectedFinding.classification }}</span></div>
                <div><label>Status</label><span class="status-badge" [ngClass]="'fst-' + selectedFinding.status.toLowerCase()">{{ formatEnum(selectedFinding.status) }}</span></div>
                <div><label>Area</label><span>{{ selectedFinding.area || '—' }}</span></div>
                <div><label>CAPA Required</label><span>{{ selectedFinding.capaRequired ? 'Yes' : 'No' }}</span></div>
                <div><label>Due Date</label><span>{{ selectedFinding.responseDueDate ? (selectedFinding.responseDueDate | date:'dd-MMM-yyyy') : '—' }}</span></div>
                <div><label>CAPA ID</label><span>{{ selectedFinding.capaId || '—' }}</span></div>
              </div>
              <div class="finding-detail-section" *ngIf="selectedFinding.description">
                <label>Description</label>
                <p>{{ selectedFinding.description }}</p>
              </div>
              <div class="finding-detail-section" *ngIf="selectedFinding.objectiveEvidence">
                <label>Objective Evidence</label>
                <p>{{ selectedFinding.objectiveEvidence }}</p>
              </div>
              <div class="finding-detail-section" *ngIf="selectedFinding.auditeeResponse">
                <label>Auditee Response</label>
                <p>{{ selectedFinding.auditeeResponse }}</p>
              </div>
              <div class="finding-detail-section" *ngIf="selectedFinding.verifiedBy">
                <label>Verified By</label>
                <p>{{ selectedFinding.verifiedBy?.displayName }} on {{ selectedFinding.verifiedDate | date:'dd-MMM-yyyy' }}</p>
                <p *ngIf="selectedFinding.verificationComments"><em>{{ selectedFinding.verificationComments }}</em></p>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Auditee Response Form -->
          <mat-card class="detail-card" *ngIf="showResponseForm && selectedFinding">
            <mat-card-header><mat-card-title>Auditee Response for {{ selectedFinding.findingNumber }}</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Response</mat-label>
                <textarea matInput [(ngModel)]="responseText" rows="4"
                  placeholder="Provide your response to this finding, including proposed corrective actions"></textarea>
              </mat-form-field>
              <div class="form-actions">
                <button mat-stroked-button (click)="showResponseForm = false">Cancel</button>
                <button mat-raised-button color="primary" (click)="submitResponse()" [disabled]="!responseText">
                  <mat-icon>send</mat-icon> Submit Response
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Verification Form -->
          <mat-card class="detail-card" *ngIf="showVerifyForm && selectedFinding">
            <mat-card-header><mat-card-title>Verify Finding {{ selectedFinding.findingNumber }}</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Verification Comments</mat-label>
                <textarea matInput [(ngModel)]="verificationComments" rows="4"
                  placeholder="Provide verification comments - confirm that corrective actions are effective"></textarea>
              </mat-form-field>
              <div class="form-actions">
                <button mat-stroked-button (click)="showVerifyForm = false">Cancel</button>
                <button mat-raised-button color="primary" (click)="submitVerification()" [disabled]="!verificationComments">
                  <mat-icon>verified</mat-icon> Verify & Close Finding
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page { padding: 20px 24px; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; flex-wrap: wrap; gap: 16px;
    }
    .header-info { flex: 1; min-width: 0; }
    .header-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .audit-number { font-size: 13px; font-weight: 600; color: #2C5F7C; }
    .page-header h1 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1f2937; }
    .description { color: #667085; font-size: 13px; margin: 0; line-height: 1.5; }
    .actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

    .detail-card { margin: 16px 0; border-radius: 8px; }
    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px; padding-top: 8px;
    }
    .info-grid label {
      display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px;
      text-transform: uppercase; font-weight: 500; letter-spacing: 0.03em;
    }
    .info-grid span { font-size: 13px; color: #1f2937; }

    .text-block { color: #374151; font-size: 13px; line-height: 1.65; margin: 0; white-space: pre-line; }

    .full-table { width: 100%; }
    .full-table th.mat-mdc-header-cell {
      font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;
      letter-spacing: 0.04em; background: #f8fafc;
    }
    .full-table td.mat-mdc-cell { font-size: 13px; color: #374151; }

    .empty-state { color: #94a3b8; font-size: 13px; padding: 20px 0; text-align: center; }

    .tab-count { font-size: 11px; background: #e2e8f0; border-radius: 10px; padding: 1px 6px; margin-left: 4px; }

    .add-finding-btn { margin-left: auto; }

    .finding-form {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 20px; margin-bottom: 16px;
    }
    .finding-form h4 { margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #1f2937; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .full-width { grid-column: 1 / -1; }
    .finding-form-actions { display: flex; justify-content: flex-end; margin-top: 12px; }

    .finding-detail-section { margin-top: 16px; }
    .finding-detail-section label {
      display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase;
      font-weight: 500; letter-spacing: 0.03em; margin-bottom: 4px;
    }
    .finding-detail-section p { font-size: 13px; color: #374151; margin: 0; line-height: 1.6; }

    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
    .report-actions { display: flex; justify-content: flex-end; margin-top: 12px; }

    .selected-row { background: #f0f7ff !important; }

    .status-badge, .lifecycle-badge, .priority-badge, .cls-badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 11px; font-weight: 500;
    }

    .st-planned { background: #e2e8f0; color: #475569; }
    .st-scheduled { background: #dbeafe; color: #1e40af; }
    .st-in_progress { background: #fef3c7; color: #92400e; }
    .st-report_drafting { background: #fed7aa; color: #9a3412; }
    .st-under_review { background: #e9d5ff; color: #6b21a8; }
    .st-completed { background: #d1fae5; color: #065f46; }
    .st-cancelled { background: #fecaca; color: #991b1b; }

    .lc-draft { background: #f1f5f9; color: #64748b; }
    .lc-active { background: #dbeafe; color: #1e40af; }
    .lc-under_review { background: #e9d5ff; color: #6b21a8; }
    .lc-approved { background: #d1fae5; color: #065f46; }
    .lc-superseded { background: #fef3c7; color: #92400e; }
    .lc-retired { background: #e2e8f0; color: #475569; }

    .pr-critical { background: #fecaca; color: #991b1b; }
    .pr-high { background: #fed7aa; color: #9a3412; }
    .pr-medium { background: #fef3c7; color: #92400e; }
    .pr-low { background: #d1fae5; color: #065f46; }

    .cls-critical { background: #fecaca; color: #991b1b; }
    .cls-major { background: #fed7aa; color: #9a3412; }
    .cls-minor { background: #fef3c7; color: #92400e; }
    .cls-observation { background: #e2e8f0; color: #475569; }
    .cls-ofi { background: #d1fae5; color: #065f46; }

    .fst-open { background: #fecaca; color: #991b1b; }
    .fst-capa_assigned { background: #dbeafe; color: #1e40af; }
    .fst-in_progress { background: #fef3c7; color: #92400e; }
    .fst-verification { background: #e9d5ff; color: #6b21a8; }
    .fst-closed { background: #d1fae5; color: #065f46; }
  `],
})
export class AuditDetailComponent implements OnInit {
  audit: Audit | null = null;
  findings: AuditFinding[] = [];
  selectedFinding: AuditFinding | null = null;
  findingCols = ['findingNumber', 'title', 'classification', 'area', 'status', 'actions'];
  statuses = ['PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'REPORT_DRAFTING', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'];

  // Finding form
  showFindingForm = false;
  newFinding = { title: '', description: '', classification: 'MAJOR', area: '', objectiveEvidence: '', standardReference: '', capaRequired: false };

  // Report
  reportData = { executiveSummary: '', findingsSummary: '', proposedAction: '' };

  // Response & verification forms
  showResponseForm = false;
  responseText = '';
  showVerifyForm = false;
  verificationComments = '';

  constructor(
    private route: ActivatedRoute,
    private auditService: AuditService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAudit(id);
    this.loadFindings(id);
  }

  private loadAudit(id: string): void {
    this.auditService.getAudit(id).subscribe(a => {
      this.audit = a;
      this.reportData = {
        executiveSummary: a.executiveSummary || '',
        findingsSummary: a.findingsSummary || '',
        proposedAction: a.proposedAction || '',
      };
    });
  }

  private loadFindings(id: string): void {
    this.auditService.listFindings(id).subscribe(f => this.findings = f);
  }

  changeStatus(status: string): void {
    if (!this.audit) return;
    this.auditService.transitionStatus(this.audit.id, status).subscribe({
      next: (a) => {
        this.audit = a;
        this.snackBar.open(`Status changed to ${this.formatEnum(status)}`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || err.error?.error || 'Status change failed', 'Dismiss', { duration: 5000 });
      }
    });
  }

  // ─── Finding CRUD ──────────────────────────────────────────────

  submitFinding(): void {
    if (!this.audit) return;
    this.auditService.createFinding(this.audit.id, this.newFinding).subscribe(f => {
      this.findings = [...this.findings, f];
      this.showFindingForm = false;
      this.newFinding = { title: '', description: '', classification: 'MAJOR', area: '', objectiveEvidence: '', standardReference: '', capaRequired: false };
      this.snackBar.open(`Finding ${f.findingNumber} recorded`, 'OK', { duration: 3000 });
    });
  }

  selectFinding(finding: AuditFinding): void {
    this.selectedFinding = finding;
    this.showResponseForm = false;
    this.showVerifyForm = false;
  }

  // ─── Finding Actions ──────────────────────────────────────────

  respondToFinding(finding: AuditFinding): void {
    this.selectedFinding = finding;
    this.showResponseForm = true;
    this.showVerifyForm = false;
    this.responseText = finding.auditeeResponse || '';
  }

  submitResponse(): void {
    if (!this.selectedFinding) return;
    this.auditService.updateFinding(this.selectedFinding.id, {
      auditeeResponse: this.responseText,
      status: 'IN_PROGRESS',
    }).subscribe(f => {
      this.refreshFinding(f);
      this.showResponseForm = false;
      this.snackBar.open('Response submitted', 'OK', { duration: 3000 });
    });
  }

  markForVerification(finding: AuditFinding): void {
    this.auditService.updateFinding(finding.id, { status: 'VERIFICATION' }).subscribe(f => {
      this.refreshFinding(f);
      this.snackBar.open(`${f.findingNumber} sent for verification`, 'OK', { duration: 3000 });
    });
  }

  verifyFinding(finding: AuditFinding): void {
    this.selectedFinding = finding;
    this.showVerifyForm = true;
    this.showResponseForm = false;
    this.verificationComments = '';
  }

  submitVerification(): void {
    if (!this.selectedFinding) return;
    this.auditService.verifyFinding(this.selectedFinding.id, this.verificationComments).subscribe(f => {
      this.refreshFinding(f);
      this.showVerifyForm = false;
      this.snackBar.open(`${f.findingNumber} verified and closed`, 'OK', { duration: 3000 });
    });
  }

  initiateCapaForFinding(finding: AuditFinding): void {
    if (!confirm(`Initiate CAPA for finding ${finding.findingNumber}?`)) return;
    this.auditService.initiateCapaFromFinding(finding.id).subscribe(f => {
      this.refreshFinding(f);
      this.snackBar.open(`CAPA initiated for ${f.findingNumber}`, 'View CAPA', { duration: 5000 });
    });
  }

  // ─── Report ────────────────────────────────────────────────────

  saveReport(): void {
    if (!this.audit) return;
    this.auditService.updateAudit(this.audit.id, this.reportData).subscribe(a => {
      this.audit = a;
      this.snackBar.open('Report saved', 'OK', { duration: 3000 });
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private refreshFinding(updated: AuditFinding): void {
    const idx = this.findings.findIndex(f => f.id === updated.id);
    if (idx >= 0) this.findings[idx] = updated;
    this.findings = [...this.findings];
    if (this.selectedFinding?.id === updated.id) this.selectedFinding = updated;
  }

  formatEnum(value: string | null): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
