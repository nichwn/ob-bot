import { Message } from 'discord.js';

export interface MessageHandler {
  canProcess(message: Message): boolean;
  handle(message: Message): Promise<Message> | null;
}
