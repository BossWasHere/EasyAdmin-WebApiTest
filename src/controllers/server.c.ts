import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

export namespace Server {
    const serverMap = new Map<string, NetworkServer>();
    const rootServers = new Set<string>();

    export type NetworkServerRoot = {
        servers: NetworkServer[];
    };

    export type NetworkServer = {
        type: 'standard' | 'proxy';
        id: string;
        platform: string;
        description: string;
        children?: string[];
        managableInstance: boolean;
        stats: {
            name: string;
            motd: string;
            online: boolean;
            onlinePlayers: number;
            maxPlayers: number;
        };
    };

    export function setup() {
        serverMap.clear();
        rootServers.clear();

        let players = 0;
        const serverTypeOpts = [
            'Lobby',
            'Survival',
            'Creative',
            'Minigames',
            'Prison',
            'PvP',
        ];

        for (let i = 0; i < Math.floor(Math.random() * 64); i++) {
            const online = Math.random() > 0.5;
            const playersOnServer = online ? Math.floor(Math.random() * 64) : 0;
            players += playersOnServer;

            const server: NetworkServer = {
                type: 'standard',
                id: randomUUID(),
                platform: Math.random() > 0.1 ? 'Paper' : 'Spigot',
                description:
                    serverTypeOpts[
                        Math.floor(Math.random() * serverTypeOpts.length)
                    ],
                managableInstance: Math.random() > 0.75,
                stats: {
                    name: `Server-${i}`,
                    motd: 'A Minecraft server',
                    online,
                    onlinePlayers: playersOnServer,
                    maxPlayers: 64,
                },
            };
            serverMap.set(server.id, server);
        }

        const root: NetworkServer = {
            type: 'proxy',
            id: randomUUID(),
            platform: 'BungeeCord',
            description: 'BungeeCord Proxy',
            children: [...serverMap.keys()],
            managableInstance: true,
            stats: {
                name: 'BungeeCord',
                motd: 'A Minecraft server',
                online: true,
                onlinePlayers: players,
                maxPlayers: (Math.floor(players / 1000) + 2) * 1000,
            },
        };
        rootServers.add(root.id);
        serverMap.set(root.id, root);
    }

    export function getServers(req: Request, res: Response) {
        const rootOnly = req.query.rootOnly === 'true';

        let servers: NetworkServer[] = [];
        if (rootOnly) {
            for (const id of rootServers) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                servers.push(serverMap.get(id)!);
            }
        } else {
            servers = Array.from(serverMap.values());
        }

        res.json({ roots: Array.from(rootServers), servers });
    }
}
