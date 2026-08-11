import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { AngularAcceleratorModule } from '@onecx/angular-accelerator';
import { By } from '@angular/platform-browser';
import { MessageType } from 'src/app/shared/generated';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChatComponent,
        AngularAcceleratorModule,
        TranslateTestingModule.withTranslations({
          'en': require('./src/assets/i18n/en.json'),
          'de': require('./src/assets/i18n/de.json')
        }).withDefaultLanguage('en')
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ── sendButtonClicked ─────────────────────────────────────── */

  describe('sendButtonClicked', () => {
    it('should emit sendMessage when form has valid message', () => {
      const testMessage = 'Test message';
      jest.spyOn(component.sendMessage, 'emit');

      component.formGroup.patchValue({ message: testMessage });
      component.sendButtonClicked();

      expect(component.sendMessage.emit).toHaveBeenCalledWith(testMessage);
      expect(component.formGroup.value.message).toBeNull();
    });

    it('should not emit sendMessage when message is null', () => {
      jest.spyOn(component.sendMessage, 'emit');

      component.formGroup.patchValue({ message: null });
      component.sendButtonClicked();

      expect(component.sendMessage.emit).not.toHaveBeenCalled();
    });

    it('should not emit sendMessage when message is empty string', () => {
      jest.spyOn(component.sendMessage, 'emit');

      component.formGroup.patchValue({ message: '' });
      component.sendButtonClicked();

      expect(component.sendMessage.emit).not.toHaveBeenCalled();
    });

    it('should not emit sendMessage when message is only whitespace', () => {
      jest.spyOn(component.sendMessage, 'emit');

      component.formGroup.patchValue({ message: '   ' });
      component.sendButtonClicked();

      expect(component.sendMessage.emit).toHaveBeenCalledWith('   ');
      expect(component.formGroup.value.message).toBeNull();
    });

    it('should reset form after sending message', () => {
      const testMessage = 'Test message';
      jest.spyOn(component.sendMessage, 'emit');
      jest.spyOn(component.formGroup, 'reset');

      component.formGroup.patchValue({ message: testMessage });
      component.sendButtonClicked();

      expect(component.formGroup.reset).toHaveBeenCalled();
    });
  });

  /* ── retrySending ──────────────────────────────────────────── */

  describe('retrySending', () => {
    it('should emit retrySendMessage with message text', () => {
      const testMessage = {
        text: 'Retry this message',
        creationDate: new Date(),
        id: '1',
        type: MessageType.Human,
        userName: 'testUser'
      };
      jest.spyOn(component.retrySendMessage, 'emit');

      component.retrySending(testMessage);

      expect(component.retrySendMessage.emit).toHaveBeenCalledWith('Retry this message');
    });

    it('should handle empty message text', () => {
      const testMessage = {
        text: '',
        creationDate: new Date(),
        id: '2',
        type: MessageType.Human,
        userName: 'testUser'
      };
      jest.spyOn(component.retrySendMessage, 'emit');

      component.retrySending(testMessage);

      expect(component.retrySendMessage.emit).toHaveBeenCalledWith('');
    });
  });

  /* ── Scroll state ──────────────────────────────────────────── */

  describe('scroll tracking', () => {
    beforeEach(() => {
      // Seed the component with an initial message set
      component.chatMessages = [
        { id: '1', text: 'Hello', creationDate: new Date(), type: MessageType.Human, userName: 'alice' }
      ];
      (component as any)._prevMessageCount = 1;
      fixture.detectChanges();
    });

    describe('isAtBottom', () => {
      it('should default to true', () => {
        expect(component.isAtBottom).toBe(true);
      });
    });

    describe('newMessagesCount', () => {
      it('should default to 0', () => {
        expect(component.newMessagesCount).toBe(0);
      });

      it('should increment when messages grow and user is NOT at bottom', () => {
        component.isAtBottom = false;

        component.chatMessages = [
          { id: '1', text: 'Hello', creationDate: new Date(), type: MessageType.Human, userName: 'alice' },
          { id: '2', text: 'Reply', creationDate: new Date(), type: MessageType.Assistant, userName: 'ai' },
          { id: '3', text: 'Another', creationDate: new Date(), type: MessageType.Assistant, userName: 'ai' },
        ];

        component.ngOnChanges({ chatMessages: { currentValue: component.chatMessages, previousValue: null, firstChange: false, isFirstChange: () => { return false; } } });

        expect(component.newMessagesCount).toBe(2);
      });

      it('should NOT increment when messages grow and user IS at bottom', () => {
        component.isAtBottom = true;

        component.chatMessages = [
          { id: '1', text: 'Hello', creationDate: new Date(), type: MessageType.Human, userName: 'alice' },
          { id: '2', text: 'Reply', creationDate: new Date(), type: MessageType.Assistant, userName: 'ai' },
        ];

        component.ngOnChanges({ chatMessages: { currentValue: component.chatMessages, previousValue: null, firstChange: false, isFirstChange: () => { return false; } } });

        expect(component.newMessagesCount).toBe(0);
      });

      it('should NOT change when messages shrink', () => {
        component.isAtBottom = false;

        component.chatMessages = [];

        component.ngOnChanges({ chatMessages: { currentValue: component.chatMessages, previousValue: null, firstChange: false, isFirstChange: () => { return false; } } });

        expect(component.newMessagesCount).toBe(0);
      });
    });

    describe('scrollToBottomAndClear', () => {
      it('should set newMessagesCount to 0', () => {
        component.newMessagesCount = 5;
        component.isAtBottom = false;

        component.scrollToBottomAndClear();

        expect(component.newMessagesCount).toBe(0);
      });

      it('should call scrollTo on the scroll container', () => {
        // Trigger ngAfterViewInit to set up the scroll container ref
        fixture.detectChanges();

        component.newMessagesCount = 3;

        const scrollEl = fixture.debugElement.query(By.css('.chat-history-container'))?.nativeElement;
        const scrollToSpy = jest.spyOn(scrollEl, 'scrollTo').mockImplementation(() => { return; });

        component.scrollToBottomAndClear();

        expect(scrollToSpy).toHaveBeenCalledWith({
          top: scrollEl.scrollHeight,
          behavior: 'smooth',
        });
      });
    });

    describe('indicator visibility', () => {
      it('should show indicator when newMessagesCount > 0 and not at bottom', () => {
        component.newMessagesCount = 1;
        component.isAtBottom = false;
        fixture.detectChanges();

        const indicator = fixture.debugElement.query(By.css('.new-messages-indicator'));
        expect(indicator).toBeTruthy();
      });

      it('should hide indicator when at bottom even with newMessagesCount > 0', () => {
        component.newMessagesCount = 3;
        component.isAtBottom = true;
        fixture.detectChanges();

        const indicator = fixture.debugElement.query(By.css('.new-messages-indicator'));
        expect(indicator).toBeFalsy();
      });

      it('should hide indicator when newMessagesCount is 0', () => {
        component.newMessagesCount = 0;
        component.isAtBottom = false;
        fixture.detectChanges();

        const indicator = fixture.debugElement.query(By.css('.new-messages-indicator'));
        expect(indicator).toBeFalsy();
      });

      it('should show badge only when count > 1', () => {
        component.newMessagesCount = 1;
        component.isAtBottom = false;
        fixture.detectChanges();

        const badge = fixture.debugElement.query(By.css('.indicator-badge'));
        expect(badge).toBeFalsy();
      });

      it('should show badge when count > 1', () => {
        component.newMessagesCount = 3;
        component.isAtBottom = false;
        fixture.detectChanges();

        const badge = fixture.debugElement.query(By.css('.indicator-badge'));
        expect(badge).toBeTruthy();
        expect(badge?.nativeElement.textContent?.trim()).toBe('3');
      });

      it('indicator button should have aria-label with count', () => {
        component.newMessagesCount = 2;
        component.isAtBottom = false;
        fixture.detectChanges();

        const btn = fixture.debugElement.query(By.css('.indicator-button'));
        expect(btn).toBeTruthy();
        expect(btn?.nativeElement.getAttribute('aria-label')).toBeTruthy();
      });

      it('indicator button click should call scrollToBottomAndClear', () => {
        component.newMessagesCount = 2;
        component.isAtBottom = false;
        fixture.detectChanges();

        const spy = jest.spyOn(component, 'scrollToBottomAndClear');

        const btn = fixture.debugElement.query(By.css('.indicator-button'));
        btn?.nativeElement.click();
        fixture.detectChanges();

        expect(spy).toHaveBeenCalled();
      });
    });

    describe('scroll event simulation', () => {
      it('should set isAtBottom to true when user scrolls to bottom and clear counter', fakeAsync(() => {
        component.isAtBottom = false;
        component.newMessagesCount = 5;
        fixture.detectChanges();

        const scrollEl = fixture.debugElement.query(By.css('.chat-history-container'))?.nativeElement;
        // Simulate being at the bottom
        Object.defineProperty(scrollEl, 'scrollHeight', { value: 500, writable: true, configurable: true });
        Object.defineProperty(scrollEl, 'scrollTop', { value: 450, writable: true, configurable: true });
        Object.defineProperty(scrollEl, 'clientHeight', { value: 50, writable: true, configurable: true });

        // The scroll listener is set up in ngAfterViewInit (outside zone)
        // Fire a scroll event
        scrollEl.dispatchEvent(new Event('scroll'));
        fixture.detectChanges();

        expect(component.isAtBottom).toBe(true);
        expect(component.newMessagesCount).toBe(0);
      }));

      it('should set isAtBottom to false when user scrolls up', fakeAsync(() => {
        component.isAtBottom = true;
        component.newMessagesCount = 0;
        fixture.detectChanges();

        const scrollEl = fixture.debugElement.query(By.css('.chat-history-container'))?.nativeElement;
        Object.defineProperty(scrollEl, 'scrollHeight', { value: 500, writable: true, configurable: true });
        Object.defineProperty(scrollEl, 'scrollTop', { value: 200, writable: true, configurable: true });
        Object.defineProperty(scrollEl, 'clientHeight', { value: 100, writable: true, configurable: true });

        scrollEl.dispatchEvent(new Event('scroll'));
        fixture.detectChanges();

        expect(component.isAtBottom).toBe(false);
        // Counter should NOT increase just from scrolling up
        expect(component.newMessagesCount).toBe(0);
      }));
    });
  });
});
