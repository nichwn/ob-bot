import { injectable, multiInject } from 'inversify';
import {
  MessageHandler,
  MessageCategory,
  MessageHandlerWithHelp,
} from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { compareCaseInsensitive } from '../../utils/compare';
import { startSymbol } from '../../utils/environment';

@injectable()
export class HelpHandler extends MessageHandler {
  private messageHandlers: MessageHandlerWithHelp[];

  constructor(
    @multiInject(TYPES.MessageHandlerWithHelp)
    messageHandlers: MessageHandlerWithHelp[],
  ) {
    super('help');
    this.messageHandlers = messageHandlers;
  }

  handle(message: Message) {
    const handlersSorted = this.messageHandlers.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category < b.category ? -1 : 1;
      }
      return compareCaseInsensitive(a.commandPattern, b.commandPattern);
    });

    const lines = handlersSorted.map((handler, index) => {
      const handlerLines: string[] = [];
      if (
        index === 0 ||
        handler.category !== handlersSorted[index - 1].category
      ) {
        handlerLines.push(MessageCategory[handler.category]);
        handlerLines.push('===');
      }
      handlerLines.push(
        `${startSymbol}${handler.commandPattern}: ${handler.helpText}`,
      );
      return handlerLines.join('\n');
    });

    message.author.send(['```markdown', ...lines, '```'].join('\n'));
    message.reply('DMed!');
  }
}
