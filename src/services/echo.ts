import { injectable } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';

@injectable()
export class EchoHandler extends MessageHandlerWithHelp {
  constructor() {
    super('echo', MessageCategory.Utility, "echo's message");
  }

  handle(message: Message) {
    return message.channel.send(
      `Received: ${message.content.slice(this.commandPattern.length)}`,
    );
  }
}
