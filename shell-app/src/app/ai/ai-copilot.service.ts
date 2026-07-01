import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

const API_BASE = 'http://localhost:8082/api/v1/ai';

export interface AiChatRequest {
  conversationId?: string;
  message: string;
  moduleContext?: string;
  recordId?: string;
  recordType?: string;
}

export interface AiChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  agentType: string;
  agentActions: AgentAction[];
  tokensUsed: number;
  latencyMs: number;
  timestamp: string;
}

export interface AgentAction {
  agentType: string;
  action: string;
  summary: string;
  requiresApproval: boolean;
  data?: any;
}

export interface AiConversation {
  id: string;
  title: string;
  status: string;
  moduleContext: string;
  recordId: string;
  recordType: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: AiMessage[];
}

export interface AiMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  agentType?: string;
  tokensUsed?: number;
  modelId?: string;
  latencyMs?: number;
  createdAt: string;
}

export interface AiDashboard {
  totalConversations: number;
  totalMessages: number;
  totalAgentExecutions: number;
  activeConversations: number;
  executionsToday: number;
  failedExecutions: number;
  pendingApprovals: number;
  executionsByAgent: Record<string, number>;
  executionsByStatus: Record<string, number>;
  agents: AiAgentConfig[];
  avgLatencyMs: number;
  totalTokensUsed: number;
}

export interface AiAgentConfig {
  id: string;
  agentType: string;
  displayName: string;
  description: string;
  isEnabled: boolean;
  modelId: string;
  temperature: number;
  maxTokens: number;
  toolsEnabled: string[];
  rateLimitRpm: number;
  requiresApprovalFor: string[];
}

export interface ChatPanelMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentType?: string;
  timestamp: Date;
  loading?: boolean;
  latencyMs?: number;
}

@Injectable({ providedIn: 'root' })
export class AiCopilotService {
  private conversationId$ = new BehaviorSubject<string | null>(null);
  private messages$ = new BehaviorSubject<ChatPanelMessage[]>([]);
  private loading$ = new BehaviorSubject<boolean>(false);

  currentConversationId = this.conversationId$.asObservable();
  currentMessages = this.messages$.asObservable();
  isLoading = this.loading$.asObservable();

  constructor(private http: HttpClient) {}

  sendMessage(message: string, moduleContext?: string, recordId?: string, recordType?: string): Observable<AiChatResponse> {
    this.loading$.next(true);

    // Add user message immediately
    const currentMessages = this.messages$.value;
    currentMessages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    // Add loading indicator
    currentMessages.push({
      role: 'assistant',
      content: '',
      loading: true,
      timestamp: new Date(),
    });
    this.messages$.next([...currentMessages]);

    const request: AiChatRequest = {
      conversationId: this.conversationId$.value || undefined,
      message,
      moduleContext,
      recordId,
      recordType,
    };

    return this.http.post<AiChatResponse>(`${API_BASE}/chat`, request).pipe(
      tap({
        next: (response) => {
          this.conversationId$.next(response.conversationId);
          // Remove loading indicator and add actual response
          const msgs = this.messages$.value.filter(m => !m.loading);
          msgs.push({
            id: response.messageId,
            role: 'assistant',
            content: response.content,
            agentType: response.agentType,
            timestamp: new Date(response.timestamp),
            latencyMs: response.latencyMs,
          });
          this.messages$.next([...msgs]);
          this.loading$.next(false);
        },
        error: (err) => {
          const msgs = this.messages$.value.filter(m => !m.loading);
          msgs.push({
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          });
          this.messages$.next([...msgs]);
          this.loading$.next(false);
        },
      })
    );
  }

  newConversation(): void {
    this.conversationId$.next(null);
    this.messages$.next([]);
  }

  loadConversation(conversationId: string): Observable<AiConversation> {
    return this.http.get<AiConversation>(`${API_BASE}/conversations/${conversationId}`).pipe(
      tap((conv) => {
        this.conversationId$.next(conv.id);
        if (conv.messages) {
          this.messages$.next(
            conv.messages.map((m) => ({
              id: m.id,
              role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
              content: m.content,
              agentType: m.agentType,
              timestamp: new Date(m.createdAt),
              latencyMs: m.latencyMs || undefined,
            }))
          );
        }
      })
    );
  }

  getConversations(page = 0, size = 20): Observable<any> {
    return this.http.get(`${API_BASE}/conversations`, { params: { page: page.toString(), size: size.toString() } });
  }

  archiveConversation(id: string): Observable<void> {
    return this.http.patch<void>(`${API_BASE}/conversations/${id}/archive`, {});
  }

  deleteConversation(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/conversations/${id}`);
  }

  getDashboard(): Observable<AiDashboard> {
    return this.http.get<AiDashboard>(`${API_BASE}/dashboard`);
  }

  getAgentConfigs(): Observable<AiAgentConfig[]> {
    return this.http.get<AiAgentConfig[]>(`${API_BASE}/agents`);
  }

  toggleAgent(id: string, enabled: boolean): Observable<void> {
    return this.http.patch<void>(`${API_BASE}/agents/${id}/toggle`, {}, { params: { enabled: enabled.toString() } });
  }

  getAuditTrail(page = 0, size = 20): Observable<any> {
    return this.http.get(`${API_BASE}/audit-trail`, { params: { page: page.toString(), size: size.toString() } });
  }
}
