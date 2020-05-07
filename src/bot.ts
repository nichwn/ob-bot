import { Client, Message } from 'discord.js';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { MessageResponder } from './services/messageResponder';

@injectable()
export class Bot {
  private client: Client;
  private token: string;
  private messageResponder: MessageResponder;

  constructor(
    @inject(TYPES.Client) client: Client,
    @inject(TYPES.Token) token: string,
    @inject(TYPES.MessageResponder) messageResponder: MessageResponder,
  ) {
    this.client = client;
    this.token = token;
    this.messageResponder = messageResponder;
  }

  public listen(): Promise<string> {
    this.client.on('message', (message: Message) => {
      const startSymbol = process.env.START_SYMBOL!;

      if (message.author.bot || !message.content.startsWith(startSymbol)) {
        return;
      }
      message.content = message.content.slice(startSymbol.length);

      this.messageResponder.handle(message);
    });

    return this.client.login(this.token);
  }
}
