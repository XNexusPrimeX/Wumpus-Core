import { ApplicationCommandOptionData, Client, CommandInteraction, LocalizationMap, Permissions } from "discord.js";
import type { WumpusClient } from "../client";
import { Logger } from "../utils";

export declare class CommandData {
    name: string;
    name_localizations?: LocalizationMap;
    description: string;
    description_localizations?: LocalizationMap;
    options: ApplicationCommandOptionData[];
    default_permission?: boolean;
    default_member_permissions?: Permissions | null;
    dm_permission?: boolean;
    test?: boolean;
}

interface ICommand extends CommandData { run: Command['run'] }

export default class Command {
    static cache = new Map<string, Command>();
    
    public data: CommandData;
    public run: (options: {
        interaction: CommandInteraction;
        bot: WumpusClient<true>;
    }) => Promise<any>;
    
    static listen(client: WumpusClient) {
        client.on('interactionCreate', async interaction => {
            if(!interaction.isChatInputCommand()) return;
        
            const foundCommand = Command.cache.get(interaction.commandName);
        
            try {
                await foundCommand!.run({
                    interaction,
                    bot: client
                })
            } catch (err: any) {
                Logger.error(`CommandExecution: ${err.message}`, err.stack);
            }
        })
    }
    static register({ client, command }: { command: Command, client: WumpusClient }) {
        const commandsAplication = (client as Client<true>).application.commands;
        const testGuildId = client.testGuild?.id;

        commandsAplication.create(
            command.data,
            command.data.test 
                ? testGuildId 
                : undefined
        );

        Logger.debug(`Command ${command.data.name} loaded`);
    }
    static build(command: ICommand) {
        const { run, ...data } = command;

        return new this(run, data);
    }

    private constructor(run: Command['run'], data: Command['data']) {
        this.data = data;
        this.run = run;
    }
}