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
import { Nonconformance, NonconformanceService, WorkflowStep } from '../../services/nonconformance.service';
import { CoreLookupService } from '../../../shared/core-lookup.service';

interface StepDef { key: string; label: string; icon: string }

@Component({
  selector: 'qms-nc-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTabsModule, MatProgressBarModule],
  template: `
    <div class="page" *ngIf="nc">
      <div class="page-header">
        <div>
          <h1>{{ nc.title }}</h1>
          <span class="subtitle">{{ nc.ncNumber }} &middot; {{ label(nc.ncType) }} &middot;
            <mat-chip [class]="'chip-' + nc.status.toLowerCase()">{{ label(nc.status) }}</mat-chip>
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
              <mat-card-header><mat-card-title>Record Overview</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Status</label><mat-chip [class]="'chip-' + nc.status.toLowerCase()">{{ label(nc.status) }}</mat-chip></div>
                <div><label>Priority</label><span>{{ nc.priority }}</span></div>
                <div><label>Classification</label><span>{{ nc.classification || '-' }}</span></div>
                <div><label>Hold Status</label><span>{{ label(nc.holdStatus || 'NONE') }}</span></div>
                <div><label>Product</label><span>{{ nc.productName || '-' }}</span></div>
                <div><label>Batch</label><span>{{ nc.batchNumber || '-' }}</span></div>
                <div><label>Quantity Affected</label><span>{{ nc.quantityAffected || '-' }}</span></div>
                <div><label>Stage Detected</label><span>{{ nc.stageDetected || '-' }}</span></div>
                <div><label>Owner</label><span>{{ nc.owner?.displayName || '-' }}</span></div>
                <div><label>Department</label><span>{{ nc.department?.name || '-' }}</span></div>
                <div><label>Site</label><span>{{ nc.plantSite?.name || '-' }}</span></div>
                <div><label>Detected Location</label><span>{{ nc.detectedLocation || '-' }}</span></div>
                <div class="wide"><label>Description</label><span>{{ nc.description }}</span></div>
              </mat-card-content>
            </mat-card>

            <!-- Disposition Info -->
            <mat-card *ngIf="nc.dispositionDecision" class="mt-16">
              <mat-card-header><mat-card-title>Disposition</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Decision</label><span>{{ label(nc.dispositionDecision) }}</span></div>
                <div><label>Approved By</label><span>{{ nc.dispositionApprovedBy?.displayName || '-' }}</span></div>
                <div><label>Date</label><span>{{ nc.dispositionDate | date:'mediumDate' }}</span></div>
                <div class="wide"><label>Justification</label><span>{{ nc.dispositionJustification || '-' }}</span></div>
              </mat-card-content>
            </mat-card>

            <!-- Hold Info -->
            <mat-card *ngIf="nc.holdStatus !== 'NONE'" class="mt-16">
              <mat-card-header><mat-card-title>Material Hold</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Hold Status</label><span>{{ label(nc.holdStatus) }}</span></div>
                <div><label>Location</label><span>{{ nc.holdLocation || '-' }}</span></div>
                <div><label>Placed On</label><span>{{ nc.holdInitiatedDate | date:'medium' }}</span></div>
                <div *ngIf="nc.holdReleasedDate"><label>Released On</label><span>{{ nc.holdReleasedDate | date:'medium' }}</span></div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: NC Workflow -->
        <mat-tab label="NC Workflow">
          <div class="tab-content">
            <!-- Step Tracker -->
            <div class="step-tracker">
              <div *ngFor="let step of workflowSteps; let i = index" class="step"
                   [class.completed]="getStepState(step.key) === 'completed'"
                   [class.current]="getStepState(step.key) === 'current'"
                   [class.pending]="getStepState(step.key) === 'pending'"
                   [class.void]="nc.status === 'VOID' && step.key === 'review'">
                <div class="step-circle">
                  <mat-icon *ngIf="getStepState(step.key) === 'completed'">check</mat-icon>
                  <mat-icon *ngIf="nc.status === 'VOID' && step.key === 'review'">close</mat-icon>
                  <span *ngIf="getStepState(step.key) !== 'completed' && !(nc.status === 'VOID' && step.key === 'review')">{{ i + 1 }}</span>
                </div>
                <div class="step-label">{{ step.label }}</div>
              </div>
            </div>

            <mat-divider class="mt-16 mb-16"></mat-divider>

            <!-- Material Hold Controls (available in most steps) -->
            <mat-card *ngIf="nc.status !== 'CLOSED' && nc.status !== 'VOID'" class="action-card">
              <mat-card-header><mat-card-title>Material Hold</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="info-grid mb-16">
                  <div><label>Current Hold</label><span>{{ label(nc.holdStatus || 'NONE') }}</span></div>
                  <div *ngIf="nc.holdLocation"><label>Location</label><span>{{ nc.holdLocation }}</span></div>
                </div>
                <div class="action-buttons" *ngIf="nc.holdStatus === 'NONE'">
                  <mat-form-field appearance="outline">
                    <mat-label>Hold Location</mat-label>
                    <input matInput [(ngModel)]="holdForm.holdLocation">
                  </mat-form-field>
                  <button mat-raised-button color="warn" (click)="placeHold()">
                    <mat-icon>lock</mat-icon> Place Hold
                  </button>
                </div>
                <button mat-stroked-button *ngIf="nc.holdStatus === 'HOLD'" (click)="releaseHold()">
                  <mat-icon>lock_open</mat-icon> Release Hold
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Step 1: Initial Review (when IDENTIFIED) -->
            <mat-card *ngIf="nc.status === 'IDENTIFIED'" class="action-card">
              <mat-card-header><mat-card-title>Step 1: Initial Review and Classification</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Classification</mat-label>
                    <mat-select [(ngModel)]="reviewForm.classification">
                      <mat-option value="CRITICAL">Critical</mat-option>
                      <mat-option value="MAJOR">Major</mat-option>
                      <mat-option value="MINOR">Minor</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Priority</mat-label>
                    <mat-select [(ngModel)]="reviewForm.priority">
                      <mat-option value="CRITICAL">Critical</mat-option>
                      <mat-option value="HIGH">High</mat-option>
                      <mat-option value="MEDIUM">Medium</mat-option>
                      <mat-option value="LOW">Low</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="action-buttons">
                  <button mat-raised-button color="primary" (click)="approveReview()">
                    <mat-icon>check_circle</mat-icon> Valid - Proceed to Investigation
                  </button>
                  <button mat-raised-button color="warn" (click)="voidNC()">
                    <mat-icon>cancel</mat-icon> Void NC
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Step 2: Investigation (when UNDER_REVIEW) -->
            <mat-card *ngIf="nc.status === 'UNDER_REVIEW'" class="action-card">
              <mat-card-header><mat-card-title>Step 2: Investigation</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline" class="wide">
                    <mat-label>Root Cause / Investigation Findings</mat-label>
                    <textarea matInput rows="3" [(ngModel)]="investigationForm.rootCause"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>CAPA Required?</mat-label>
                    <mat-select [(ngModel)]="investigationForm.capaRequired">
                      <mat-option [value]="true">Yes</mat-option>
                      <mat-option [value]="false">No</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Link to Deviation (optional)</mat-label>
                    <input matInput [(ngModel)]="investigationForm.deviationId" placeholder="Deviation UUID">
                  </mat-form-field>
                </div>
                <button mat-raised-button color="primary" (click)="completeInvestigation()">
                  <mat-icon>check_circle</mat-icon> Complete Investigation
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Step 3: Disposition Review (when INVESTIGATION_COMPLETE) -->
            <mat-card *ngIf="nc.status === 'INVESTIGATION_COMPLETE'" class="action-card">
              <mat-card-header><mat-card-title>Step 3: Disposition Decision</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="info-grid mb-16">
                  <div class="wide"><label>Investigation Findings</label><span>{{ nc.dispositionJustification || '-' }}</span></div>
                  <div><label>CAPA Required</label><span>{{ nc.capaRequired ? 'Yes' : 'No' }}</span></div>
                </div>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Disposition Decision</mat-label>
                    <mat-select [(ngModel)]="dispositionForm.dispositionDecision">
                      <mat-option value="USE_AS_IS">Use As Is</mat-option>
                      <mat-option value="REWORK">Rework</mat-option>
                      <mat-option value="REPROCESS">Reprocess</mat-option>
                      <mat-option value="RETURN_TO_SUPPLIER">Return to Supplier</mat-option>
                      <mat-option value="REJECT">Reject / Scrap</mat-option>
                      <mat-option value="RELEASE_WITH_CONDITIONS">Release with Conditions</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="wide">
                    <mat-label>Justification</mat-label>
                    <textarea matInput rows="3" [(ngModel)]="dispositionForm.dispositionJustification"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>CAPA Required?</mat-label>
                    <mat-select [(ngModel)]="dispositionForm.capaRequired">
                      <mat-option [value]="true">Yes</mat-option>
                      <mat-option [value]="false">No</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <button mat-raised-button color="primary" (click)="submitDisposition()" [disabled]="!dispositionForm.dispositionDecision">
                  <mat-icon>approval</mat-icon> Submit Disposition
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Step 4a: CAPA Initiation (when CAPA_PENDING) -->
            <mat-card *ngIf="nc.status === 'CAPA_PENDING'" class="action-card">
              <mat-card-header><mat-card-title>Step 4: CAPA Initiation</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="info-grid mb-16">
                  <div><label>Disposition</label><span>{{ label(nc.dispositionDecision || '-') }}</span></div>
                  <div class="wide"><label>Justification</label><span>{{ nc.dispositionJustification || '-' }}</span></div>
                </div>
                <p class="hint">Create a CAPA record linked to this NC, then proceed to closure.</p>
                <button mat-raised-button color="primary" (click)="completeCapaInitiation()">
                  <mat-icon>check_circle</mat-icon> CAPA Initiated - Proceed to Closure
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Step 5: Final Review & Closure (when PENDING_CLOSURE) -->
            <mat-card *ngIf="nc.status === 'PENDING_CLOSURE'" class="action-card">
              <mat-card-header><mat-card-title>Step 5: Final Review and Closure</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="info-grid mb-16">
                  <div><label>Classification</label><span>{{ nc.classification || '-' }}</span></div>
                  <div><label>Disposition</label><span>{{ label(nc.dispositionDecision || '-') }}</span></div>
                  <div><label>Hold Status</label><span>{{ label(nc.holdStatus) }}</span></div>
                  <div><label>CAPA Required</label><span>{{ nc.capaRequired ? 'Yes' : 'No' }}</span></div>
                  <div *ngIf="nc.capaId"><label>CAPA Linked</label><span>Yes</span></div>
                </div>
                <div *ngIf="nc.holdStatus === 'HOLD'" class="hold-warning mb-16">
                  <mat-icon>warning</mat-icon> Material is still on hold. Consider releasing before closure.
                </div>
                <button mat-raised-button color="primary" (click)="closeNC()">
                  <mat-icon>check_circle</mat-icon> Close Nonconformance
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Voided message -->
            <mat-card *ngIf="nc.status === 'VOID'" class="action-card">
              <mat-card-content class="completed-message void-message">
                <mat-icon>cancel</mat-icon>
                <span>This nonconformance has been voided.</span>
              </mat-card-content>
            </mat-card>

            <!-- Completed message -->
            <mat-card *ngIf="nc.status === 'CLOSED'" class="action-card">
              <mat-card-content class="completed-message">
                <mat-icon color="primary">verified</mat-icon>
                <span>NC closed on {{ nc.closedDate | date:'medium' }}</span>
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
                  <span class="meta">{{ step.status }} &middot; {{ step.startedAt | date:'medium' }}</span>
                  <span class="meta" *ngIf="step.assignedTo">Assigned to: {{ step.assignedTo.displayName }}</span>
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
    .action-buttons { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .hint { font-size: 13px; color: #667085; margin-bottom: 12px; }

    /* Step Tracker */
    .step-tracker { display: flex; align-items: flex-start; gap: 0; overflow-x: auto; padding: 16px 0; }
    .step { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 90px; position: relative; }
    .step:not(:last-child)::after { content: ''; position: absolute; top: 18px; left: 50%; width: 100%; height: 2px; background: #e0e0e0; z-index: 0; }
    .step.completed:not(:last-child)::after { background: #4caf50; }
    .step-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; z-index: 1; background: #e0e0e0; color: #999; }
    .step.completed .step-circle { background: #4caf50; color: #fff; }
    .step.current .step-circle { background: #1976d2; color: #fff; animation: pulse 2s infinite; }
    .step.pending .step-circle { background: #e0e0e0; color: #999; }
    .step.void .step-circle { background: #f44336; color: #fff; }
    .step-label { margin-top: 8px; font-size: 11px; text-align: center; color: #667085; }
    .step.completed .step-label { color: #4caf50; font-weight: 500; }
    .step.current .step-label { color: #1976d2; font-weight: 600; }
    .step.void .step-label { color: #f44336; font-weight: 500; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(25,118,210,.4); } 50% { box-shadow: 0 0 0 8px rgba(25,118,210,0); } }

    .completed-message { display: flex; align-items: center; gap: 12px; font-size: 16px; padding: 16px; }
    .void-message mat-icon { color: #f44336; }

    .hold-warning { display: flex; align-items: center; gap: 8px; color: #ed6c02; font-size: 13px; background: #fff3e0; padding: 8px 12px; border-radius: 4px; }

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

    .chip-identified { background: #e3f2fd !important; }
    .chip-under_review { background: #fff3e0 !important; }
    .chip-investigation_complete { background: #e8f5e9 !important; }
    .chip-disposition { background: #f3e5f5 !important; }
    .chip-capa_pending { background: #fff9c4 !important; }
    .chip-pending_closure { background: #bbdefb !important; }
    .chip-closed { background: #f5f5f5 !important; }
    .chip-void { background: #ffcdd2 !important; color: #b71c1c !important; }
  `],
})
export class NcDetailComponent implements OnInit {
  nc: Nonconformance | null = null;
  history: WorkflowStep[] = [];
  users: { id: string; displayName: string }[] = [];

  workflowSteps: StepDef[] = [
    { key: 'identified', label: 'Identified', icon: 'report' },
    { key: 'review', label: 'Initial Review', icon: 'rate_review' },
    { key: 'investigation', label: 'Investigation', icon: 'search' },
    { key: 'disposition', label: 'Disposition', icon: 'approval' },
    { key: 'closure', label: 'Closure', icon: 'check_circle' },
  ];

  workflowStepMap: Record<string, string> = {
    'Identified': 'identified',
    'Initial Review': 'review',
    'Investigation': 'investigation',
    'Disposition Review': 'disposition',
    'CAPA Initiation': 'disposition',
    'Closure Review': 'closure',
    'Closed': 'closure',
    'Voided': 'review',
  };

  reviewForm = {
    classification: 'MAJOR' as string,
    priority: 'MEDIUM' as string,
  };

  investigationForm = {
    rootCause: '',
    capaRequired: false,
    deviationId: '',
  };

  dispositionForm = {
    dispositionDecision: 'USE_AS_IS' as string,
    dispositionJustification: '',
    capaRequired: false,
  };

  holdForm = {
    holdLocation: 'Quarantine Area',
  };

  constructor(
    private route: ActivatedRoute,
    private ncService: NonconformanceService,
    private lookupService: CoreLookupService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
    this.lookupService.users().subscribe(page =>
      this.users = page.content.map(u => ({ id: u.id, displayName: u.displayName || u.username || '' }))
    );
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ncService.getById(id).subscribe(nc => {
      this.nc = nc;
      if (nc.capaRequired) this.investigationForm.capaRequired = nc.capaRequired;
      if (nc.capaRequired) this.dispositionForm.capaRequired = nc.capaRequired;
    });
    this.ncService.getWorkflowHistory(id).subscribe(h => this.history = h);
  }

  getStepState(stepKey: string): 'completed' | 'current' | 'pending' {
    if (!this.nc) return 'pending';
    if (this.nc.status === 'CLOSED') return 'completed';
    if (this.nc.status === 'VOID') {
      if (stepKey === 'identified') return 'completed';
      return 'pending';
    }
    const currentKey = this.workflowStepMap[this.nc.currentWorkflowStep || 'Identified'] || 'identified';
    const stepIndex = this.workflowSteps.findIndex(s => s.key === stepKey);
    const currentIndex = this.workflowSteps.findIndex(s => s.key === currentKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }

  approveReview(): void {
    if (!this.nc) return;
    this.ncService.update(this.nc.id, {
      classification: this.reviewForm.classification,
      priority: this.reviewForm.priority,
    }).subscribe(() => {
      this.ncService.transitionStatus(this.nc!.id, 'UNDER_REVIEW').subscribe(() => {
        this.snackBar.open('NC classified - investigation started', 'Dismiss', { duration: 3000 });
        this.load();
      });
    });
  }

  voidNC(): void {
    if (!this.nc) return;
    this.ncService.transitionStatus(this.nc.id, 'VOID').subscribe(() => {
      this.snackBar.open('NC voided', 'Dismiss', { duration: 3000 });
      this.load();
    });
  }

  completeInvestigation(): void {
    if (!this.nc) return;
    const updatePayload: Record<string, unknown> = {
      rootCause: this.investigationForm.rootCause,
      capaRequired: this.investigationForm.capaRequired,
    };
    if (this.investigationForm.deviationId) {
      updatePayload['deviationId'] = this.investigationForm.deviationId;
    }
    this.ncService.update(this.nc.id, updatePayload).subscribe(() => {
      this.ncService.transitionStatus(this.nc!.id, 'INVESTIGATION_COMPLETE').subscribe(() => {
        this.snackBar.open('Investigation completed', 'Dismiss', { duration: 3000 });
        this.load();
      });
    });
  }

  submitDisposition(): void {
    if (!this.nc) return;
    this.ncService.transitionStatus(this.nc.id, 'DISPOSITION', {
      dispositionDecision: this.dispositionForm.dispositionDecision,
      dispositionJustification: this.dispositionForm.dispositionJustification,
      capaRequired: this.dispositionForm.capaRequired,
    }).subscribe(() => {
      this.snackBar.open('Disposition submitted', 'Dismiss', { duration: 3000 });
      this.load();
    });
  }

  completeCapaInitiation(): void {
    if (!this.nc) return;
    this.ncService.transitionStatus(this.nc.id, 'PENDING_CLOSURE').subscribe(() => {
      this.snackBar.open('CAPA initiated - proceeding to closure', 'Dismiss', { duration: 3000 });
      this.load();
    });
  }

  closeNC(): void {
    if (!this.nc) return;
    this.ncService.transitionStatus(this.nc.id, 'CLOSED').subscribe(() => {
      this.snackBar.open('Nonconformance closed', 'Dismiss', { duration: 3000 });
      this.load();
    });
  }

  placeHold(): void {
    if (!this.nc) return;
    this.ncService.toggleHold(this.nc.id, { action: 'HOLD', holdLocation: this.holdForm.holdLocation }).subscribe(nc => {
      this.nc = nc;
      this.snackBar.open('Material hold placed', 'Dismiss', { duration: 2500 });
    });
  }

  releaseHold(): void {
    if (!this.nc) return;
    this.ncService.toggleHold(this.nc.id, { action: 'RELEASE' }).subscribe(nc => {
      this.nc = nc;
      this.snackBar.open('Material hold released', 'Dismiss', { duration: 2500 });
    });
  }

  label(value: string): string { return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-'; }
}
