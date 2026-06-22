import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CapaService } from '../../services/capa.service';
import { Capa, RcaMethod } from '../../models/capa.model';

@Component({
  selector: 'capa-root-cause-analysis',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="rca-container" *ngIf="capa">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button [routerLink]="['../detail', capa.id]">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Root Cause Analysis</h1>
            <p class="subtitle">{{ capa.capaNumber }} - {{ capa.title }}</p>
          </div>
        </div>
      </div>

      <!-- RCA Method Selection -->
      <mat-card class="rca-card">
        <h3>Investigation Method</h3>
        <div class="method-grid">
          <div class="method-option" *ngFor="let method of rcaMethods"
               [ngClass]="{'selected': selectedMethod === method.value}"
               (click)="selectMethod(method.value)">
            <mat-icon>{{ method.icon }}</mat-icon>
            <span class="method-name">{{ method.label }}</span>
            <span class="method-desc">{{ method.description }}</span>
          </div>
        </div>
      </mat-card>

      <!-- 5-Why Analysis -->
      <mat-card class="rca-card" *ngIf="selectedMethod === 'FIVE_WHY'">
        <h3>5-Why Analysis</h3>
        <p class="section-desc">Ask "Why?" iteratively to drill down to the root cause</p>

        <div class="five-why-form">
          <div class="why-entry" *ngFor="let why of fiveWhyEntries; let i = index">
            <div class="why-number">
              <span>Why {{ i + 1 }}</span>
            </div>
            <div class="why-fields">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Question</mat-label>
                <input matInput [(ngModel)]="why.question"
                       [placeholder]="'Why did ' + (i === 0 ? 'the problem occur?' : 'that happen?')">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Answer</mat-label>
                <textarea matInput [(ngModel)]="why.answer" rows="2"
                          placeholder="Based on investigation findings..."></textarea>
              </mat-form-field>
            </div>
          </div>

          <button mat-stroked-button (click)="addWhyLevel()" *ngIf="fiveWhyEntries.length < 7">
            <mat-icon>add</mat-icon>
            Add Another "Why"
          </button>
        </div>
      </mat-card>

      <!-- Fishbone / Ishikawa -->
      <mat-card class="rca-card" *ngIf="selectedMethod === 'FISHBONE'">
        <h3>Fishbone (Ishikawa) Analysis</h3>
        <p class="section-desc">Categorize potential causes using the 6M framework</p>

        <div class="fishbone-categories">
          <div class="category-card" *ngFor="let cat of fishboneCategories">
            <div class="category-header">
              <mat-icon>{{ cat.icon }}</mat-icon>
              <span>{{ cat.name }}</span>
            </div>
            <div class="category-causes">
              <div class="cause-chip" *ngFor="let cause of cat.causes; let i = index">
                <span>{{ cause }}</span>
                <mat-icon (click)="removeCause(cat, i)">close</mat-icon>
              </div>
              <div class="add-cause">
                <input [(ngModel)]="cat.newCause" placeholder="Add cause..."
                       (keyup.enter)="addCause(cat)">
                <button mat-icon-button (click)="addCause(cat)" [disabled]="!cat.newCause">
                  <mat-icon>add_circle</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- Root Causes Identified -->
      <mat-card class="rca-card">
        <h3>Identified Root Causes</h3>
        <div class="root-causes-form">
          <div class="cause-entry" *ngFor="let cause of identifiedCauses; let i = index">
            <span class="cause-number">{{ i + 1 }}.</span>
            <mat-form-field appearance="outline" class="flex-grow">
              <input matInput [(ngModel)]="identifiedCauses[i]" placeholder="Root cause description">
            </mat-form-field>
            <button mat-icon-button (click)="removeCauseEntry(i)" color="warn">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <button mat-stroked-button (click)="addCauseEntry()">
            <mat-icon>add</mat-icon>
            Add Root Cause
          </button>
        </div>
      </mat-card>

      <!-- Contributing Factors -->
      <mat-card class="rca-card">
        <h3>Contributing Factors</h3>
        <div class="root-causes-form">
          <div class="cause-entry" *ngFor="let factor of contributingFactors; let i = index">
            <span class="cause-number">{{ i + 1 }}.</span>
            <mat-form-field appearance="outline" class="flex-grow">
              <input matInput [(ngModel)]="contributingFactors[i]" placeholder="Contributing factor">
            </mat-form-field>
            <button mat-icon-button (click)="removeFactorEntry(i)" color="warn">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <button mat-stroked-button (click)="addFactorEntry()">
            <mat-icon>add</mat-icon>
            Add Contributing Factor
          </button>
        </div>
      </mat-card>

      <!-- AI Suggestion Panel -->
      <mat-card class="rca-card ai-panel">
        <div class="ai-header">
          <mat-icon>psychology</mat-icon>
          <h3>AI-Assisted Root Cause Suggestions</h3>
          <span class="ai-badge">Beta</span>
        </div>
        <p class="ai-desc">Based on historical quality events and industry knowledge base</p>

        <div class="ai-suggestions">
          <div class="suggestion-item">
            <mat-icon>lightbulb</mat-icon>
            <div class="suggestion-content">
              <span class="suggestion-text">Similar CAPA from Q3 2024 identified equipment calibration drift as root cause for OOS results in dissolution testing.</span>
              <span class="suggestion-ref">Ref: CAPA-2024-078</span>
            </div>
            <button mat-stroked-button size="small">Apply</button>
          </div>

          <div class="suggestion-item">
            <mat-icon>lightbulb</mat-icon>
            <div class="suggestion-content">
              <span class="suggestion-text">Industry data shows 34% of dissolution failures in tablet dosage forms are linked to granulation moisture control.</span>
              <span class="suggestion-ref">Source: FDA Database Analysis</span>
            </div>
            <button mat-stroked-button size="small">Apply</button>
          </div>

          <div class="suggestion-item">
            <mat-icon>lightbulb</mat-icon>
            <div class="suggestion-content">
              <span class="suggestion-text">Consider evaluating environmental conditions (humidity, temperature) during manufacturing as a contributing factor.</span>
              <span class="suggestion-ref">Source: ICH Q10 Guideline</span>
            </div>
            <button mat-stroked-button size="small">Apply</button>
          </div>
        </div>
      </mat-card>

      <!-- Actions -->
      <div class="form-actions">
        <button mat-stroked-button [routerLink]="['../detail', capa.id]">Cancel</button>
        <button mat-raised-button color="primary" (click)="saveRca()">
          <mat-icon>save</mat-icon>
          Save Root Cause Analysis
        </button>
      </div>
    </div>
  `,
  styles: [`
    .rca-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-header h1 {
      font-size: 22px;
      font-weight: 600;
      color: #1a237e;
      margin: 0;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
      margin: 2px 0 0;
    }

    .rca-card {
      padding: 24px;
      margin-bottom: 16px;
    }

    .rca-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px;
      color: #333;
    }

    .section-desc {
      font-size: 13px;
      color: #666;
      margin-bottom: 16px;
    }

    .method-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .method-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border: 2px solid #eee;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .method-option:hover {
      border-color: #90caf9;
      background: #f5f9ff;
    }

    .method-option.selected {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .method-option mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
      margin-bottom: 8px;
    }

    .method-name {
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }

    .method-desc {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }

    .five-why-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .why-entry {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .why-number {
      min-width: 60px;
      padding-top: 12px;
      font-weight: 600;
      color: #1976d2;
      font-size: 14px;
    }

    .why-fields {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width {
      width: 100%;
    }

    .fishbone-categories {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .category-card {
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 12px;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 13px;
      color: #333;
    }

    .category-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .category-causes {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .cause-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 12px;
    }

    .cause-chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      cursor: pointer;
      color: #999;
    }

    .add-cause {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

    .add-cause input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      outline: none;
    }

    .root-causes-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cause-entry {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cause-number {
      font-weight: 600;
      color: #666;
      min-width: 24px;
    }

    .flex-grow {
      flex: 1;
    }

    .ai-panel {
      border: 1px solid #e3f2fd;
      background: #fafcff;
    }

    .ai-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ai-header mat-icon {
      color: #1976d2;
    }

    .ai-header h3 {
      margin: 0;
    }

    .ai-badge {
      background: #e3f2fd;
      color: #1565c0;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
    }

    .ai-desc {
      font-size: 13px;
      color: #666;
      margin: 4px 0 16px;
    }

    .ai-suggestions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .suggestion-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .suggestion-item mat-icon {
      color: #fbc02d;
      margin-top: 2px;
    }

    .suggestion-content {
      flex: 1;
    }

    .suggestion-text {
      font-size: 13px;
      color: #333;
      display: block;
    }

    .suggestion-ref {
      font-size: 11px;
      color: #888;
      margin-top: 4px;
      display: block;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `],
})
export class RootCauseAnalysisComponent implements OnInit {
  capa: Capa | null = null;
  selectedMethod: RcaMethod = RcaMethod.FIVE_WHY;

  rcaMethods = [
    { value: RcaMethod.FIVE_WHY, label: '5-Why Analysis', icon: 'format_list_numbered', description: 'Iterative questioning technique' },
    { value: RcaMethod.FISHBONE, label: 'Fishbone Diagram', icon: 'account_tree', description: 'Ishikawa cause-and-effect' },
    { value: RcaMethod.FAULT_TREE, label: 'Fault Tree', icon: 'device_hub', description: 'Top-down failure analysis' },
    { value: RcaMethod.FAILURE_MODE, label: 'FMEA', icon: 'assessment', description: 'Failure Mode & Effect Analysis' },
  ];

  fiveWhyEntries = [
    { level: 1, question: '', answer: '' },
    { level: 2, question: '', answer: '' },
    { level: 3, question: '', answer: '' },
    { level: 4, question: '', answer: '' },
    { level: 5, question: '', answer: '' },
  ];

  fishboneCategories = [
    { name: 'Man (People)', icon: 'people', causes: [] as string[], newCause: '' },
    { name: 'Machine (Equipment)', icon: 'precision_manufacturing', causes: [] as string[], newCause: '' },
    { name: 'Material', icon: 'inventory', causes: [] as string[], newCause: '' },
    { name: 'Method (Process)', icon: 'settings', causes: [] as string[], newCause: '' },
    { name: 'Measurement', icon: 'straighten', causes: [] as string[], newCause: '' },
    { name: 'Mother Nature (Environment)', icon: 'eco', causes: [] as string[], newCause: '' },
  ];

  identifiedCauses: string[] = [''];
  contributingFactors: string[] = [''];

  constructor(
    private route: ActivatedRoute,
    private capaService: CapaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.capaService.getCapaById(id).subscribe((data) => {
        this.capa = data || null;
        if (this.capa?.rootCauseAnalysis) {
          this.selectedMethod = this.capa.rootCauseAnalysis.method;
          this.identifiedCauses = [...this.capa.rootCauseAnalysis.rootCauses];
          this.contributingFactors = [...(this.capa.rootCauseAnalysis.contributingFactors || [])];
          if (this.capa.rootCauseAnalysis.fiveWhyAnalysis) {
            this.fiveWhyEntries = [...this.capa.rootCauseAnalysis.fiveWhyAnalysis];
          }
        }
      });
    }
  }

  selectMethod(method: RcaMethod): void {
    this.selectedMethod = method;
  }

  addWhyLevel(): void {
    this.fiveWhyEntries.push({
      level: this.fiveWhyEntries.length + 1,
      question: '',
      answer: '',
    });
  }

  addCause(category: any): void {
    if (category.newCause.trim()) {
      category.causes.push(category.newCause.trim());
      category.newCause = '';
    }
  }

  removeCause(category: any, index: number): void {
    category.causes.splice(index, 1);
  }

  addCauseEntry(): void {
    this.identifiedCauses.push('');
  }

  removeCauseEntry(index: number): void {
    this.identifiedCauses.splice(index, 1);
  }

  addFactorEntry(): void {
    this.contributingFactors.push('');
  }

  removeFactorEntry(index: number): void {
    this.contributingFactors.splice(index, 1);
  }

  saveRca(): void {
    if (!this.capa) return;

    this.capaService.submitRootCauseAnalysis(this.capa.id, {
      method: this.selectedMethod,
      description: 'Root cause analysis',
      rootCauses: this.identifiedCauses.filter((c) => c.trim()),
      contributingFactors: this.contributingFactors.filter((f) => f.trim()),
      fiveWhyAnalysis: this.fiveWhyEntries.filter((entry) => entry.question.trim() || entry.answer.trim()),
    }).subscribe({
      next: (updated) => {
        this.capa = updated;
        this.snackBar.open('Root cause analysis saved', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Unable to save root cause analysis', 'OK', { duration: 5000 });
      },
    });
  }
}
