import { BotContext } from "../../../application/types/telegram.types";

export interface IBotService {
  init(token: string | undefined): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
