import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiCopilotService, ChatPanelMessage } from './ai-copilot.service';

@Component({
  selector: 'qms-ai-copilot-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  template: `
    <div class="ai-panel" [class.collapsed]="collapsed" [class.resizing]="isResizing"
         [style.width.px]="collapsed ? 32 : panelWidth"
         [style.min-width.px]="collapsed ? 32 : panelWidth">

      <!-- Resize handle (left edge) -->
      <div class="resize-handle" *ngIf="!collapsed"
           (mousedown)="onResizeStart($event)"
           matTooltip="Drag to resize" matTooltipPosition="left">
      </div>

      <!-- Toggle button -->
      <div class="panel-toggle" (click)="togglePanel()"
           [matTooltip]="collapsed ? 'Show AI Copilot' : 'Hide AI Copilot'">
        <mat-icon class="toggle-icon">
          {{ collapsed ? 'chevron_left' : 'chevron_right' }}
        </mat-icon>
        <mat-icon class="toggle-ai-icon" *ngIf="collapsed">smart_toy</mat-icon>
      </div>

      <div class="panel-content" *ngIf="!collapsed">
        <!-- Header -->
        <div class="panel-header">
          <div class="header-left">
            <mat-icon class="ai-icon">smart_toy</mat-icon>
            <div class="header-text">
              <span class="header-title">AI Copilot</span>
              <span class="header-subtitle" *ngIf="activeAgentType">{{ formatAgent(activeAgentType) }}</span>
              <span class="header-subtitle" *ngIf="!activeAgentType">QMS Assistant</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="hdr-btn" matTooltip="New Chat" (click)="newChat()">
              <mat-icon>add_comment</mat-icon>
            </button>
            <button class="hdr-btn" matTooltip="Chat History" [matMenuTriggerFor]="historyMenu">
              <mat-icon>history</mat-icon>
            </button>
            <mat-menu #historyMenu="matMenu">
              <div class="history-header">Recent Conversations</div>
              <button mat-menu-item *ngFor="let conv of recentConversations" (click)="loadConversation(conv.id)">
                <mat-icon>chat_bubble_outline</mat-icon>
                <span>{{ conv.title || 'Untitled' }}</span>
              </button>
              <button mat-menu-item *ngIf="recentConversations.length === 0" disabled>
                <span>No recent conversations</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item routerLink="/ai/dashboard">
                <mat-icon>dashboard</mat-icon>
                <span>AI Dashboard</span>
              </button>
            </mat-menu>
          </div>
        </div>

        <!-- Messages -->
        <div class="ai-messages" #messagesContainer>
          <!-- Welcome message -->
          <div class="welcome-msg" *ngIf="messages.length === 0">
            <mat-icon class="welcome-icon">smart_toy</mat-icon>
            <h3>QMS AI Copilot</h3>
            <p>I can help you with:</p>
            <div class="suggestion-chips">
              <button class="chip" (click)="sendSuggestion('Show me open CAPAs that need attention')">Open CAPAs</button>
              <button class="chip" (click)="sendSuggestion('Help me classify a deviation')">Classify Deviation</button>
              <button class="chip" (click)="sendSuggestion('Perform a risk assessment')">Risk Assessment</button>
              <button class="chip" (click)="sendSuggestion('What regulatory requirements apply to change controls?')">Regulatory Guidance</button>
              <button class="chip" (click)="sendSuggestion('Show trending quality issues')">Quality Trends</button>
              <button class="chip" (click)="sendSuggestion('Help me prepare an audit checklist')">Audit Checklist</button>
            </div>
          </div>

          <!-- Message list -->
          <div *ngFor="let msg of messages; trackBy: trackMessage" class="msg" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
            <div class="msg-avatar" *ngIf="msg.role === 'assistant'">
              <mat-icon>smart_toy</mat-icon>
            </div>
            <div class="msg-bubble">
              <div class="msg-agent-badge" *ngIf="msg.agentType && msg.role === 'assistant'">
                <mat-icon>{{ agentIcon(msg.agentType) }}</mat-icon>
                {{ formatAgent(msg.agentType) }}
              </div>
              <div class="msg-content" *ngIf="!msg.loading || msg.content" [innerHTML]="formatContent(msg.content)">
              </div><span class="typing-cursor" *ngIf="msg.loading && msg.content">|</span>
              <div class="msg-loading" *ngIf="msg.loading && !msg.content">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              </div>
              <div class="msg-meta" *ngIf="!msg.loading">
                <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                <span class="msg-latency" *ngIf="msg.latencyMs">{{ msg.latencyMs }}ms</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="ai-input">
          <div class="input-row">
            <textarea
              #chatInput
              [(ngModel)]="inputMessage"
              (keydown.enter)="onEnter($event)"
              placeholder="Ask me anything about QMS..."
              rows="1"
              [disabled]="isLoading"
              (input)="autoResize($event)"></textarea>
            <button class="send-btn" (click)="send()" [disabled]="!inputMessage.trim() || isLoading"
                    matTooltip="Send">
              <mat-icon>send</mat-icon>
            </button>
          </div>
          <div class="input-footer">
            <span class="powered-by">Powered by GPT-5 Mini</span>
            <span class="disclaimer">AI may make mistakes</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-self: stretch;
      min-height: 0;
    }

    .ai-panel {
      height: 100%;
      min-height: 0;
      background: #fff;
      border-left: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .ai-panel:not(.resizing) {
      transition: width 200ms ease, min-width 200ms ease;
    }

    /* -- Resize handle -- */
    .resize-handle {
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
      cursor: col-resize;
      z-index: 20;
      background: transparent;
    }
    .resize-handle:hover,
    .resize-handle:active {
      background: rgba(44, 95, 124, 0.15);
    }

    /* -- Toggle -- */
    .panel-toggle {
      position: absolute;
      top: 10px;
      left: 8px;
      z-index: 15;
      cursor: pointer;
      width: 24px;
      padding: 0;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .panel-toggle:hover { background: #f1f5f9; }
    .toggle-icon {
      font-size: 18px; width: 20px; height: 20px; line-height: 20px;
      color: #64748b; display: flex; align-items: center; justify-content: center;
    }
    .toggle-ai-icon {
      font-size: 16px; width: 16px; height: 16px;
      color: #ED8B00;
    }
    .collapsed .panel-toggle { left: 4px; top: 7px; }

    /* -- Content -- */
    .panel-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    /* -- Header -- */
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 10px 6px 36px;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 6px; }
    .ai-icon { font-size: 18px; width: 18px; height: 18px; color: #ED8B00; }
    .header-text { display: flex; flex-direction: column; }
    .header-title { font-size: 12px; font-weight: 600; color: #1B3A4B; }
    .header-subtitle { font-size: 10px; color: #94a3b8; }
    .header-actions { display: flex; gap: 2px; }
    .hdr-btn {
      background: none; border: none; color: #94a3b8;
      cursor: pointer; padding: 3px; border-radius: 4px; display: flex; align-items: center;
    }
    .hdr-btn:hover { background: #f1f5f9; color: #1B3A4B; }
    .hdr-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .history-header { padding: 8px 16px; font-weight: 600; font-size: 13px; color: #333; border-bottom: 1px solid #eee; }

    /* -- Messages -- */
    .ai-messages {
      flex: 1; overflow-y: auto; padding: 10px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f7f8fa;
      min-height: 0;
    }
    .ai-messages::-webkit-scrollbar { width: 4px; }
    .ai-messages::-webkit-scrollbar-thumb { background: #c7d0d9; border-radius: 999px; }

    /* -- Welcome -- */
    .welcome-msg {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 16px 8px; color: #475569;
    }
    .welcome-icon { font-size: 32px; width: 32px; height: 32px; color: #2C5F7C; margin-bottom: 6px; }
    .welcome-msg h3 { margin: 0 0 4px; font-size: 14px; color: #1B3A4B; }
    .welcome-msg p { margin: 0 0 10px; font-size: 11px; color: #667085; }
    .suggestion-chips { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; }
    .chip {
      padding: 4px 10px; border-radius: 12px; font-size: 11px;
      background: #e8f0fe; color: #1B3A4B; border: 1px solid #c8dae8;
      cursor: pointer; transition: all 0.15s;
    }
    .chip:hover { background: #d4e4f4; border-color: #2C5F7C; }

    /* -- Message Bubbles -- */
    .msg { display: flex; gap: 6px; max-width: 98%; }
    .msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .msg.assistant { align-self: flex-start; }
    .msg-avatar {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #1B3A4B, #2C5F7C);
      display: flex; align-items: center; justify-content: center;
    }
    .msg-avatar mat-icon { font-size: 14px; width: 14px; height: 14px; color: #ED8B00; }
    .msg-bubble {
      padding: 8px 10px; border-radius: 10px; font-size: 12px; line-height: 1.5;
    }
    .msg.user .msg-bubble {
      background: #1B3A4B; color: #fff;
      border-bottom-right-radius: 3px;
    }
    .msg.assistant .msg-bubble {
      background: #fff; color: #1f2937;
      border: 1px solid #e5e7eb; border-bottom-left-radius: 3px;
    }
    .msg-agent-badge {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 9px; color: #2C5F7C; background: #e8f0fe;
      padding: 1px 6px; border-radius: 8px; margin-bottom: 4px;
      font-weight: 600;
    }
    .msg-agent-badge mat-icon { font-size: 10px; width: 10px; height: 10px; }
    .msg-content { white-space: pre-wrap; word-break: break-word; }
    .msg-content :deep(strong) { font-weight: 600; }
    .msg-content :deep(code) {
      background: #f1f5f9; padding: 1px 3px; border-radius: 3px;
      font-size: 11px; font-family: 'Fira Code', monospace;
    }
    .msg-meta {
      display: flex; gap: 6px; margin-top: 3px;
      font-size: 9px; color: #94a3b8;
    }
    .msg.user .msg-meta { color: rgba(255,255,255,0.5); justify-content: flex-end; }

    /* Typing cursor */
    .typing-cursor {
      display: inline; font-weight: 700; color: #2C5F7C;
      animation: blink 0.8s step-end infinite;
    }
    @keyframes blink { 50% { opacity: 0; } }

    /* Loading dots */
    .msg-loading { display: flex; gap: 4px; padding: 4px 0; }
    .dot {
      width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;
      animation: bounce 1.2s infinite ease-in-out;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* -- Input -- */
    .ai-input {
      padding: 8px 10px; border-top: 1px solid #e5e7eb;
      background: #fff; flex-shrink: 0;
    }
    .input-row { display: flex; align-items: flex-end; gap: 6px; }
    .input-row textarea {
      flex: 1; border: 1px solid #d0d5dd; border-radius: 6px;
      padding: 6px 10px; font-size: 12px; font-family: inherit;
      resize: none; outline: none; max-height: 72px; min-height: 32px;
      line-height: 1.4;
    }
    .input-row textarea:focus { border-color: #2C5F7C; box-shadow: 0 0 0 2px rgba(44,95,124,0.1); }
    .input-row textarea:disabled { background: #f9fafb; }
    .send-btn {
      width: 32px; height: 32px; border-radius: 6px;
      background: #1B3A4B; color: #fff; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .send-btn:hover { background: #2C5F7C; }
    .send-btn:disabled { background: #cbd5e1; cursor: default; }
    .send-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .input-footer {
      display: flex; justify-content: space-between;
      margin-top: 3px; font-size: 9px; color: #94a3b8;
    }
    .powered-by { font-weight: 500; }
  `],
})
export class AiCopilotPanelComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;

  collapsed = true;
  panelWidth = 320;
  isResizing = false;
  inputMessage = '';
  messages: ChatPanelMessage[] = [];
  isLoading = false;
  activeAgentType: string | null = null;
  recentConversations: any[] = [];

  private readonly MIN_WIDTH = 240;
  private readonly MAX_WIDTH = 700;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private msgSub!: Subscription;
  private loadingSub!: Subscription;

  constructor(
    private aiService: AiCopilotService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.msgSub = this.aiService.currentMessages.subscribe((msgs) => {
      this.messages = msgs;
      const lastAssistant = [...msgs].reverse().find(m => m.role === 'assistant');
      this.activeAgentType = lastAssistant?.agentType || null;
      setTimeout(() => this.scrollToBottom(), 20);
    });
    this.loadingSub = this.aiService.isLoading.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnDestroy(): void {
    this.msgSub?.unsubscribe();
    this.loadingSub?.unsubscribe();
  }

  // -- Resize logic --
  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.panelWidth;
  }

  @HostListener('document:mousemove', ['$event'])
  onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    // Dragging left increases width, dragging right decreases
    const delta = this.resizeStartX - event.clientX;
    const newWidth = Math.min(this.MAX_WIDTH, Math.max(this.MIN_WIDTH, this.resizeStartWidth + delta));
    this.panelWidth = newWidth;
  }

  @HostListener('document:mouseup')
  onResizeEnd(): void {
    this.isResizing = false;
  }

  togglePanel(): void {
    this.collapsed = !this.collapsed;
    if (!this.collapsed) {
      this.loadRecentConversations();
      setTimeout(() => this.chatInput?.nativeElement?.focus(), 300);
    }
  }

  send(): void {
    if (!this.inputMessage.trim() || this.isLoading) return;
    const message = this.inputMessage.trim();
    this.inputMessage = '';
    if (this.chatInput) {
      this.chatInput.nativeElement.style.height = 'auto';
    }

    const currentUrl = this.router.url;
    let moduleContext: string | undefined;
    if (currentUrl.startsWith('/capa')) moduleContext = 'CAPA';
    else if (currentUrl.startsWith('/deviations')) moduleContext = 'DEVIATION';
    else if (currentUrl.startsWith('/change-control')) moduleContext = 'CHANGE_CONTROL';
    else if (currentUrl.startsWith('/documents')) moduleContext = 'DOCUMENT';
    else if (currentUrl.startsWith('/training')) moduleContext = 'TRAINING';
    else if (currentUrl.startsWith('/audit')) moduleContext = 'AUDIT';
    else if (currentUrl.startsWith('/risk')) moduleContext = 'RISK';
    else if (currentUrl.startsWith('/complaint')) moduleContext = 'COMPLAINT';
    else if (currentUrl.startsWith('/supplier')) moduleContext = 'SUPPLIER';
    else if (currentUrl.startsWith('/nonconformance')) moduleContext = 'NONCONFORMANCE';
    else if (currentUrl.startsWith('/equipment')) moduleContext = 'EQUIPMENT';

    this.aiService.sendMessageStreaming(message, moduleContext);
  }

  sendSuggestion(message: string): void {
    this.inputMessage = message;
    this.send();
  }

  newChat(): void {
    this.aiService.newConversation();
    this.activeAgentType = null;
  }

  loadConversation(id: string): void {
    this.aiService.loadConversation(id).subscribe();
  }

  onEnter(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 72) + 'px';
  }

  trackMessage(index: number, msg: ChatPanelMessage): string {
    return msg.id || `${msg.role}-${index}`;
  }

  formatContent(content: string): string {
    if (!content) return '';
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatAgent(type: string): string {
    const map: Record<string, string> = {
      COPILOT: 'General Assistant',
      CAPA_AGENT: 'CAPA Agent',
      DEVIATION_AGENT: 'Deviation Agent',
      CHANGE_CONTROL_AGENT: 'Change Control Agent',
      DOCUMENT_AGENT: 'Document Agent',
      TRAINING_AGENT: 'Training Agent',
      AUDIT_AGENT: 'Audit Agent',
      RISK_AGENT: 'Risk Agent',
      COMPLAINT_AGENT: 'Complaint Agent',
      SUPPLIER_AGENT: 'Supplier Agent',
      NC_AGENT: 'NC Agent',
      EQUIPMENT_AGENT: 'Equipment Agent',
      SUPERVISOR: 'Supervisor',
    };
    return map[type] || type;
  }

  agentIcon(type: string): string {
    const map: Record<string, string> = {
      COPILOT: 'smart_toy',
      CAPA_AGENT: 'assignment_turned_in',
      DEVIATION_AGENT: 'report_problem',
      CHANGE_CONTROL_AGENT: 'swap_horiz',
      DOCUMENT_AGENT: 'description',
      TRAINING_AGENT: 'school',
      AUDIT_AGENT: 'fact_check',
      RISK_AGENT: 'warning_amber',
      COMPLAINT_AGENT: 'feedback',
      SUPPLIER_AGENT: 'local_shipping',
      NC_AGENT: 'block',
      EQUIPMENT_AGENT: 'precision_manufacturing',
      SUPERVISOR: 'hub',
    };
    return map[type] || 'smart_toy';
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  private loadRecentConversations(): void {
    this.aiService.getConversations(0, 5).subscribe({
      next: (page: any) => {
        this.recentConversations = page.content || [];
      },
      error: () => {
        this.recentConversations = [];
      },
    });
  }
}
