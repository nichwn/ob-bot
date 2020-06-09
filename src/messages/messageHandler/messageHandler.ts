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
    const commandProvided = message.content.split(' ')[0];
    return compareCaseInsensitive(commandProvided, this.commandPattern) === 0;
  }

  abstract handle(message: Message): Promise<void>;
}

export enum MessageCategory {
  'Vote',
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
