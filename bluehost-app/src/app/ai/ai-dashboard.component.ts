import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AiCopilotService, AiDashboard, AiAgentConfig } from './ai-copilot.service';

@Component({
  selector: 'qms-ai-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <div class="ai-dashboard" *ngIf="dashboard">
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="page-icon">smart_toy</mat-icon>
          <div>
            <h2>AI Agent Dashboard</h2>
            <p>Monitor and configure AI agents across the QMS</p>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <mat-card class="kpi-card">
          <mat-icon>chat</mat-icon>
          <div class="kpi-value">{{ dashboard.totalConversations }}</div>
          <div class="kpi-label">Total Conversations</div>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-icon>forum</mat-icon>
          <div class="kpi-value">{{ dashboard.totalMessages }}</div>
          <div class="kpi-label">Total Messages</div>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-icon>psychology</mat-icon>
          <div class="kpi-value">{{ dashboard.totalAgentExecutions }}</div>
          <div class="kpi-label">Agent Executions</div>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-icon>today</mat-icon>
          <div class="kpi-value">{{ dashboard.executionsToday }}</div>
          <div class="kpi-label">Today's Executions</div>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-icon>speed</mat-icon>
          <div class="kpi-value">{{ dashboard.avgLatencyMs | number:'1.0-0' }}ms</div>
          <div class="kpi-label">Avg Latency</div>
        </mat-card>
        <mat-card class="kpi-card" [class.warn]="dashboard.failedExecutions > 0">
          <mat-icon>error_outline</mat-icon>
          <div class="kpi-value">{{ dashboard.failedExecutions }}</div>
          <div class="kpi-label">Failed</div>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-icon>token</mat-icon>
          <div class="kpi-value">{{ formatTokens(dashboard.totalTokensUsed) }}</div>
          <div class="kpi-label">Tokens Used</div>
        </mat-card>
        <mat-card class="kpi-card" [class.attention]="dashboard.pendingApprovals > 0">
          <mat-icon>pending_actions</mat-icon>
          <div class="kpi-value">{{ dashboard.pendingApprovals }}</div>
          <div class="kpi-label">Pending Approvals</div>
        </mat-card>
      </div>

      <!-- Agent Configuration -->
      <mat-card class="agents-card">
        <div class="card-header">
          <h3>AI Agents</h3>
          <span class="agent-count">{{ dashboard.agents.length }} agents configured</span>
        </div>
        <div class="agents-grid">
          <div class="agent-tile" *ngFor="let agent of dashboard.agents"
               [class.disabled]="!agent.isEnabled">
            <div class="agent-tile-header">
              <mat-icon [class]="'agent-icon ' + agentColorClass(agent.agentType)">
                {{ agentIcon(agent.agentType) }}
              </mat-icon>
              <mat-slide-toggle
                [checked]="agent.isEnabled"
                (change)="toggleAgent(agent)"
                color="primary"
                matTooltip="{{ agent.isEnabled ? 'Disable' : 'Enable' }} agent">
              </mat-slide-toggle>
            </div>
            <div class="agent-tile-body">
              <div class="agent-name">{{ agent.displayName }}</div>
              <div class="agent-desc">{{ agent.description }}</div>
            </div>
            <div class="agent-tile-footer">
              <span class="agent-model">
                <mat-icon>memory</mat-icon>
                {{ agent.modelId }}
              </span>
              <span class="agent-executions" *ngIf="dashboard.executionsByAgent[agent.agentType]">
                {{ dashboard.executionsByAgent[agent.agentType] }} runs
              </span>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- Execution Distribution -->
      <div class="charts-row">
        <mat-card class="chart-card">
          <h3>Executions by Agent</h3>
          <div class="bar-chart">
            <div class="bar-row" *ngFor="let entry of agentEntries">
              <span class="bar-label">{{ formatAgentName(entry[0]) }}</span>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="barWidth(entry[1])"></div>
              </div>
              <span class="bar-value">{{ entry[1] }}</span>
            </div>
            <div class="empty-state" *ngIf="agentEntries.length === 0">No executions yet</div>
          </div>
        </mat-card>
        <mat-card class="chart-card">
          <h3>Executions by Status</h3>
          <div class="status-grid">
            <div class="status-item" *ngFor="let entry of statusEntries">
              <mat-icon [class]="'status-icon ' + statusColor(entry[0])">{{ statusIcon(entry[0]) }}</mat-icon>
              <div class="status-info">
                <span class="status-name">{{ entry[0] }}</span>
                <span class="status-count">{{ entry[1] }}</span>
              </div>
            </div>
            <div class="empty-state" *ngIf="statusEntries.length === 0">No executions yet</div>
          </div>
        </mat-card>
      </div>
    </div>

    <div class="loading-state" *ngIf="!dashboard">
      <mat-icon>hourglass_top</mat-icon>
      <span>Loading AI Dashboard...</span>
    </div>
  `,
  styles: [`
    .ai-dashboard { padding: 0; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-icon { font-size: 32px; width: 32px; height: 32px; color: #1B3A4B; }
    .page-header h2 { margin: 0; font-size: 20px; color: #1B3A4B; }
    .page-header p { margin: 2px 0 0; font-size: 13px; color: #667085; }

    /* KPI Grid */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px; margin-bottom: 20px;
    }
    .kpi-card {
      padding: 16px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }
    .kpi-card mat-icon { font-size: 24px; width: 24px; height: 24px; color: #2C5F7C; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #1B3A4B; }
    .kpi-label { font-size: 12px; color: #667085; }
    .kpi-card.warn .kpi-value { color: #dc2626; }
    .kpi-card.warn mat-icon { color: #dc2626; }
    .kpi-card.attention .kpi-value { color: #ED8B00; }
    .kpi-card.attention mat-icon { color: #ED8B00; }

    /* Agents Card */
    .agents-card { padding: 20px; margin-bottom: 20px; }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .card-header h3 { margin: 0; font-size: 16px; color: #1B3A4B; }
    .agent-count { font-size: 12px; color: #667085; }

    .agents-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .agent-tile {
      border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;
      transition: all 0.15s;
    }
    .agent-tile:hover { border-color: #2C5F7C; box-shadow: 0 2px 8px rgba(44,95,124,0.08); }
    .agent-tile.disabled { opacity: 0.5; background: #f9fafb; }
    .agent-tile-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .agent-icon { font-size: 24px; width: 24px; height: 24px; padding: 6px; border-radius: 8px; }
    .agent-icon.capa { background: #fef3c7; color: #d97706; }
    .agent-icon.deviation { background: #fee2e2; color: #dc2626; }
    .agent-icon.change { background: #dbeafe; color: #2563eb; }
    .agent-icon.document { background: #e0e7ff; color: #4f46e5; }
    .agent-icon.training { background: #d1fae5; color: #059669; }
    .agent-icon.audit { background: #f3e8ff; color: #7c3aed; }
    .agent-icon.risk { background: #fff7ed; color: #ea580c; }
    .agent-icon.complaint { background: #fce7f3; color: #db2777; }
    .agent-icon.supplier { background: #ccfbf1; color: #0d9488; }
    .agent-icon.nc { background: #fef2f2; color: #b91c1c; }
    .agent-icon.equipment { background: #f0fdf4; color: #16a34a; }
    .agent-icon.copilot { background: #e8f0fe; color: #1B3A4B; }
    .agent-icon.supervisor { background: #1B3A4B; color: #ED8B00; }

    .agent-name { font-size: 14px; font-weight: 600; color: #1B3A4B; }
    .agent-desc { font-size: 12px; color: #667085; margin-top: 2px; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .agent-tile-footer {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 10px; padding-top: 8px; border-top: 1px solid #f3f4f6;
    }
    .agent-model {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: #94a3b8;
    }
    .agent-model mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .agent-executions { font-size: 11px; color: #2C5F7C; font-weight: 500; }

    /* Charts */
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .chart-card { padding: 20px; }
    .chart-card h3 { margin: 0 0 14px; font-size: 14px; color: #1B3A4B; }

    .bar-chart { display: flex; flex-direction: column; gap: 8px; }
    .bar-row { display: flex; align-items: center; gap: 8px; }
    .bar-label { width: 120px; font-size: 12px; color: #475569; text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 18px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #2C5F7C, #1B3A4B); border-radius: 4px;
      transition: width 0.5s ease; min-width: 2px; }
    .bar-value { width: 36px; font-size: 12px; color: #1B3A4B; font-weight: 600; }

    .status-grid { display: flex; flex-direction: column; gap: 12px; }
    .status-item { display: flex; align-items: center; gap: 10px; }
    .status-icon { font-size: 20px; width: 20px; height: 20px; }
    .status-icon.green { color: #16a34a; }
    .status-icon.red { color: #dc2626; }
    .status-icon.yellow { color: #ca8a04; }
    .status-icon.gray { color: #94a3b8; }
    .status-info { display: flex; flex-direction: column; }
    .status-name { font-size: 13px; color: #475569; }
    .status-count { font-size: 18px; font-weight: 700; color: #1B3A4B; }

    .empty-state { text-align: center; color: #94a3b8; font-size: 13px; padding: 20px; }
    .loading-state {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 60px; color: #667085; font-size: 14px;
    }

    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class AiDashboardComponent implements OnInit {
  dashboard: AiDashboard | null = null;
  agentEntries: [string, number][] = [];
  statusEntries: [string, number][] = [];
  maxExecution = 1;

  constructor(private aiService: AiCopilotService) {}

  ngOnInit(): void {
    this.aiService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.agentEntries = Object.entries(data.executionsByAgent || {})
          .sort((a, b) => b[1] - a[1]);
        this.statusEntries = Object.entries(data.executionsByStatus || {});
        this.maxExecution = Math.max(...this.agentEntries.map(e => e[1]), 1);
      },
    });
  }

  toggleAgent(agent: AiAgentConfig): void {
    const newState = !agent.isEnabled;
    this.aiService.toggleAgent(agent.id, newState).subscribe(() => {
      agent.isEnabled = newState;
    });
  }

  formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return (tokens / 1_000_000).toFixed(1) + 'M';
    if (tokens >= 1_000) return (tokens / 1_000).toFixed(1) + 'K';
    return tokens.toString();
  }

  barWidth(value: number): number {
    return (value / this.maxExecution) * 100;
  }

  formatAgentName(type: string): string {
    return type.replace(/_AGENT$/, '').replace(/_/g, ' ');
  }

  agentIcon(type: string): string {
    const map: Record<string, string> = {
      COPILOT: 'smart_toy', SUPERVISOR: 'hub',
      CAPA_AGENT: 'assignment_turned_in', DEVIATION_AGENT: 'report_problem',
      CHANGE_CONTROL_AGENT: 'swap_horiz', DOCUMENT_AGENT: 'description',
      TRAINING_AGENT: 'school', AUDIT_AGENT: 'fact_check',
      RISK_AGENT: 'warning_amber', COMPLAINT_AGENT: 'feedback',
      SUPPLIER_AGENT: 'local_shipping', NC_AGENT: 'block',
      EQUIPMENT_AGENT: 'precision_manufacturing',
    };
    return map[type] || 'smart_toy';
  }

  agentColorClass(type: string): string {
    const map: Record<string, string> = {
      COPILOT: 'copilot', SUPERVISOR: 'supervisor',
      CAPA_AGENT: 'capa', DEVIATION_AGENT: 'deviation',
      CHANGE_CONTROL_AGENT: 'change', DOCUMENT_AGENT: 'document',
      TRAINING_AGENT: 'training', AUDIT_AGENT: 'audit',
      RISK_AGENT: 'risk', COMPLAINT_AGENT: 'complaint',
      SUPPLIER_AGENT: 'supplier', NC_AGENT: 'nc',
      EQUIPMENT_AGENT: 'equipment',
    };
    return map[type] || 'copilot';
  }

  statusIcon(status: string): string {
    if (status === 'COMPLETED') return 'check_circle';
    if (status === 'FAILED') return 'cancel';
    if (status === 'RUNNING') return 'pending';
    if (status === 'TIMEOUT') return 'timer_off';
    return 'help';
  }

  statusColor(status: string): string {
    if (status === 'COMPLETED') return 'green';
    if (status === 'FAILED') return 'red';
    if (status === 'RUNNING') return 'yellow';
    return 'gray';
  }
}
