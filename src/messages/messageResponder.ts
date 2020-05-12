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

  handle(message: Message) {
    this.messageHandlers
      .filter((handler) => handler.canProcess(message))
      .map((handler) => handler.handle(message));
  }
}