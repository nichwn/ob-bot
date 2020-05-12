import { injectable, multiInject } from 'inversify';
import {
  MessageHandler,
  MessageCategory,
  MessageHandlerWithHelp,
} from './messageHandler';
import { Message, MessageEmbed } from 'discord.js';
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
    const handlersByCategory = this.messageHandlers.reduce(
      (accu, currentValue) => {
        const category = currentValue.category;
        const categoryCommands = accu[category] ?? [];
        accu[category] = [...categoryCommands, currentValue];
        return accu;
      },
      {} as {
        [category: number]: MessageHandlerWithHelp[];
      },
    );

    const handlersSorted = Object.entries(handlersByCategory)
      .sort(([handlerCategoryA], [handlerCategoryB]) =>
        handlerCategoryA < handlerCategoryB ? -1 : 1,
      )
      .map(
        ([handlerCategory, handlers]) =>
          [
            MessageCategory[handlerCategory],
            handlers.sort((handlerA, handlerB) =>
              compareCaseInsensitive(
                handlerA.commandPattern,
                handlerB.commandPattern,
              ),
            ),
          ] as [number, MessageHandlerWithHelp[]],
      );

    const response = new MessageEmbed()
      .setColor('#DC143C')
      .setTitle('Commands');

    handlersSorted.forEach(([handlerCategory, handlers]) =>
      response.addField(
        handlerCategory,
        handlers
          .map(
            (handler) =>
              `**${startSymbol}${handler.commandPattern}:** ${handler.helpText}`,
          )
          .join('\n'),
      ),
    );

    message.author.send(response);
    message.reply('DMed!');
  }
}
