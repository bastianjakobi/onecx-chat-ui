import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChatMessage } from './chat.viewmodel';
import { TooltipModule } from 'primeng/tooltip';
import { ChatAgent } from 'src/app/chat/pages/chat-assistant/chat-assistant.state';
import { SelectModule } from 'primeng/select';

/** Pixel threshold for bottom detection — accounts for dynamic height changes */
const BOTTOM_THRESHOLD = 10;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    ProgressBarModule,
    TooltipModule,
  ],
})
export class ChatComponent implements OnChanges {
  @Input()
  chatMessages: ChatMessage[] = [];

  @Input()
  sendMessageDisabled = false;

  @Input()
  agents: ChatAgent[] = [];

  @Input()
  selectedAgentId: string | undefined;

  @Input()
  showAgentSelector = false;

  @Output()
  sendMessage = new EventEmitter<string>();

  @Output()
  retrySendMessage = new EventEmitter<string>();

  @Output()
  agentSelected = new EventEmitter<string>();

  @ViewChild('messagesContainer')
  private readonly messagesContainer: ElementRef<HTMLDivElement> | undefined;

  public formGroup: FormGroup;

  /* ---- Scroll / unread-indicator state ---- */
  /** Whether the user is considered scrolled to the bottom of the chat */
  public isAtBottom = true;

  /** Count of messages that arrived while the user was scrolled up */
  public newMessagesCount = 0;

  /** Tracked snapshot of the previous message list so we can detect deltas */
  private previousMessageCount = 0;

  constructor(private readonly translateService: TranslateService) {
    this.formGroup = new FormGroup({
      message: new FormControl(null, [
        Validators.minLength(1),
        Validators.maxLength(255),
        Validators.required,
      ]),
    });
  }

  /* ---- Lifecycle ---- */

  /**
   * Called whenever `@Input()` bindings change.
   * Detects new messages, scrolls or increments unread counter.
   */
  public ngOnChanges(_changes: SimpleChanges): void {
    const currentCount = this.chatMessages.length;
    const delta = currentCount - this.previousMessageCount;

    if (delta > 0) {
      if (this.isAtBottom) {
        // User is at bottom → smooth scroll down, no unread count
        this.scrollToBottom(true);
      } else {
        // User scrolled up → accumulate unread count
        this.newMessagesCount += delta;
      }
    }

    this.previousMessageCount = currentCount;
  }

  /* ---- Computed helpers ---- */

  get agentsForDropdown() {
    return this.agents.map((a) => ({
      id: a.id,
      labelKey: a.labelKey,
    }));
  }

  /* ---- Scroll helpers ---- */

  /**
   * Evaluate scroll position and update `isAtBottom`.
   * Threshold-based so that minor height changes don't flip state.
   */
  public onMessagesScroll(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    this.isAtBottom = scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD;

    if (this.isAtBottom && this.newMessagesCount > 0) {
      this.newMessagesCount = 0;
    }
  }

  /**
   * Scroll to the bottom of the message container.
   * Uses smooth scroll when supported, falls back to instant assignment.
   */
  public scrollToBottom(smooth = true): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;

    const targetTop = el.scrollHeight;

    if (smooth) {
      // Try smooth; polyfill fallback for environments lacking it
      try {
        el.scrollTo({ top: targetTop, behavior: 'smooth' });
      } catch {
        el.scrollTop = targetTop;
      }
    } else {
      el.scrollTop = targetTop;
    }

    this.isAtBottom = true;
    this.newMessagesCount = 0;
  }

  /**
   * Click handler for the floating new-message indicator.
   * Smooth scrolls to bottom and clears unread count.
   */
  public onIndicatorClick(): void {
    this.scrollToBottom(true);
  }

  /* ---- Message actions ---- */

  public sendButtonClicked(): void {
    if (
      !this.formGroup.value['message'] ||
      this.formGroup.value['message'] === ''
    )
      return;
    this.sendMessage.emit(this.formGroup.value['message']);
    this.formGroup.reset();
  }

  public retrySending(msg: ChatMessage): void {
    this.retrySendMessage.emit(msg.text);
  }
}
