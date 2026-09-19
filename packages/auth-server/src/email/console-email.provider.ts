import { Logger } from '@nestjs/common';
import { EmailProvider } from './email-provider.interface';

/**
 * Default provider in development/test: logs the email instead of sending it,
 * so verification/reset links are still visible (and clickable from the log)
 * without needing a real Resend key while developing.
 */
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async send(to: string, subject: string, html: string): Promise<void> {
    this.logger.log(`[dev email] to=${to} subject="${subject}"\n${stripHtml(html)}`);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
