import { BotContext } from "../../../../application/types/telegram.types";

export abstract class BaseHandler {
  protected async handleError(ctx: BotContext, error: any, message: string = 'Произошла ошибка. Пожалуйста, попробуйте позже.'): Promise<void> {
    console.error(`Error in ${this.constructor.name}:`, error);
    await ctx.reply(message);
  }

  protected getUserId(ctx: BotContext): string | undefined {
    return ctx.from?.id.toString();
  }

  protected ensureSession(ctx: BotContext): void {
    if (!ctx.session) {
      ctx.session = {};
    }
  }
}
