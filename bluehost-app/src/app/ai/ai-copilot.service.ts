import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api/v1/ai`;

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

  /**
   * Send a message via SSE streaming — tokens arrive one-by-one for ChatGPT-style typing effect.
   */
  sendMessageStreaming(
    message: string,
    moduleContext?: string,
    recordId?: string,
    recordType?: string
  ): void {
    this.loading$.next(true);

    // Add user message immediately
    const currentMessages = this.messages$.value;
    currentMessages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    // Add assistant placeholder (loading dots)
    const assistantMsg: ChatPanelMessage = {
      role: 'assistant',
      content: '',
      loading: true,
      timestamp: new Date(),
    };
    currentMessages.push(assistantMsg);
    this.messages$.next([...currentMessages]);

    const request: AiChatRequest = {
      conversationId: this.conversationId$.value || undefined,
      message,
      moduleContext,
      recordId,
      recordType,
    };

    // Get auth token from localStorage (JWT) — stored as 'accessToken' by AuthService
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';

    fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamingContent = '';
        let agentType: string | undefined;

        const processChunk = (): Promise<void> => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              this.finalizeStreamingMessage(streamingContent, agentType);
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            // Split on double-newline to get complete SSE blocks
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() || ''; // Keep incomplete block in buffer

            for (const block of blocks) {
              if (!block.trim()) continue;
              // Parse SSE event: extract "event:" and "data:" lines
              let eventType = '';
              let dataStr = '';
              for (const line of block.split('\n')) {
                if (line.startsWith('event:')) {
                  eventType = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                  // Keep only leading space after "data:" per SSE spec (1 optional space)
                  dataStr = line.charAt(5) === ' ' ? line.substring(6) : line.substring(5);
                }
              }
              if (dataStr === '' && eventType !== 'token') continue;

              try {
                const data = JSON.parse(dataStr);
                switch (eventType) {
                  case 'meta':
                    this.conversationId$.next(data.conversationId);
                    break;
                  case 'agent':
                    agentType = data.agentType;
                    this.updateStreamingMessage(streamingContent, agentType, true);
                    break;
                  case 'token':
                    // Backend sends {"token":" Hello"} — extract the token value
                    streamingContent += (typeof data === 'object' && data.token != null) ? data.token : (typeof data === 'string' ? data : '');
                    this.updateStreamingMessage(streamingContent, agentType, true);
                    break;
                  case 'done':
                    this.finalizeStreamingMessage(
                      streamingContent,
                      agentType,
                      data.messageId,
                      data.latencyMs
                    );
                    break;
                  case 'error':
                    this.finalizeStreamingMessage(
                      data.message || 'An error occurred.',
                      agentType
                    );
                    break;
                }
              } catch {
                // JSON.parse failed — treat raw dataStr as token text
                if (eventType === 'token' && dataStr) {
                  streamingContent += dataStr;
                  this.updateStreamingMessage(streamingContent, agentType, true);
                }
              }
            }

            return processChunk();
          });
        };

        return processChunk();
      })
      .catch((err) => {
        const msgs = this.messages$.value.filter((m) => !m.loading);
        msgs.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        });
        this.messages$.next([...msgs]);
        this.loading$.next(false);
      });
  }

  private updateStreamingMessage(
    content: string,
    agentType?: string,
    stillStreaming = true
  ): void {
    const msgs = this.messages$.value;
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = content;
      lastMsg.agentType = agentType;
      lastMsg.loading = stillStreaming;
    }
    this.messages$.next([...msgs]);
  }

  private finalizeStreamingMessage(
    content: string,
    agentType?: string,
    messageId?: string,
    latencyMs?: number
  ): void {
    const msgs = this.messages$.value;
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = content;
      lastMsg.agentType = agentType;
      lastMsg.loading = false;
      lastMsg.id = messageId;
      lastMsg.latencyMs = latencyMs;
    }
    this.messages$.next([...msgs]);
    this.loading$.next(false);
  }
}
