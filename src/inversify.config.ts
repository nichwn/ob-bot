import { Container } from 'inversify';
import { TYPES } from './types';
import { Bot } from './bot';
import { Client } from 'discord.js';
import { MessageResponder } from './messages/messageResponder';
import { HelpHandler } from './messages/messageHandler/helpHandler';
import { discordAuthToken, nodeEnvironment } from './utils/environment';
import {
  MessageHandler,
  MessageHandlerWithHelp,
} from './messages/messageHandler/messageHandler';
import { DataProxy } from './proxies/dataProxy';
import { RoleService } from './services/roleService';
import { CreateTallyHandler } from './messages/messageHandler/createTallyHandler';
import { TallyService } from './services/tallyService';
import { CancelTallyHandler } from './messages/messageHandler/cancelTallyHandler';
import { VoteHandler } from './messages/messageHandler/voteHandler';
import { UnvoteHandler } from './messages/messageHandler/unvoteHandler';
import { ShowVotesHandler } from './messages/messageHandler/showVotesHandler';
import { EmbedHelper } from './messages/embedHelper';
import { DataCache } from './cache/cache';
import { InMemoryCache } from './cache/InMemoryCache';
import { CloudCache } from './cache/cloudCache';
import { Storage } from '@google-cloud/storage';

const container = new Container();

container.bind<Bot>(TYPES.Bot).to(Bot).inSingletonScope();
container.bind<Client>(TYPES.Client).toConstantValue(new Client());
container
  .bind<DataCache>(TYPES.DataCache)
  .to(nodeEnvironment === 'production' ? CloudCache : InMemoryCache)
  .inSingletonScope();
container.bind<DataProxy>(TYPES.DataProxy).to(DataProxy);
container.bind<EmbedHelper>(TYPES.EmbedHelper).to(EmbedHelper);
container.bind<MessageHandler>(TYPES.MessageHandler).to(HelpHandler);
container.bind<MessageHandler>(TYPES.MessageHandler).to(CancelTallyHandler);
container.bind<MessageHandler>(TYPES.MessageHandler).to(CreateTallyHandler);
container.bind<MessageHandler>(TYPES.MessageHandler).to(ShowVotesHandler);
container.bind<MessageHandler>(TYPES.MessageHandler).to(UnvoteHandler);
container.bind<MessageHandler>(TYPES.MessageHandler).to(VoteHandler);
container
  .bind<MessageHandlerWithHelp>(TYPES.MessageHandlerWithHelp)
  .to(CancelTallyHandler);
container
  .bind<MessageHandlerWithHelp>(TYPES.MessageHandlerWithHelp)
  .to(CreateTallyHandler);
container
  .bind<MessageHandlerWithHelp>(TYPES.MessageHandlerWithHelp)
  .to(ShowVotesHandler);
container
  .bind<MessageHandlerWithHelp>(TYPES.MessageHandlerWithHelp)
  .to(UnvoteHandler);
container
  .bind<MessageHandlerWithHelp>(TYPES.MessageHandlerWithHelp)
  .to(VoteHandler);
container.bind<MessageResponder>(TYPES.MessageResponder).to(MessageResponder);
container.bind<RoleService>(TYPES.RoleService).to(RoleService);
container.bind<TallyService>(TYPES.TallyService).to(TallyService);
container.bind<Storage>(TYPES.Storage).toConstantValue(new Storage());
container.bind<string>(TYPES.Token).toConstantValue(discordAuthToken);

export default container;
