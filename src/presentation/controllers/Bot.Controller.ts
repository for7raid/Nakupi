import { inject, injectable } from "tsyringe";
import { IBotService } from "../../domain/interfaces/services/IBotService";

@injectable()
export class BotController {
    constructor(
        @inject("IBotService") private botService: IBotService
    ) {}

    async start(token: string | undefined) {
        try {
            await this.botService.init(token);
            console.log("Bot has been started successfully.");
        } catch (error) {
            console.error("Error initializing the bot:", error);
            throw error;
        }
    }
}