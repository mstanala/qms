import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AuditService, Audit } from '../../services/audit.service';

@Component({
  selector: 'qms-audit-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="list-container">
      <div class="list-header">
        <h1>Audits</h1>
        <button mat-raised-button color="primary" routerLink="../plans"><mat-icon>event_note</mat-icon> Audit Plans</button>
      </div>
      <table mat-table [dataSource]="audits" class="audit-table">
        <ng-container matColumnDef="auditNumber"><th mat-header-cell *matHeaderCellDef>Audit #</th><td mat-cell *matCellDef="let row"><a [routerLink]="['../', row.id]">{{ row.auditNumber }}</a></td></ng-container>
        <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>Title</th><td mat-cell *matCellDef="let row">{{ row.title }}</td></ng-container>
        <ng-container matColumnDef="auditType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ row.auditType }}</td></ng-container>
        <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let row"><mat-chip>{{ row.status }}</mat-chip></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;" [routerLink]="['../', row.id]" style="cursor:pointer"></tr>
      </table>
      <mat-paginator [length]="total" [pageSize]="20" (page)="onPage($event)"></mat-paginator>
    </div>
  `,
  styles: [`.list-container{padding:24px} .list-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px} .list-header h1{margin:0} .audit-table{width:100%}`],
})
export class AuditListComponent implements OnInit {
  audits: Audit[] = [];
  columns = ['auditNumber', 'title', 'auditType', 'status'];
  total = 0;
  page = 0;

  constructor(private auditService: AuditService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.auditService.listAudits({ page: this.page.toString(), size: '20' }).subscribe((r) => {
      this.audits = r.content;
      this.total = r.totalElements;
    });
  }

  onPage(e: PageEvent): void { this.page = e.pageIndex; this.load(); }
}
