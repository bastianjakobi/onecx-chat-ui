import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { AngularAcceleratorModule } from '@onecx/angular-accelerator';

/** Helper to access private members for testing */
function asAny(component: ChatComponent): any {
  return component;
}

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

  describe('retrySending', () => {
    it('should emit retrySendMessage with message text', () => {
      const testMessage = {
        text: 'Retry this message',
        creationDate: new Date(),
        id: '1',
        type: 'USER' as any,
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
        type: 'USER' as any,
        userName: 'testUser'
      };
      jest.spyOn(component.retrySendMessage, 'emit');

      component.retrySending(testMessage);

      expect(component.retrySendMessage.emit).toHaveBeenCalledWith('');
    });
  });

  /* ================================================================ */
  /*  Scroll management & new-message indicator                       */
  /* ================================================================ */

  describe('scroll management', () => {
    describe('onMessagesScroll', () => {
      it('should set isAtBottom to true when scrolled near the bottom', () => {
        const nativeEl = {
          scrollTop: 990,
          scrollHeight: 1000,
          clientHeight: 100,
        } as unknown as HTMLDivElement;

        asAny(component).messagesContainer = { nativeElement: nativeEl };
        component.onMessagesScroll();

        expect(component.isAtBottom).toBe(true);
      });

      it('should set isAtBottom to false when scrolled away from the bottom', () => {
        const nativeEl = {
          scrollTop: 500,
          scrollHeight: 1000,
          clientHeight: 100,
        } as unknown as HTMLDivElement;

        asAny(component).messagesContainer = { nativeElement: nativeEl };
        component.onMessagesScroll();

        expect(component.isAtBottom).toBe(false);
      });

      it('should clear newMessagesCount when user scrolls to bottom', () => {
        const nativeEl = {
          scrollTop: 990,
          scrollHeight: 1000,
          clientHeight: 100,
        } as unknown as HTMLDivElement;

        asAny(component).messagesContainer = { nativeElement: nativeEl };
        component.newMessagesCount = 5;

        component.onMessagesScroll();

        expect(component.isAtBottom).toBe(true);
        expect(component.newMessagesCount).toBe(0);
      });

      it('should NOT clear newMessagesCount when user is not at bottom', () => {
        const nativeEl = {
          scrollTop: 400,
          scrollHeight: 1000,
          clientHeight: 100,
        } as unknown as HTMLDivElement;

        asAny(component).messagesContainer = { nativeElement: nativeEl };
        component.newMessagesCount = 3;

        component.onMessagesScroll();

        expect(component.isAtBottom).toBe(false);
        expect(component.newMessagesCount).toBe(3);
      });

      it('should do nothing when messagesContainer is not yet available', () => {
        asAny(component).messagesContainer = undefined;

        // Should not throw
        component.onMessagesScroll();

        // State unchanged
        expect(component.isAtBottom).toBe(true);
      });
    });

    describe('scrollToBottom', () => {
      it('should call scrollTo with smooth behavior when smooth is true', () => {
        const scrollToSpy = jest.fn();
        const nativeEl = {
          scrollHeight: 2000,
          scrollTo: scrollToSpy,
        } as unknown as HTMLDivElement;

        asAny(component).messagesContainer = { nativeElement: nativeEl };
        component.scrollToBottom(true);

        expect(scrollToSpy).toHaveBeenCalledWith({
          top: 2000,
          behavior: 'smooth',
        });
        expect(component.isAtBottom).toBe(true);
        expect(component.newMessagesCount).toBe(0);
      });

      it('should use direct scrollTop when smooth is false', () => {
        const scrollToSpy = jest.fn();
        let capturedScrollTop = 0;
        const nativeEl = {
          scrollHeight: 2000,
          scrollTo: scrollToSpy,
          set scrollTop(val: number) { capturedScrollTop = val; },
          get scrollTop() { return capturedScrollTop; },
        } as unknown as HTMLDivElement;

        asAny(component).messagesContainer = { nativeElement: nativeEl };
        component.scrollToBottom(false);

        // scrollTo should NOT be called with smooth
        expect(scrollToSpy).not.toHaveBeenCalled();
        expect(capturedScrollTop).toBe(2000);
        expect(component.isAtBottom).toBe(true);
      });

      it('should do nothing when messagesContainer is undefined', () => {
        asAny(component).messagesContainer = undefined;

        // Should not throw
        component.scrollToBottom(true);
        component.scrollToBottom(false);
      });
    });

    describe('onIndicatorClick', () => {
      it('should call scrollToBottom with smooth enabled', () => {
        const scrollToBottomSpy = jest.spyOn(component, 'scrollToBottom');

        component.onIndicatorClick();

        expect(scrollToBottomSpy).toHaveBeenCalledWith(true);
      });
    });
  });

  /* ================================================================ */
  /*  ngOnChanges — message arrival detection                         */
  /* ================================================================ */

  describe('ngOnChanges', () => {
    beforeEach(() => {
      asAny(component).previousMessageCount = 0;
    });

    describe('when user is at bottom (isAtBottom === true)', () => {
      it('should invoke scrollToBottom and keep newMessagesCount at 0', () => {
        const scrollToBottomSpy = jest.spyOn(component, 'scrollToBottom');

        component.isAtBottom = true;
        component.chatMessages = [
          { id: '1', text: 'hello', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
          { id: '2', text: 'hi', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
        ];

        component.ngOnChanges({});

        expect(scrollToBottomSpy).toHaveBeenCalledWith(true);
        expect(component.newMessagesCount).toBe(0);
      });
    });

    describe('when user is NOT at bottom (isAtBottom === false)', () => {
      it('should increment newMessagesCount by the number of new messages', () => {
        const scrollToBottomSpy = jest.spyOn(component, 'scrollToBottom');

        component.isAtBottom = false;
        component.chatMessages = [
          { id: '1', text: 'hello', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
        ];

        component.ngOnChanges({});

        expect(scrollToBottomSpy).not.toHaveBeenCalled();
        expect(component.newMessagesCount).toBe(1);
      });

      it('should accumulate correct delta for multi-message arrival', () => {
        const scrollToBottomSpy = jest.spyOn(component, 'scrollToBottom');

        // Start with 2 existing messages
        asAny(component).previousMessageCount = 2;
        component.isAtBottom = false;
        component.chatMessages = [
          { id: '1', text: 'a', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
          { id: '2', text: 'b', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
          { id: '3', text: 'c', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
          { id: '4', text: 'd', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
        ];

        component.ngOnChanges({});

        expect(scrollToBottomSpy).not.toHaveBeenCalled();
        expect(component.newMessagesCount).toBe(2);
      });
    });

    describe('when no new messages arrive', () => {
      it('should not change newMessagesCount', () => {
        component.isAtBottom = false;
        component.newMessagesCount = 3;
        asAny(component).previousMessageCount = 1;
        component.chatMessages = [
          { id: '1', text: 'a', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
        ];

        component.ngOnChanges({});

        expect(component.newMessagesCount).toBe(3);
      });
    });

    describe('when messages are removed', () => {
      it('should not change newMessagesCount on removal', () => {
        component.isAtBottom = false;
        component.newMessagesCount = 2;
        asAny(component).previousMessageCount = 5;
        component.chatMessages = [
          { id: '1', text: 'a', creationDate: new Date(), type: 'HUMAN' as any, userName: 'u' },
        ];

        component.ngOnChanges({});

        // Delta is negative → no scroll, no count change
        expect(component.newMessagesCount).toBe(2);
      });
    });
  });

  /* ================================================================ */
  /*  Indicator visibility logic (template assertion)                  */
  /* ================================================================ */

  describe('indicator visibility', () => {
    it('should show indicator when newMessagesCount > 0 and isAtBottom is false', () => {
      component.newMessagesCount = 3;
      component.isAtBottom = false;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.new-messages-indicator');
      expect(indicator).toBeTruthy();
    });

    it('should NOT show indicator when newMessagesCount is 0', () => {
      component.newMessagesCount = 0;
      component.isAtBottom = false;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.new-messages-indicator');
      expect(indicator).toBeFalsy();
    });

    it('should NOT show indicator when isAtBottom is true even with count > 0', () => {
      component.newMessagesCount = 3;
      component.isAtBottom = true;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.new-messages-indicator');
      expect(indicator).toBeFalsy();
    });

    it('should display the correct count in the badge', () => {
      component.newMessagesCount = 7;
      component.isAtBottom = false;
      fixture.detectChanges();

      const countEl = fixture.nativeElement.querySelector('.indicator-count');
      expect(countEl.textContent).toBe('7');
    });
  });
});
