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

    export type NetworkChartRoot = {
        serverId: string;
        charts: NetworkChart[];
    };

    // export type NetworkChart = {
    //     type:
    //         | 'players'
    //         | 'chat-activity'
    //         | 'tps'
    //         | 'ram'
    //         | 'cpu'
    //         | 'system-cpu'
    //         | 'network-throughput';
    //     collectionTimestamp: number;
    //     mode: 'sampling' | 'updates';
    //     sampleRate?: number;
    //     scale?: {
    //         min: number;
    //         max: number;
    //         log?: number;
    //     };
    //     data: number[] | [number, number][];
    // };

    export type NetworkChart = {
        type:
            | 'players'
            | 'chat-activity'
            | 'tps'
            | 'ram'
            | 'cpu'
            | 'system-cpu'
            | 'network-throughput';
        collectionTimestamp: number;
        scale?: {
            min: number;
            max: number;
            log?: number;
        };
    } & (
        | {
              mode: 'sampling';
              sampleRate: number;
              data: number[];
          }
        | {
              mode: 'updates';
              data: [number, number][];
          }
    );

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

        return res.json({ roots: Array.from(rootServers), servers });
    }

    export function getServer(req: Request, res: Response) {
        const id = req.params.id;
        const server = serverMap.get(id);

        if (!server) {
            return res.status(404).json({ error: 'Server not found' });
        }

        return res.json(server);
    }

    export function getServerCharts(req: Request, res: Response) {
        const id = req.params.id;
        const server = serverMap.get(id);

        if (!server) {
            res.status(404).json({ error: 'Server not found' });
            return;
        }

        if (!req.query.type) {
            return res
                .status(400)
                .json({ error: 'Missing type query parameter' });
        }

        const rawTypes = (
            Array.isArray(req.query.type) ? req.query.type : [req.query.type]
        ) as string[];

        const since = req.query.since ? parseInt(req.query.since as string) : 0;

        const types = new Set(rawTypes);

        const chartRoot: NetworkChartRoot = {
            serverId: id,
            charts: [],
        };

        const timestamp = Date.now();

        for (const type of types) {
            switch (type) {
                case 'players': {
                    chartRoot.charts.push({
                        type,
                        collectionTimestamp: timestamp,
                        mode: 'sampling',
                        sampleRate: 60000,
                        scale: {
                            min: 0,
                            max: 64,
                        },
                        data: fastRandomTrend(30 + 1, 0, 64, 2),
                    });
                    break;
                }
                case 'chat-activity': {
                    chartRoot.charts.push({
                        type,
                        collectionTimestamp: timestamp,
                        mode: 'sampling',
                        sampleRate: 60000,
                        data: fastRandomTrend(30 + 1, 0, 45, 5, 0, 10),
                    });
                    break;
                }
                case 'tps': {
                    chartRoot.charts.push({
                        type,
                        collectionTimestamp: timestamp,
                        mode: 'updates',
                        data: fastRandomUpdatingTrend(
                            20,
                            timestamp,
                            1800000,
                            1000,
                            0,
                            20,
                            1,
                            18,
                            20
                        ),
                    });
                    break;
                }
                case 'ram': {
                    chartRoot.charts.push({
                        type,
                        collectionTimestamp: timestamp,
                        mode: 'sampling',
                        sampleRate: 1000,
                        scale: {
                            min: 0,
                            max: 8192,
                        },
                        data: fastRandomTrend(
                            180 + 1,
                            800,
                            2500,
                            50,
                            1000,
                            1300
                        ),
                    });
                    break;
                }
                case 'cpu': {
                    chartRoot.charts.push({
                        type,
                        collectionTimestamp: timestamp,
                        mode: 'sampling',
                        sampleRate: 10000,
                        data: fastRandomTrend(180 + 1, 4, 85, 1, 4, 10),
                    });
                    break;
                }
                case 'system-cpu': {
                    chartRoot.charts.push({
                        type,
                        collectionTimestamp: timestamp,
                        mode: 'sampling',
                        sampleRate: 10000,
                        data: fastRandomTrend(180 + 1, 4, 85, 1, 4, 10),
                    });
                    break;
                }
                case 'network-throughput': {
                    chartRoot.charts.push({
                        type,
                        collectionTimestamp: timestamp,
                        mode: 'sampling',
                        sampleRate: 10000,
                        data: fastRandomTrend(180 + 1, 0, 6000, 100, 200, 500),
                    });
                    break;
                }
            }
        }

        return res.json(chartRoot);
    }
}

function fastRandomTrend(
    count: number,
    min: number,
    max: number,
    delta: number,
    startMin?: number,
    startMax?: number
): number[] {
    const array = new Array(count);
    const deltaRange = delta * 2 + 1;

    startMin = startMin ?? min;
    startMax = startMax ?? max;

    array[0] = Math.floor(Math.random() * (startMax - startMin + 1) + startMin);

    for (let i = 1; i < count; i++) {
        array[i] = Math.min(
            max,
            Math.max(
                min,
                array[i - 1] + Math.floor(Math.random() * deltaRange) - delta
            )
        );
    }

    return array;
}

function fastRandomUpdatingTrend(
    count: number,
    startTimestamp: number,
    timeframe: number,
    timeframeInterval: number,
    min: number,
    max: number,
    delta: number,
    startMin?: number,
    startMax?: number
): [number, number][] {
    const array = new Array(count);
    const deltaRange = delta * 2 + 1;

    const maxPoints = Math.floor(timeframe / timeframeInterval);
    if (maxPoints < count) {
        throw new Error(
            `Not enough points to generate (max ${maxPoints}, requested ${count})`
        );
    }
    const pointsToChangeSet = new Set<number>();
    while (pointsToChangeSet.size < count - 1) {
        pointsToChangeSet.add(Math.floor(Math.random() * maxPoints));
    }

    const pointsToChange = Array.from(pointsToChangeSet).sort((a, b) => a - b);
    pointsToChange.push(maxPoints);

    startMin = startMin ?? min;
    startMax = startMax ?? max;

    array[0] = [
        startTimestamp,
        Math.floor(Math.random() * (startMax - startMin + 1) + startMin),
    ];

    for (let i = 1; i < count; i++) {
        array[i] = [
            startTimestamp + pointsToChange[i] * timeframeInterval,
            Math.min(
                max,
                Math.max(
                    min,
                    array[i - 1][1] +
                        Math.floor(Math.random() * deltaRange) -
                        delta
                )
            ),
        ];
    }

    return array;
}
