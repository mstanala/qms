import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Complaint, ComplaintService, WorkflowStep } from '../../services/complaint.service';
import { CoreLookupService } from '../../../shared/core-lookup.service';

interface StepDef { key: string; label: string; icon: string }

@Component({
  selector: 'qms-complaint-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTabsModule, MatProgressBarModule],
  template: `
    <div class="page" *ngIf="complaint">
      <div class="page-header">
        <div>
          <h1>{{ complaint.title }}</h1>
          <span class="subtitle">{{ complaint.complaintNumber }} &middot; {{ label(complaint.complaintType) }} &middot;
            <mat-chip [class]="'chip-' + complaint.status.toLowerCase()">{{ label(complaint.status) }}</mat-chip>
          </span>
        </div>
        <div class="actions">
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Overview -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Complaint Details</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Status</label><mat-chip [class]="'chip-' + complaint.status.toLowerCase()">{{ label(complaint.status) }}</mat-chip></div>
                <div><label>Priority</label><span>{{ complaint.priority }}</span></div>
                <div><label>Source</label><span>{{ label(complaint.source) }}</span></div>
                <div><label>Classification</label><span>{{ complaint.classification || '-' }}</span></div>
                <div><label>Reporter</label><span>{{ complaint.reporterName || '-' }}</span></div>
                <div><label>Reporter Contact</label><span>{{ complaint.reporterContact || '-' }}</span></div>
                <div><label>Received</label><span>{{ complaint.receivedDate | date:'mediumDate' }}</span></div>
                <div><label>Product</label><span>{{ complaint.productName || '-' }}</span></div>
                <div><label>Batch</label><span>{{ complaint.batchNumber || '-' }}</span></div>
                <div><label>Owner</label><span>{{ complaint.owner?.displayName || '-' }}</span></div>
                <div><label>Department</label><span>{{ complaint.department?.name || '-' }}</span></div>
                <div><label>Site</label><span>{{ complaint.plantSite?.name || '-' }}</span></div>
                <div class="wide"><label>Description</label><span>{{ complaint.description }}</span></div>
              </mat-card-content>
            </mat-card>

            <!-- Adverse Event Info -->
            <mat-card *ngIf="complaint.isAdverseEvent" class="mt-16">
              <mat-card-header><mat-card-title>Adverse Event</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Adverse Event</label><span>Yes</span></div>
                <div><label>Reported</label><span>{{ complaint.adverseEventReported ? 'Yes' : 'No' }}</span></div>
                <div><label>Regulatory Reportable</label><span>{{ complaint.regulatoryReportable ? 'Yes' : 'No' }}</span></div>
                <div><label>Reporting Deadline</label><span>{{ complaint.reportingDeadline | date:'mediumDate' }}</span></div>
                <div><label>Field Alert Required</label><span>{{ complaint.fieldAlertRequired ? 'Yes' : 'No' }}</span></div>
              </mat-card-content>
            </mat-card>

            <!-- Investigation Summary -->
            <mat-card *ngIf="complaint.rootCause || complaint.conclusion" class="mt-16">
              <mat-card-header><mat-card-title>Investigation Summary</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Investigation Start</label><span>{{ complaint.investigationStart | date:'medium' }}</span></div>
                <div><label>Investigation Complete</label><span>{{ (complaint.investigationComplete | date:'medium') || 'In Progress' }}</span></div>
                <div class="wide"><label>Root Cause</label><span>{{ complaint.rootCause || '-' }}</span></div>
                <div class="wide"><label>Conclusion</label><span>{{ complaint.conclusion || '-' }}</span></div>
                <div><label>CAPA Required</label><span>{{ complaint.capaRequired ? 'Yes' : 'No' }}</span></div>
                <div><label>Recall Assessment</label><span>{{ label(complaint.recallAssessment || 'NO_RECALL') }}</span></div>
              </mat-card-content>
            </mat-card>

            <!-- Response -->
            <mat-card *ngIf="complaint.responseText" class="mt-16">
              <mat-card-header><mat-card-title>Response</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Response Sent</label><span>{{ complaint.responseSentDate | date:'medium' }}</span></div>
                <div class="wide"><label>Response Text</label><span>{{ complaint.responseText }}</span></div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Complaint Workflow -->
        <mat-tab label="Complaint Workflow">
          <div class="tab-content">
            <!-- Step Tracker -->
            <div class="step-tracker">
              <div *ngFor="let step of workflowSteps; let i = index" class="step"
                   [class.completed]="getStepState(step.key) === 'completed'"
                   [class.current]="getStepState(step.key) === 'current'"
                   [class.pending]="getStepState(step.key) === 'pending'">
                <div class="step-circle">
                  <mat-icon *ngIf="getStepState(step.key) === 'completed'">check</mat-icon>
                  <span *ngIf="getStepState(step.key) !== 'completed'">{{ i + 1 }}</span>
                </div>
                <div class="step-label">{{ step.label }}</div>
              </div>
            </div>

            <mat-divider class="mt-16 mb-16"></mat-divider>

            <!-- Step 1: Initial Assessment (when RECEIVED) -->
            <mat-card *ngIf="complaint.status === 'RECEIVED'" class="action-card">
              <mat-card-header><mat-card-title>Step 1: Initial Assessment & Classification</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Classification</mat-label>
                    <mat-select [(ngModel)]="assessmentForm.classification">
                      <mat-option value="CRITICAL">Critical</mat-option>
                      <mat-option value="MAJOR">Major</mat-option>
                      <mat-option value="MINOR">Minor</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Investigation Required?</mat-label>
                    <mat-select [(ngModel)]="assessmentForm.investigationRequired">
                      <mat-option [value]="true">Yes</mat-option>
                      <mat-option [value]="false">No</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Adverse Event?</mat-label>
                    <mat-select [(ngModel)]="assessmentForm.isAdverseEvent">
                      <mat-option [value]="true">Yes</mat-option>
                      <mat-option [value]="false">No</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Regulatory Reportable?</mat-label>
                    <mat-select [(ngModel)]="assessmentForm.regulatoryReportable">
                      <mat-option [value]="true">Yes</mat-option>
                      <mat-option [value]="false">No</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" *ngIf="assessmentForm.investigationRequired">
                    <mat-label>Investigator</mat-label>
                    <mat-select [(ngModel)]="assessmentForm.investigatorId">
                      <mat-option *ngFor="let u of users" [value]="u.id">{{ u.displayName }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <button mat-raised-button color="primary" (click)="submitAssessment()">
                  <mat-icon>check_circle</mat-icon> Complete Assessment
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Step 2: Investigation (when UNDER_INVESTIGATION) -->
            <mat-card *ngIf="complaint.status === 'UNDER_INVESTIGATION'" class="action-card">
              <mat-card-header><mat-card-title>Step 2: Investigation</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline" class="wide">
                    <mat-label>Root Cause</mat-label>
                    <textarea matInput rows="3" [(ngModel)]="investigationForm.rootCause"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="wide">
                    <mat-label>Conclusion</mat-label>
                    <textarea matInput rows="3" [(ngModel)]="investigationForm.conclusion"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>CAPA Required?</mat-label>
                    <mat-select [(ngModel)]="investigationForm.capaRequired">
                      <mat-option [value]="true">Yes</mat-option>
                      <mat-option [value]="false">No</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Recall Assessment</mat-label>
                    <mat-select [(ngModel)]="investigationForm.recallAssessment">
                      <mat-option value="NO_RECALL">No Recall</mat-option>
                      <mat-option value="VOLUNTARY">Voluntary Recall</mat-option>
                      <mat-option value="MANDATORY">Mandatory Recall</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <button mat-raised-button color="primary" (click)="submitInvestigation()">
                  <mat-icon>check_circle</mat-icon> Complete Investigation
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Step 3: Disposition Review (when INVESTIGATION_COMPLETE) -->
            <mat-card *ngIf="complaint.status === 'INVESTIGATION_COMPLETE'" class="action-card">
              <mat-card-header><mat-card-title>Step 3: Disposition Review</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="info-grid mb-16">
                  <div class="wide"><label>Root Cause</label><span>{{ complaint.rootCause || '-' }}</span></div>
                  <div class="wide"><label>Conclusion</label><span>{{ complaint.conclusion || '-' }}</span></div>
                  <div><label>CAPA Required</label><span>{{ complaint.capaRequired ? 'Yes' : 'No' }}</span></div>
                  <div><label>Recall Assessment</label><span>{{ label(complaint.recallAssessment || 'NO_RECALL') }}</span></div>
                </div>
                <div class="action-buttons">
                  <button mat-raised-button color="primary" (click)="approveDisposition()">
                    <mat-icon>check</mat-icon> Approve Disposition
                  </button>
                  <button mat-raised-button color="warn" (click)="requestReinvestigation()">
                    <mat-icon>replay</mat-icon> Further Investigation Required
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Step 4: Response Preparation (when RESPONSE_PENDING) -->
            <mat-card *ngIf="complaint.status === 'RESPONSE_PENDING'" class="action-card">
              <mat-card-header><mat-card-title>Step 4: Prepare & Send Response</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline" class="wide">
                    <mat-label>Response to Complainant</mat-label>
                    <textarea matInput rows="4" [(ngModel)]="responseForm.responseText"></textarea>
                  </mat-form-field>
                </div>
                <button mat-raised-button color="primary" (click)="submitResponse()">
                  <mat-icon>send</mat-icon> Send Response
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Step 5: Closure Review (when RESPONSE_SENT) -->
            <mat-card *ngIf="complaint.status === 'RESPONSE_SENT'" class="action-card">
              <mat-card-header><mat-card-title>Step 5: Final Review & Closure</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="info-grid mb-16">
                  <div><label>Classification</label><span>{{ complaint.classification }}</span></div>
                  <div><label>Root Cause</label><span>{{ complaint.rootCause || '-' }}</span></div>
                  <div><label>Response Sent</label><span>{{ complaint.responseSentDate | date:'medium' }}</span></div>
                  <div><label>CAPA Linked</label><span>{{ complaint.capaId ? 'Yes' : 'No' }}</span></div>
                  <div *ngIf="complaint.isAdverseEvent"><label>Adverse Event Reported</label><span>{{ complaint.adverseEventReported ? 'Yes' : 'No' }}</span></div>
                </div>
                <button mat-raised-button color="primary" (click)="closeComplaint()">
                  <mat-icon>check_circle</mat-icon> Close Complaint
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Completed message -->
            <mat-card *ngIf="complaint.status === 'CLOSED'" class="action-card">
              <mat-card-content class="completed-message">
                <mat-icon color="primary">verified</mat-icon>
                <span>Complaint closed on {{ complaint.closedDate | date:'medium' }}</span>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 3: Workflow History -->
        <mat-tab label="Workflow History">
          <div class="tab-content">
            <div class="timeline" *ngIf="history.length > 0">
              <div *ngFor="let step of history" class="timeline-item" [class.current]="step.status === 'CURRENT'">
                <div class="timeline-dot" [class.completed]="step.status === 'COMPLETED'" [class.current]="step.status === 'CURRENT'"></div>
                <div class="timeline-content">
                  <strong>{{ step.stepName }}</strong>
                  <span class="meta">{{ step.status }} &middot; {{ step.createdAt | date:'medium' }}</span>
                  <span class="meta" *ngIf="step.performedBy">by {{ step.performedBy.displayName }}</span>
                  <span class="comment" *ngIf="step.comments">{{ step.comments }}</span>
                </div>
              </div>
            </div>
            <p *ngIf="history.length === 0" class="empty-state">No workflow history available.</p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
    h1 { margin: 0; font-size: 24px; }
    .subtitle { color: #667085; }
    .actions { display: flex; gap: 8px; }
    .tab-content { padding: 16px 0; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
    .info-grid label { display: block; color: #667085; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .wide { grid-column: 1 / -1; }
    .mt-16 { margin-top: 16px; }
    .mb-16 { margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .action-card { margin-top: 16px; }
    .action-buttons { display: flex; gap: 12px; }

    /* Step Tracker */
    .step-tracker { display: flex; align-items: flex-start; gap: 0; overflow-x: auto; padding: 16px 0; }
    .step { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 100px; position: relative; }
    .step:not(:last-child)::after { content: ''; position: absolute; top: 18px; left: 50%; width: 100%; height: 2px; background: #e0e0e0; z-index: 0; }
    .step.completed:not(:last-child)::after { background: #4caf50; }
    .step-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; z-index: 1; background: #e0e0e0; color: #999; }
    .step.completed .step-circle { background: #4caf50; color: #fff; }
    .step.current .step-circle { background: #1976d2; color: #fff; animation: pulse 2s infinite; }
    .step.pending .step-circle { background: #e0e0e0; color: #999; }
    .step-label { margin-top: 8px; font-size: 12px; text-align: center; color: #667085; }
    .step.completed .step-label { color: #4caf50; font-weight: 500; }
    .step.current .step-label { color: #1976d2; font-weight: 600; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(25,118,210,.4); } 50% { box-shadow: 0 0 0 8px rgba(25,118,210,0); } }

    .completed-message { display: flex; align-items: center; gap: 12px; font-size: 16px; padding: 16px; }

    /* Workflow History Timeline */
    .timeline { position: relative; padding-left: 28px; }
    .timeline-item { position: relative; padding-bottom: 20px; padding-left: 16px; border-left: 2px solid #e0e0e0; }
    .timeline-item:last-child { border-left: 2px solid transparent; }
    .timeline-dot { position: absolute; left: -8px; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #e0e0e0; border: 2px solid #fff; }
    .timeline-dot.completed { background: #4caf50; }
    .timeline-dot.current { background: #1976d2; }
    .timeline-content { display: flex; flex-direction: column; gap: 2px; }
    .timeline-content strong { font-size: 14px; }
    .meta { font-size: 12px; color: #667085; }
    .comment { font-size: 13px; color: #333; margin-top: 2px; }
    .empty-state { color: #999; text-align: center; padding: 32px; }

    .chip-received { background: #e3f2fd !important; }
    .chip-classified { background: #fff3e0 !important; }
    .chip-under_investigation { background: #fff9c4 !important; }
    .chip-investigation_complete { background: #e8f5e9 !important; }
    .chip-response_pending { background: #f3e5f5 !important; }
    .chip-response_sent { background: #bbdefb !important; }
    .chip-closed { background: #f5f5f5 !important; }
  `]
})
export class ComplaintDetailComponent implements OnInit {
  complaint: Complaint | null = null;
  history: WorkflowStep[] = [];
  users: { id: string; displayName: string }[] = [];

  workflowSteps: StepDef[] = [
    { key: 'received', label: 'Received', icon: 'inbox' },
    { key: 'assessment', label: 'Initial Assessment', icon: 'assignment' },
    { key: 'investigation', label: 'Investigation', icon: 'search' },
    { key: 'disposition', label: 'Disposition Review', icon: 'rate_review' },
    { key: 'response', label: 'Response', icon: 'send' },
    { key: 'closure', label: 'Closure', icon: 'check_circle' },
  ];

  workflowStepMap: Record<string, string> = {
    'Received': 'received',
    'Initial Assessment': 'assessment',
    'Investigation': 'investigation',
    'Disposition Review': 'disposition',
    'Response Preparation': 'response',
    'Closure Review': 'closure',
    'Closed': 'closure',
  };

  assessmentForm = {
    classification: 'MAJOR' as string,
    investigationRequired: true,
    isAdverseEvent: false,
    regulatoryReportable: false,
    investigatorId: '' as string,
  };

  investigationForm = {
    rootCause: '',
    conclusion: '',
    capaRequired: false,
    recallAssessment: 'NO_RECALL',
  };

  responseForm = {
    responseText: '',
  };

  constructor(
    private route: ActivatedRoute,
    private complaintService: ComplaintService,
    private lookupService: CoreLookupService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
    this.lookupService.users().subscribe(page => this.users = page.content.map(u => ({ id: u.id, displayName: u.displayName || u.username || '' })));
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.complaintService.getById(id).subscribe(c => {
      this.complaint = c;
      if (c.rootCause) this.investigationForm.rootCause = c.rootCause;
      if (c.conclusion) this.investigationForm.conclusion = c.conclusion;
      if (c.capaRequired) this.investigationForm.capaRequired = c.capaRequired;
      if (c.recallAssessment) this.investigationForm.recallAssessment = c.recallAssessment;
      if (c.responseText) this.responseForm.responseText = c.responseText;
    });
    this.complaintService.getWorkflowHistory(id).subscribe(h => this.history = h);
  }

  getStepState(stepKey: string): 'completed' | 'current' | 'pending' {
    if (!this.complaint) return 'pending';
    const currentKey = this.workflowStepMap[this.complaint.currentWorkflowStep] || 'received';
    const stepIndex = this.workflowSteps.findIndex(s => s.key === stepKey);
    const currentIndex = this.workflowSteps.findIndex(s => s.key === currentKey);
    if (this.complaint.status === 'CLOSED') return 'completed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }

  submitAssessment(): void {
    if (!this.complaint) return;
    // First update the complaint with assessment fields
    this.complaintService.update(this.complaint.id, {
      classification: this.assessmentForm.classification,
      investigationRequired: this.assessmentForm.investigationRequired,
      isAdverseEvent: this.assessmentForm.isAdverseEvent,
      regulatoryReportable: this.assessmentForm.regulatoryReportable,
      ...(this.assessmentForm.investigatorId ? { investigatorId: this.assessmentForm.investigatorId } : {}),
    }).subscribe(() => {
      // Then transition status
      this.complaintService.transitionStatus(this.complaint!.id, 'CLASSIFIED').subscribe(() => {
        this.snackBar.open('Assessment completed', 'Dismiss', { duration: 3000 });
        this.load();
      });
    });
  }

  submitInvestigation(): void {
    if (!this.complaint) return;
    this.complaintService.update(this.complaint.id, {
      rootCause: this.investigationForm.rootCause,
      conclusion: this.investigationForm.conclusion,
      capaRequired: this.investigationForm.capaRequired,
      recallAssessment: this.investigationForm.recallAssessment,
    }).subscribe(() => {
      this.complaintService.transitionStatus(this.complaint!.id, 'INVESTIGATION_COMPLETE').subscribe(() => {
        this.snackBar.open('Investigation completed', 'Dismiss', { duration: 3000 });
        this.load();
      });
    });
  }

  approveDisposition(): void {
    if (!this.complaint) return;
    this.complaintService.transitionStatus(this.complaint.id, 'RESPONSE_PENDING').subscribe(() => {
      this.snackBar.open('Disposition approved', 'Dismiss', { duration: 3000 });
      this.load();
    });
  }

  requestReinvestigation(): void {
    if (!this.complaint) return;
    this.complaintService.transitionStatus(this.complaint.id, 'UNDER_INVESTIGATION', { comments: 'Further investigation required' }).subscribe(() => {
      this.snackBar.open('Sent back for further investigation', 'Dismiss', { duration: 3000 });
      this.load();
    });
  }

  submitResponse(): void {
    if (!this.complaint) return;
    this.complaintService.update(this.complaint.id, {
      responseText: this.responseForm.responseText,
    }).subscribe(() => {
      this.complaintService.transitionStatus(this.complaint!.id, 'RESPONSE_SENT').subscribe(() => {
        this.snackBar.open('Response sent', 'Dismiss', { duration: 3000 });
        this.load();
      });
    });
  }

  closeComplaint(): void {
    if (!this.complaint) return;
    this.complaintService.transitionStatus(this.complaint.id, 'CLOSED').subscribe(() => {
      this.snackBar.open('Complaint closed', 'Dismiss', { duration: 3000 });
      this.load();
    });
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }
}
