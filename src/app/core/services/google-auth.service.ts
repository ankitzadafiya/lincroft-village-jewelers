import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

interface GoogleIdConfig {
  client_id: string;
  callback: (response: { credential: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleAccountsId {
  initialize(config: GoogleIdConfig): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      width?: number | string;
      logo_alignment?: string;
    }
  ): void;
  prompt(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  readonly clientId = environment.googleClientId?.trim() ?? '';
  readonly configured = !!this.clientId;
  readonly mockFallback = environment.useMockApi && !this.configured;

  private script?: Promise<void>;

  load(): Promise<void> {
    if (!this.configured) return Promise.reject(new Error('Google Client ID is not configured.'));
    if (window.google?.accounts?.id) return Promise.resolve();
    if (this.script) return this.script;
    this.script = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-lvj-google]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Unable to load Google sign-in.')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['lvjGoogle'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load Google sign-in.'));
      document.head.appendChild(script);
    });
    return this.script;
  }

  async attachButton(host: HTMLElement, onCredential: (idToken: string) => void): Promise<void> {
    await this.load();
    const api = window.google?.accounts?.id;
    if (!api) throw new Error('Google sign-in is unavailable.');
    api.initialize({
      client_id: this.clientId,
      callback: response => onCredential(response.credential),
      auto_select: false,
      cancel_on_tap_outside: true
    });
    host.replaceChildren();
    api.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: Math.max(host.clientWidth, 320),
      logo_alignment: 'left'
    });
  }
}
