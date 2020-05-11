import { Message } from 'discord.js';
import { injectable, unmanaged } from 'inversify';
import { compareCaseInsensitive } from '../../utils/compare';

@injectable()
export abstract class MessageHandler {
  readonly commandPattern: string;

  constructor(@unmanaged() commandPattern: string) {
    this.commandPattern = commandPattern;
  }

  canProcess(message: Message) {
    const commandProvided = message.content.slice(
      0,
      this.commandPattern.length,
    );
    return compareCaseInsensitive(commandProvided, this.commandPattern) === 0;
  }

  abstract handle(message: Message): void;
}

export enum MessageCategory {
  'Tally',
}

export abstract class MessageHandlerWithHelp extends MessageHandler {
  readonly category: MessageCategory;
  readonly helpText: string;

  constructor(
    @unmanaged() commandPattern: string,
    @unmanaged() category: MessageCategory,
    @unmanaged() helpText: string,
  ) {
    super(commandPattern);
    this.category = category;
    this.helpText = helpText;
  }
}
