import { Message } from 'discord.js';
import { injectable, multiInject } from 'inversify';
import { TYPES } from '../types';
import { MessageHandler } from './messageHandler/messageHandler';

@injectable()
export class MessageResponder {
  private messageHandlers: MessageHandler[];

  constructor(
    @multiInject(TYPES.MessageHandler) messageHandlers: MessageHandler[],
  ) {
    this.messageHandlers = messageHandlers;
  }

  async handle(message: Message) {
    await Promise.all(
      this.messageHandlers
        .filter((handler) => handler.canProcess(message))
        .map((handler) => handler.handle(message)),
    ).catch(() => message.reply('something went wrong. Try again later.'));
  }
}
