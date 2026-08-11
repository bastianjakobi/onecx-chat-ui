import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
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
import { Subscription } from 'rxjs';

/**
 * Threshold (in px) from the bottom of the scroll container at which
 * we consider the user "at the bottom" — allows a small tolerance so
 * rounding or sub-pixel layout doesn't flip the flag constantly.
 */
const AT_BOTTOM_THRESHOLD = 40;

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
export class ChatComponent implements AfterViewInit, OnChanges, OnDestroy {
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

  /** Scrollable message list element */
  @ViewChild('scrollContainer') private readonly scrollContainer:
    | ElementRef
    | undefined;

  public formGroup: FormGroup;

  /** Scroll-state fields */
  isAtBottom = true;
  newMessagesCount = 0;

  /** Previous message-count used to detect newly appended items */
  private _prevMessageCount = 0;
  /** Whether the initial bottom-scroll has been performed */
  private _initialScrollDone = false;
  /** Zone subscription for scroll listener cleanup */
  private _scrollSub: Subscription | null = null;

  constructor(private readonly translateService: TranslateService, private readonly _ngZone: NgZone) {
    this.formGroup = new FormGroup({
      message: new FormControl(null, [
        Validators.minLength(1),
        Validators.maxLength(255),
        Validators.required,
      ]),
    });
  }

  /* ── Lifecycle ─────────────────────────────────────────────── */

  ngAfterViewInit(): void {
    this._setupScrollListener();

    // Initial scroll to bottom so chat opens at latest message.
    // We defer to the next microtask so the DOM has rendered.
    queueMicrotask(() => {
      this._scrollToBottom();
      this._initialScrollDone = true;
    });
  }

  /**
   * React to `@Input()` changes — when `chatMessages` grows we decide
   * whether to auto-scroll or increment the unseen-message counter.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chatMessages']) {
      const currentCount = this.chatMessages.length;

      if (currentCount > this._prevMessageCount) {
        if (this.isAtBottom) {
          this._scrollToBottomSmooth();
        } else {
          this.newMessagesCount += currentCount - this._prevMessageCount;
        }
      }

      this._prevMessageCount = currentCount;
    }
  }

  ngOnDestroy(): void {
    this._scrollSub?.unsubscribe();
  }

  /* ── Public getters / helpers ──────────────────────────────── */

  get agentsForDropdown() {
    return this.agents.map((a) => ({
      id: a.id,
      labelKey: a.labelKey,
    }));
  }

  sendButtonClicked() {
    if (
      !this.formGroup.value['message'] ||
      this.formGroup.value['message'] === ''
    )
      return;
    this.sendMessage.emit(this.formGroup.value['message']);
    this.formGroup.reset();
  }

  retrySending(msg: ChatMessage) {
    this.retrySendMessage.emit(msg.text);
  }

  /** Click handler — scroll to bottom and clear counter */
  scrollToBottomAndClear(): void {
    this._scrollToBottomSmooth();
    this.newMessagesCount = 0;
  }

  /* ── Scroll internals ──────────────────────────────────────── */

  /**
   * Bind a scroll listener outside Angular zone (performance) to
   * detect "at bottom" state and clear the counter.
   */
  private _setupScrollListener(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) {
      return;
    }

    this._ngZone.runOutsideAngular(() => {
      this._scrollSub = new Subscription();
      this._scrollSub.add(() => {
        el.removeEventListener('scroll', this._onScroll);
      });

      el.addEventListener('scroll', this._onScroll, { passive: true });
    });
  }

  private _onScroll = (): void => {
    this._ngZone.run(() => {
      const el = this.scrollContainer?.nativeElement;
      if (!el) {
        return;
      }

      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_THRESHOLD;

      this.isAtBottom = atBottom;

      if (atBottom) {
        this.newMessagesCount = 0;
      }
    });
  };

  /** Hard scroll to bottom (no animation) — used for initial load */
  private _scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }

  /** Smooth animated scroll to bottom */
  private _scrollToBottomSmooth(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) {
      return;
    }
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
  }
}
