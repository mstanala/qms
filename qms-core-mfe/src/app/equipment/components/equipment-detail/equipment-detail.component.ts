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
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Equipment, EquipmentService, WorkflowStep } from '../../services/equipment.service';

@Component({
  selector: 'qms-equipment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule,
    MatSnackBarModule, MatTabsModule],
  template: `
    <div class="page" *ngIf="equipment">
      <div class="page-header">
        <div>
          <h1>{{ equipment.name }}</h1>
          <span class="subtitle">{{ equipment.equipmentNumber }} &middot; {{ label(equipment.equipmentType) }} &middot;
            <mat-chip [class]="'chip-' + equipment.status.toLowerCase()">{{ label(equipment.status) }}</mat-chip>
          </span>
        </div>
        <div class="actions">
          <button mat-stroked-button [routerLink]="['calibrations']"><mat-icon>fact_check</mat-icon> Calibrations</button>
          <button mat-stroked-button [routerLink]="['maintenance']"><mat-icon>build</mat-icon> Maintenance</button>
          <button mat-stroked-button routerLink="../list"><mat-icon>arrow_back</mat-icon> Back</button>
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Overview -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Equipment Details</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Status</label><mat-chip [class]="'chip-' + equipment.status.toLowerCase()">{{ label(equipment.status) }}</mat-chip></div>
                <div><label>Category</label><span>{{ equipment.category }}</span></div>
                <div><label>Manufacturer</label><span>{{ equipment.manufacturer || '-' }}</span></div>
                <div><label>Model</label><span>{{ equipment.modelNumber || '-' }}</span></div>
                <div><label>Serial</label><span>{{ equipment.serialNumber || '-' }}</span></div>
                <div><label>Asset Tag</label><span>{{ equipment.assetTag || '-' }}</span></div>
                <div><label>Plant Site</label><span>{{ equipment.plantSite?.name || '-' }}</span></div>
                <div><label>Department</label><span>{{ equipment.department?.name || '-' }}</span></div>
                <div><label>Area / Room</label><span>{{ equipment.area || '-' }} / {{ equipment.roomNumber || '-' }}</span></div>
                <div><label>Owner</label><span>{{ equipment.owner?.displayName || '-' }}</span></div>
                <div><label>Installation Date</label><span>{{ equipment.installationDate ? (equipment.installationDate | date:'mediumDate') : '-' }}</span></div>
                <div><label>GxP Relevant</label><span>{{ equipment.gxpRelevant ? 'Yes' : 'No' }}</span></div>
                <div><label>Computerized System</label><span>{{ equipment.computerizedSystem ? 'Yes' : 'No' }}</span></div>
                <div><label>Data Integrity Class</label><span>{{ label(equipment.dataIntegrityClass || 'NOT_SET') }}</span></div>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Calibration & Maintenance Status</mat-card-title></mat-card-header>
              <mat-card-content class="info-grid">
                <div><label>Calibration Required</label><span>{{ equipment.calibrationRequired ? 'Yes' : 'No' }}</span></div>
                <div><label>Calibration Status</label><span>{{ label(equipment.calibrationStatus || 'NOT_SET') }}</span></div>
                <div><label>Last Calibration</label><span>{{ equipment.lastCalibrationDate ? (equipment.lastCalibrationDate | date:'mediumDate') : '-' }}</span></div>
                <div><label>Next Calibration</label><span [class.overdue]="isOverdue(equipment.nextCalibrationDate)">{{ equipment.nextCalibrationDate ? (equipment.nextCalibrationDate | date:'mediumDate') : '-' }}</span></div>
                <div><label>Calibration Frequency</label><span>{{ equipment.calibrationFrequencyDays ? equipment.calibrationFrequencyDays + ' days' : '-' }}</span></div>
                <div><label>Last Maintenance</label><span>{{ equipment.lastMaintenanceDate ? (equipment.lastMaintenanceDate | date:'mediumDate') : '-' }}</span></div>
                <div><label>Next Maintenance</label><span [class.overdue]="isOverdue(equipment.nextMaintenanceDate)">{{ equipment.nextMaintenanceDate ? (equipment.nextMaintenanceDate | date:'mediumDate') : '-' }}</span></div>
                <div><label>Maintenance Frequency</label><span>{{ equipment.maintenanceFrequencyDays ? equipment.maintenanceFrequencyDays + ' days' : '-' }}</span></div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Qualification (IQ/OQ/PQ) -->
        <mat-tab label="Qualification">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Equipment Qualification (IQ/OQ/PQ)</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="qual-status">
                  <div><label>Current Qualification</label><mat-chip [class]="'chip-qual-' + (equipment.qualificationStatus || 'not_qualified').toLowerCase()">{{ label(equipment.qualificationStatus || 'NOT_QUALIFIED') }}</mat-chip></div>
                  <div><label>Qualification Date</label><span>{{ equipment.qualificationDate ? (equipment.qualificationDate | date:'mediumDate') : '-' }}</span></div>
                  <div><label>Next Qualification Due</label><span [class.overdue]="isOverdue(equipment.nextQualificationDate)">{{ equipment.nextQualificationDate ? (equipment.nextQualificationDate | date:'mediumDate') : '-' }}</span></div>
                </div>
                <mat-divider style="margin:16px 0"></mat-divider>
                <div class="qual-steps">
                  <div class="qual-step" [class.completed]="isQualPhaseComplete('IQ')" [class.current]="isQualPhaseCurrent('IQ')">
                    <mat-icon>{{ isQualPhaseComplete('IQ') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <div>
                      <strong>Step 1: Installation Qualification (IQ)</strong>
                      <p>Verify equipment is installed correctly per specifications.</p>
                    </div>
                    <button mat-raised-button color="primary" (click)="qualify('IQ')" [disabled]="!isQualPhaseCurrent('IQ') || qualifying" *ngIf="!isQualPhaseComplete('IQ') && equipment.status !== 'DECOMMISSIONED'">Complete IQ</button>
                  </div>
                  <div class="qual-step" [class.completed]="isQualPhaseComplete('OQ')" [class.current]="isQualPhaseCurrent('OQ')">
                    <mat-icon>{{ isQualPhaseComplete('OQ') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <div>
                      <strong>Step 2: Operational Qualification (OQ)</strong>
                      <p>Verify equipment operates within design limits.</p>
                    </div>
                    <button mat-raised-button color="primary" (click)="qualify('OQ')" [disabled]="!isQualPhaseCurrent('OQ') || qualifying" *ngIf="!isQualPhaseComplete('OQ') && equipment.status !== 'DECOMMISSIONED'">Complete OQ</button>
                  </div>
                  <div class="qual-step" [class.completed]="isQualPhaseComplete('PQ')" [class.current]="isQualPhaseCurrent('PQ')">
                    <mat-icon>{{ isQualPhaseComplete('PQ') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <div>
                      <strong>Step 3: Performance Qualification (PQ)</strong>
                      <p>Verify equipment consistently produces acceptable results under real conditions.</p>
                    </div>
                    <button mat-raised-button color="primary" (click)="qualify('PQ')" [disabled]="!isQualPhaseCurrent('PQ') || qualifying" *ngIf="!isQualPhaseComplete('PQ') && equipment.status !== 'DECOMMISSIONED'">Complete PQ</button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card *ngIf="isPQComplete()">
              <mat-card-header><mat-card-title>Periodic Re-qualification</mat-card-title></mat-card-header>
              <mat-card-content>
                <p>Re-qualification is required every 12 months to confirm equipment remains qualified.</p>
                <div class="requalification-actions">
                  <button mat-raised-button color="accent" (click)="startRequalification()" [disabled]="qualifying"
                    *ngIf="equipment.qualificationStatus !== 'REQUALIFICATION_IN_PROGRESS'">
                    <mat-icon>replay</mat-icon> Start Re-qualification
                  </button>
                  <button mat-raised-button color="primary" (click)="completeRequalification()" [disabled]="qualifying"
                    *ngIf="equipment.qualificationStatus === 'REQUALIFICATION_IN_PROGRESS'">
                    <mat-icon>check_circle</mat-icon> Complete Re-qualification
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 3: Actions -->
        <mat-tab label="Actions">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Equipment Actions</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="action-list">
                  <div class="action-item">
                    <div><strong>Change Status</strong><p>Transition equipment to a different operational status.</p></div>
                    <button mat-raised-button [matMenuTriggerFor]="statusMenu"><mat-icon>sync</mat-icon> Change Status</button>
                    <mat-menu #statusMenu="matMenu">
                      <button mat-menu-item *ngFor="let s of statuses" (click)="setStatus(s)" [disabled]="s === equipment.status">{{ label(s) }}</button>
                    </mat-menu>
                  </div>
                  <mat-divider></mat-divider>
                  <div class="action-item">
                    <div><strong>Decommission Equipment</strong><p>Permanently retire this equipment. A Change Control request should be created for GxP-relevant equipment.</p></div>
                    <button mat-raised-button color="warn" (click)="decommissionEquipment()" [disabled]="equipment.status === 'DECOMMISSIONED'">
                      <mat-icon>delete_forever</mat-icon> Decommission
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Edit Equipment</mat-card-title></mat-card-header>
              <mat-card-content class="edit-grid">
                <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="edit.name"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Manufacturer</mat-label><input matInput [(ngModel)]="edit.manufacturer"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Calibration Frequency (Days)</mat-label><input matInput type="number" [(ngModel)]="edit.calibrationFrequencyDays"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Maintenance Frequency (Days)</mat-label><input matInput type="number" [(ngModel)]="edit.maintenanceFrequencyDays"></mat-form-field>
                <button mat-raised-button color="primary" (click)="saveEdit()"><mat-icon>save</mat-icon> Save Changes</button>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 4: Workflow History -->
        <mat-tab label="Workflow History">
          <div class="tab-content">
            <mat-card>
              <mat-card-header><mat-card-title>Workflow History</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="timeline" *ngIf="workflowHistory.length">
                  <div class="timeline-item" *ngFor="let step of workflowHistory" [class.completed]="step.status === 'COMPLETED'" [class.current]="step.status === 'CURRENT'">
                    <div class="timeline-icon">
                      <mat-icon *ngIf="step.status === 'COMPLETED'">check_circle</mat-icon>
                      <mat-icon *ngIf="step.status === 'CURRENT'" color="primary">pending</mat-icon>
                      <mat-icon *ngIf="step.status !== 'COMPLETED' && step.status !== 'CURRENT'">radio_button_unchecked</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <strong>{{ step.stepName }}</strong>
                      <span class="meta" *ngIf="step.assignedTo">by {{ step.assignedTo.displayName }}</span>
                      <span class="meta" *ngIf="step.completedAt">{{ step.completedAt | date:'medium' }}</span>
                      <p *ngIf="step.comments">{{ step.comments }}</p>
                    </div>
                  </div>
                </div>
                <p class="empty" *ngIf="!workflowHistory.length">No workflow history available.</p>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page{padding:24px}
    .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap}
    h1{margin:0;font-size:24px}
    .subtitle{color:#667085;display:flex;align-items:center;gap:8px}
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    .tab-content{padding:16px 0}
    mat-card{margin-bottom:16px}
    .info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
    .info-grid label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}
    .overdue{color:#d32f2f;font-weight:600}
    .qual-status{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:8px}
    .qual-status label{display:block;color:#667085;font-size:12px;text-transform:uppercase;margin-bottom:4px}
    .qual-steps{display:flex;flex-direction:column;gap:16px}
    .qual-step{display:flex;align-items:center;gap:16px;padding:12px;border-radius:8px;border:1px solid #e5e7eb}
    .qual-step.completed{background:#f0fdf4;border-color:#86efac}
    .qual-step.current{background:#eff6ff;border-color:#93c5fd}
    .qual-step mat-icon{font-size:28px;width:28px;height:28px}
    .qual-step.completed mat-icon{color:#16a34a}
    .qual-step.current mat-icon{color:#2563eb}
    .qual-step div{flex:1}
    .qual-step p{margin:4px 0 0;color:#667085;font-size:13px}
    .requalification-actions{margin-top:12px}
    .action-list{display:flex;flex-direction:column;gap:16px}
    .action-item{display:flex;justify-content:space-between;align-items:center;gap:16px}
    .action-item p{margin:4px 0 0;color:#667085;font-size:13px}
    .edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:center}
    .timeline{display:flex;flex-direction:column;gap:0}
    .timeline-item{display:flex;gap:12px;padding:12px 0;border-left:3px solid #e5e7eb;margin-left:14px;padding-left:20px;position:relative}
    .timeline-item.completed{border-left-color:#86efac}
    .timeline-item.current{border-left-color:#93c5fd}
    .timeline-icon{position:absolute;left:-16px;background:#fff}
    .timeline-icon mat-icon{font-size:24px;width:24px;height:24px}
    .timeline-content{flex:1}
    .timeline-content .meta{display:block;font-size:12px;color:#667085}
    .timeline-content p{margin:4px 0 0;font-size:13px;color:#374151}
    .empty{padding:16px;color:#667085}
    .chip-active{background:#dcfce7!important;color:#166534!important}
    .chip-inactive,.chip-out_of_service{background:#fef3c7!important;color:#92400e!important}
    .chip-decommissioned{background:#fee2e2!important;color:#991b1b!important}
    .chip-under_maintenance,.chip-under_calibration{background:#dbeafe!important;color:#1e40af!important}
    .chip-qual-not_qualified,.chip-qual-qualification_expired{background:#fee2e2!important;color:#991b1b!important}
    .chip-qual-iq_completed,.chip-qual-oq_completed{background:#fef3c7!important;color:#92400e!important}
    .chip-qual-pq_completed,.chip-qual-fully_qualified{background:#dcfce7!important;color:#166534!important}
    .chip-qual-requalification_due{background:#fff7ed!important;color:#9a3412!important}
    .chip-qual-requalification_in_progress{background:#dbeafe!important;color:#1e40af!important}
  `],
})
export class EquipmentDetailComponent implements OnInit {
  equipment: Equipment | null = null;
  workflowHistory: WorkflowStep[] = [];
  qualifying = false;
  edit = { name: '', manufacturer: '', calibrationFrequencyDays: 0, maintenanceFrequencyDays: 0 };
  statuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE', 'UNDER_CALIBRATION'];

  private qualOrder = ['NOT_QUALIFIED', 'IQ_COMPLETED', 'OQ_COMPLETED', 'PQ_COMPLETED', 'FULLY_QUALIFIED'];

  constructor(private route: ActivatedRoute, private equipmentService: EquipmentService, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.equipmentService.getById(id).subscribe((eq) => {
      this.equipment = eq;
      this.edit = {
        name: eq.name || '',
        manufacturer: eq.manufacturer || '',
        calibrationFrequencyDays: eq.calibrationFrequencyDays || 0,
        maintenanceFrequencyDays: eq.maintenanceFrequencyDays || 0,
      };
    });
    this.equipmentService.getWorkflowHistory(id).subscribe(
      (h) => this.workflowHistory = h,
      () => this.workflowHistory = [],
    );
  }

  // Qualification helpers
  isQualPhaseComplete(phase: string): boolean {
    if (!this.equipment) return false;
    const qs = this.equipment.qualificationStatus || 'NOT_QUALIFIED';
    const phaseIndex = this.qualOrder.indexOf(phase + '_COMPLETED');
    const currentIndex = this.qualOrder.indexOf(qs);
    if (qs === 'FULLY_QUALIFIED' || qs === 'REQUALIFICATION_IN_PROGRESS' || qs === 'REQUALIFICATION_DUE') return true;
    return phaseIndex >= 0 && currentIndex >= phaseIndex;
  }

  isQualPhaseCurrent(phase: string): boolean {
    if (!this.equipment) return false;
    const qs = this.equipment.qualificationStatus || 'NOT_QUALIFIED';
    if (phase === 'IQ') return qs === 'NOT_QUALIFIED';
    if (phase === 'OQ') return qs === 'IQ_COMPLETED';
    if (phase === 'PQ') return qs === 'OQ_COMPLETED';
    return false;
  }

  isPQComplete(): boolean {
    if (!this.equipment) return false;
    const qs = this.equipment.qualificationStatus || '';
    return ['PQ_COMPLETED', 'FULLY_QUALIFIED', 'REQUALIFICATION_DUE', 'REQUALIFICATION_IN_PROGRESS'].includes(qs);
  }

  qualify(phase: string): void {
    if (!this.equipment) return;
    this.qualifying = true;
    this.equipmentService.completeQualificationPhase(this.equipment.id, phase).subscribe({
      next: (eq) => {
        this.equipment = eq;
        this.qualifying = false;
        this.snackBar.open(`${phase} Qualification completed`, 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.qualifying = false;
        this.snackBar.open(err.error?.message || `Failed to complete ${phase}`, 'Dismiss', { duration: 3500 });
      },
    });
  }

  startRequalification(): void {
    if (!this.equipment) return;
    this.qualifying = true;
    this.equipmentService.startRequalification(this.equipment.id).subscribe({
      next: (eq) => { this.equipment = eq; this.qualifying = false; this.snackBar.open('Re-qualification started', 'Dismiss', { duration: 2500 }); this.load(); },
      error: () => { this.qualifying = false; this.snackBar.open('Failed to start re-qualification', 'Dismiss', { duration: 3500 }); },
    });
  }

  completeRequalification(): void {
    if (!this.equipment) return;
    this.qualifying = true;
    this.equipmentService.completeRequalification(this.equipment.id).subscribe({
      next: (eq) => { this.equipment = eq; this.qualifying = false; this.snackBar.open('Re-qualification completed', 'Dismiss', { duration: 2500 }); this.load(); },
      error: () => { this.qualifying = false; this.snackBar.open('Failed to complete re-qualification', 'Dismiss', { duration: 3500 }); },
    });
  }

  setStatus(status: string): void {
    if (!this.equipment) return;
    this.equipmentService.update(this.equipment.id, { status }).subscribe({
      next: (eq) => { this.equipment = eq; this.snackBar.open('Status updated', 'Dismiss', { duration: 2500 }); },
      error: () => this.snackBar.open('Failed to update status', 'Dismiss', { duration: 3500 }),
    });
  }

  decommissionEquipment(): void {
    if (!this.equipment) return;
    if (!confirm('Are you sure you want to decommission this equipment? This action is permanent.')) return;
    this.equipmentService.decommission(this.equipment.id, { reason: 'End of equipment lifecycle' }).subscribe({
      next: (eq) => { this.equipment = eq; this.snackBar.open('Equipment decommissioned', 'Dismiss', { duration: 2500 }); this.load(); },
      error: () => this.snackBar.open('Failed to decommission', 'Dismiss', { duration: 3500 }),
    });
  }

  saveEdit(): void {
    if (!this.equipment) return;
    const update: Record<string, unknown> = {};
    if (this.edit.name !== this.equipment.name) update['name'] = this.edit.name;
    if (this.edit.manufacturer !== (this.equipment.manufacturer || '')) update['manufacturer'] = this.edit.manufacturer;
    if (this.edit.calibrationFrequencyDays !== (this.equipment.calibrationFrequencyDays || 0)) update['calibrationFrequencyDays'] = this.edit.calibrationFrequencyDays;
    if (this.edit.maintenanceFrequencyDays !== (this.equipment.maintenanceFrequencyDays || 0)) update['maintenanceFrequencyDays'] = this.edit.maintenanceFrequencyDays;
    if (Object.keys(update).length === 0) { this.snackBar.open('No changes to save', 'Dismiss', { duration: 2000 }); return; }
    this.equipmentService.update(this.equipment.id, update).subscribe({
      next: (eq) => { this.equipment = eq; this.snackBar.open('Equipment updated', 'Dismiss', { duration: 2500 }); },
      error: () => this.snackBar.open('Failed to save', 'Dismiss', { duration: 3500 }),
    });
  }

  isOverdue(dateStr: string | null): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  label(value: string): string {
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-';
  }
}
