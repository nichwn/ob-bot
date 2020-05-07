import { injectable } from 'inversify';
import { MessageHandler } from './messageHandler';
import { Message } from 'discord.js';

@injectable()
export class Echo implements MessageHandler {
  canProcess() {
    return true;
  }

  handle(message: Message) {
    return message.channel.send(`Received: ${message.content}`);
  }
}
