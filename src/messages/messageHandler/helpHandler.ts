import { injectable, multiInject, inject } from 'inversify';
import {
  MessageHandler,
  MessageCategory,
  MessageHandlerWithHelp,
} from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { compareCaseInsensitive } from '../../utils/compare';
import { EmbedHelper } from '../embedHelper';

@injectable()
export class HelpHandler extends MessageHandler {
  private messageHandlers: MessageHandlerWithHelp[];
  private embedHelper: EmbedHelper;

  constructor(
    @multiInject(TYPES.MessageHandlerWithHelp)
    messageHandlers: MessageHandlerWithHelp[],
    @inject(TYPES.EmbedHelper) embedHelper: EmbedHelper,
  ) {
    super('help');
    this.messageHandlers = messageHandlers;
    this.embedHelper = embedHelper;
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

    const response = this.embedHelper.makeHelpEmbed(handlersSorted);

    message.author.send(response);
    message.reply('DMed!');
  }
}
