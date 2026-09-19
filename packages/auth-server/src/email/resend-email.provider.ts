import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailProvider } from './email-provider.interface';

export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
    if (error) {
      this.logger.error(`Failed to send "${subject}" to ${to}: ${error.message}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }
    this.logger.log(`Sent "${subject}" to ${to}`);
  }
}
