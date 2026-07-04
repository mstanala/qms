import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'qms-risk-matrix',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="matrix-container">
      <div class="matrix-header">
        <h1>Risk Matrix (5x5)</h1>
        <button mat-stroked-button routerLink="../dashboard">
          <mat-icon>arrow_back</mat-icon> Back to Dashboard
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="matrix-grid">
            <div class="axis-label y-axis">Severity &rarr;</div>
            <div class="axis-label x-axis">Occurrence &rarr;</div>

            <!-- Header row -->
            <div class="matrix-cell header"></div>
            <div class="matrix-cell header" *ngFor="let o of [1,2,3,4,5]">{{ o }}</div>

            <!-- Matrix rows -->
            <ng-container *ngFor="let s of [5,4,3,2,1]">
              <div class="matrix-cell header">{{ s }}</div>
              <div
                *ngFor="let o of [1,2,3,4,5]"
                class="matrix-cell"
                [class]="getRiskClass(s, o)"
                [title]="'S=' + s + ' O=' + o + ' RPN=' + (s * o)">
                {{ s * o }}
              </div>
            </ng-container>
          </div>

          <div class="legend">
            <div class="legend-item"><span class="legend-color critical"></span> Critical (≥20)</div>
            <div class="legend-item"><span class="legend-color high"></span> High (12-19)</div>
            <div class="legend-item"><span class="legend-color medium"></span> Medium (6-11)</div>
            <div class="legend-item"><span class="legend-color low"></span> Low (1-5)</div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>Risk Priority Number (RPN) Methodology</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>The Risk Matrix displays the intersection of Severity (S) and Occurrence (O) scores.</p>
          <p>For FMEA assessments, the full RPN = S × O × D (Detectability) is calculated separately.</p>
          <table class="scale-table">
            <tr><th>Score</th><th>Severity</th><th>Occurrence</th><th>Detectability</th></tr>
            <tr><td>1</td><td>Negligible</td><td>Remote</td><td>Almost Certain</td></tr>
            <tr><td>2</td><td>Minor</td><td>Low</td><td>High</td></tr>
            <tr><td>3</td><td>Moderate</td><td>Moderate</td><td>Moderate</td></tr>
            <tr><td>4</td><td>Major</td><td>High</td><td>Low</td></tr>
            <tr><td>5</td><td>Catastrophic</td><td>Very High</td><td>Remote</td></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .matrix-container { padding: 24px; }
    .matrix-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .matrix-header h1 { margin: 0; }
    .matrix-grid { display: grid; grid-template-columns: 40px repeat(5, 1fr); gap: 4px; max-width: 500px; margin: 24px auto; }
    .matrix-cell { display: flex; align-items: center; justify-content: center; height: 50px; border-radius: 4px; font-weight: 600; font-size: 14px; }
    .matrix-cell.header { background: transparent; font-weight: 700; color: #333; }
    .matrix-cell.critical { background: #d32f2f; color: white; }
    .matrix-cell.high { background: #f57c00; color: white; }
    .matrix-cell.medium { background: #fbc02d; color: #333; }
    .matrix-cell.low { background: #388e3c; color: white; }
    .axis-label { font-size: 12px; font-weight: 600; color: #666; text-align: center; }
    .y-axis { grid-column: 1; writing-mode: vertical-lr; transform: rotate(180deg); }
    .x-axis { grid-column: 2 / -1; }
    .legend { display: flex; gap: 24px; justify-content: center; margin-top: 24px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .legend-color { width: 20px; height: 20px; border-radius: 4px; }
    .legend-color.critical { background: #d32f2f; }
    .legend-color.high { background: #f57c00; }
    .legend-color.medium { background: #fbc02d; }
    .legend-color.low { background: #388e3c; }
    .info-card { margin-top: 24px; }
    .scale-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .scale-table th, .scale-table td { padding: 8px 12px; border: 1px solid #e0e0e0; text-align: center; }
    .scale-table th { background: #f5f5f5; font-weight: 600; }
  `],
})
export class RiskMatrixComponent {
  getRiskClass(severity: number, occurrence: number): string {
    const rpn = severity * occurrence;
    if (rpn >= 20) return 'critical';
    if (rpn >= 12) return 'high';
    if (rpn >= 6) return 'medium';
    return 'low';
  }
}
