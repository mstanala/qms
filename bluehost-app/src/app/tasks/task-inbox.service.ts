import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap, startWith, catchError, of } from 'rxjs';

const API_BASE_URL = 'http://localhost:8082/api/v1';

export interface TaskInboxItem {
  taskId: string;
  taskName: string;
  taskDefinitionKey: string;
  processInstanceId: string;
  processDefinitionKey: string;
  recordType: string;
  recordId: string;
  recordNumber: string;
  assignee: string | null;
  description: string | null;
  createTime: string;
  dueDate: string | null;
  formKey: string | null;
  priority: number;
}

@Injectable({ providedIn: 'root' })
export class TaskInboxService {
  private taskCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  get taskCountChanges(): Observable<number> {
    return this.taskCount$.asObservable();
  }

  getMyTasks(candidateGroups?: string[]): Observable<TaskInboxItem[]> {
    let params = new HttpParams();
    if (candidateGroups?.length) {
      candidateGroups.forEach(g => { params = params.append('candidateGroups', g); });
    }
    return this.http.get<TaskInboxItem[]>(`${API_BASE_URL}/tasks/inbox`, { params });
  }

  getMyTaskCount(candidateGroups?: string[]): Observable<{ count: number }> {
    let params = new HttpParams();
    if (candidateGroups?.length) {
      candidateGroups.forEach(g => { params = params.append('candidateGroups', g); });
    }
    return this.http.get<{ count: number }>(`${API_BASE_URL}/tasks/inbox/count`, { params });
  }

  claimTask(taskId: string): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/tasks/${taskId}/claim`, {});
  }

  unclaimTask(taskId: string): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/tasks/${taskId}/unclaim`, {});
  }

  refreshCount(candidateGroups?: string[]): void {
    this.getMyTaskCount(candidateGroups).pipe(
      catchError(() => of({ count: 0 }))
    ).subscribe(r => this.taskCount$.next(r.count));
  }

  startPolling(candidateGroups?: string[]): Observable<number> {
    return interval(30000).pipe(
      startWith(0),
      switchMap(() => this.getMyTaskCount(candidateGroups).pipe(
        catchError(() => of({ count: 0 }))
      )),
      switchMap(r => {
        this.taskCount$.next(r.count);
        return this.taskCount$;
      })
    );
  }

  getRecordRoute(task: TaskInboxItem): string {
    const id = task.recordId;
    switch (task.recordType) {
      case 'DEVIATION': return id ? `/deviations/detail/${id}` : '/deviations';
      case 'CAPA': return id ? `/capa/detail/${id}` : '/capa';
      case 'CHANGE_CONTROL': return id ? `/change-control/detail/${id}` : '/change-control';
      case 'DOCUMENT': return id ? `/documents/detail/${id}` : '/documents';
      case 'TRAINING': return '/training';
      case 'COMPLAINT': return id ? `/complaint/${id}` : '/complaint/list';
      case 'RISK_REGISTER': return id ? `/risk/registers/${id}` : '/risk';
      case 'SUPPLIER': return id ? `/supplier/${id}` : '/supplier/list';
      case 'EQUIPMENT': return id ? `/equipment/${id}` : '/equipment/list';
      case 'AUDIT': return id ? `/audit/${id}` : '/audit/list';
      case 'NONCONFORMANCE': return id ? `/nonconformance/${id}` : '/nonconformance/list';
      default: return '/dashboard';
    }
  }

  getRecordIcon(recordType: string): string {
    switch (recordType) {
      case 'DEVIATION': return 'report_problem';
      case 'CAPA': return 'assignment_turned_in';
      case 'CHANGE_CONTROL': return 'swap_horiz';
      case 'DOCUMENT': return 'description';
      case 'TRAINING': return 'school';
      case 'COMPLAINT': return 'feedback';
      case 'RISK_REGISTER': return 'warning';
      case 'SUPPLIER': return 'local_shipping';
      case 'EQUIPMENT': return 'precision_manufacturing';
      case 'AUDIT': return 'fact_check';
      case 'NONCONFORMANCE': return 'error_outline';
      default: return 'task_alt';
    }
  }
}
