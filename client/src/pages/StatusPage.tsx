import { Avatar, Box, Card, Center, Collapsible, createListCollection, Flex, For, HStack, IconButton, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import Navbar from "../components/Navbar"
import Footer from "../components/Footer";
import { SelectContent, SelectItem, SelectItemGroup, SelectRoot, SelectTrigger, SelectValueText } from "../components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { IoWarning } from "react-icons/io5";
import { BsThreeDots } from "react-icons/bs";
import { useColorMode, useColorModeValue } from "../components/ui/color-mode";
import { Button } from "../components/ui/button";
import { readableTime } from "../util/parse";
import { toaster, Toaster } from "../components/ui/toaster";
import armadahexUrl from "./../images/armadahex.webp";
import mindustryUrl from "./../images/mindustry.webp";
import minecraftUrl from "./../images/minecraft.webp";
import nginxUrl from "./../images/nginx.webp";
import pokerbotUrl from "./../images/pokerbot.webp";
import threadblendUrl from "./../images/threadblend.webp";
import websiteUrl from "./../images/website.webp";

const StatusPage = () => {
    const { colorMode } = useColorMode();
    const iconColor = useColorModeValue("#000", "#fff");
    const [sortValue, setSortValue] = useState("status");
    const [filterValue, setFilterValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [uptime, setUptime] = useState<number | null>(null);
    const [timer, setTimer] = useState(0);
    const [processes, setProcesses] = useState<Process[]>([
        {
            image: minecraftUrl,
            name: "Minecraft",
            key: "minecraft",
            tag: "game",
            port: 25565,
            locations: [{ value: "World Map", link: "https://map.jomity.net" }],
            description: "A survival Minecraft server for friends. Join at mc.jomity.net.",
            status: "unknown",
        },
        {
            image: mindustryUrl,
            name: "Mindustry",
            key: "mindustry",
            tag: "game",
            port: 6567,
            locations: [{ value: "Website", link: "https://mindustrygame.github.io/" }, { value: "GitHub", link: "https://github.com/J0m1ty/JomMod" }],
            description: "A sandbox tower-defense game. Defend your base from waves of powerful enemies.",
            status: "unknown",
        },
        {
            image: pokerbotUrl,
            invert: true,
            name: "pokerbot",
            key: "pokerbot",
            tag: "bot",
            locations: [{ value: "GitHub", link: "https://github.com/J0m1ty/pokerbot" }],
            description: "A discord bot that plays poker with you and your friends.",
            status: "unknown",
        },
        {
            image: threadblendUrl,
            invert: true,
            name: "threadblend",
            key: "threadblend",
            tag: "bot",
            locations: [{ value: "GitHub", link: "https://github.com/J0m1ty/threadblend" }],
            description: "A discord bot for managing channels in your server. Highly customizable with plugins.",
            status: "unknown",
        },
        {
            image: armadahexUrl,
            name: "Armadahex Auth",
            key: "armadahex",
            tag: "service",
            locations: [{ value: "GitHub", link: "https://github.com/J0m1ty/ArmadahexAuth" }],
            description: "A custom authentication service for Armadahex.",
            status: "unknown",
        },
        {
            image: nginxUrl,
            name: "NGINX",
            key: "nginx",
            tag: "other",
            locations: [],
            description: "A reverse proxy server for routing traffic from Cloudflare to different services.",
            status: "unknown",
        },
        {
            image: websiteUrl,
            name: "Status",
            key: "website",
            tag: "other",
            locations: [{ value: "Website", link: "https://status.jomity.com" }, { value: "GitHub", link: "https://github.com/J0m1ty/Website" }],
            description: "A status page for all services on my server.",
            status: "unknown",
        }
    ]);

    const fetchProcesses = async (): Promise<boolean> => {
        try {
            const response = await fetch("https://jomity.net/api/status", { method: "GET" });

            if (response.ok) {
                const { uptime, processes } = await response.json() as { uptime: number, processes: { name: string, status: string, cpu?: number, memory?: number, uptime?: number }[] };
                setUptime(uptime);

                setProcesses((list) => list.map((p) => {
                    const process = processes.find((r) => r.name === p.key);

                    if (!process) {
                        p.status = "disabled";
                        return p;
                    }

                    p.status = process.status as State;

                    if (process.cpu != undefined && process.memory != undefined && process.uptime != undefined) {
                        p.data = {
                            cpu: process.cpu,
                            memory: process.memory,
                            uptime: process.uptime
                        }
                    }

                    return p;
                }));
            }

            setLoading(false);
            setTimer(0);

            return true;
        } catch (ignored) { }

        return false;
    }

    const filteredAndSortedProcesses = useMemo(() => {
        return processes
            .filter((process) => {
                if (filterValue === "") {
                    return true;
                }

                if (filterValue === "online" || filterValue === "offline" || filterValue === "disabled") {
                    return process.status === filterValue;
                }

                if (filterValue === "games") return process.tag === "game";
                if (filterValue === "bots") return process.tag === "bot";
                if (filterValue === "services") return process.tag === "service";

                return true;
            })
            .sort((a, b) => {
                if (sortValue === "status") {
                    const order = ["online", "unknown", "offline", "disabled"];
                    return order.indexOf(a.status) - order.indexOf(b.status);
                }

                if (sortValue === "category") {
                    const order = ["game", "bot", "service", "other"];
                    return order.indexOf(a.tag) - order.indexOf(b.tag);
                }

                if (sortValue === "uptime") {
                    return (b.data ? b.data.uptime : 0) - (a.data ? a.data.uptime : 0);
                }

                return a.name.localeCompare(b.name);
            });
    }, [processes, filterValue, sortValue]);

    const handleRefresh = () => {
        const promise = fetchProcesses();

        toaster.promise(promise, {
            success: {
                title: "Successfully refreshed!"
            },
            error: {
                title: "Failed to fetch data"
            },
            loading: {
                title: "Refreshing..."
            }
        });
    }

    useEffect(() => {
        fetchProcesses();

        const fetchInterval = setInterval(fetchProcesses, 30000);

        const diffInterval = setInterval(() => {
            setTimer(t => t + 1);
        }, 1000);

        return () => {
            clearInterval(fetchInterval);
            clearInterval(diffInterval);
        };
    }, []);

    return (
        <Flex h={"100%"} flexDir={"column"}>
            <Navbar refresh={handleRefresh} />
            <Flex flexDir={"column"} flex={1} overflowY={"hidden"} position="relative">
                <Box bg={"bg"} p={4} width={"100%"} display="flex" alignItems="center" borderBottom={"1px solid"} borderColor={"bg.emphasized"} gap={5}>
                    <SelectRoot
                        collection={sorts}
                        size="sm"
                        flex={{ base: "1", md: "0.3" }}
                        maxW={{ base: "500px", md: "300px" }}
                        onValueChange={({ value }) => value.length === 0 ? setSortValue("status") : setSortValue(value[0])}
                    >
                        <SelectTrigger clearable>
                            <SelectValueText placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            {
                                sorts.items.map((sort) => (
                                    <SelectItem
                                        item={sort}
                                        key={sort.value}
                                        color="fg.muted"
                                        cursor={"pointer"}
                                        _hover={{ color: "fg" }}
                                    >
                                        {sort.label}
                                    </SelectItem>
                                ))
                            }
                        </SelectContent>
                    </SelectRoot>
                    <SelectRoot
                        collection={filters}
                        size="sm"
                        flex={{ base: "1", md: "0.3" }}
                        maxW={{ base: "500px", md: "300px" }}
                        onValueChange={({ value }) => value.length === 0 ? setFilterValue("") : setFilterValue(value[0])}
                    >
                        <SelectTrigger clearable>
                            <SelectValueText placeholder="Filter by..." />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category, index) => (
                                <SelectItemGroup label={category.group} key={category.group} mt={index !== 0 ? 4 : 0}>
                                    {
                                        category.items.map((item) => (
                                            <SelectItem
                                                item={item}
                                                key={item.value}
                                                color="fg.muted"
                                                cursor={"pointer"}
                                                _hover={{ color: "fg" }}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectItemGroup>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </Box>
                <Box flex={1} p={5} overflowY={loading ? "hidden" : "auto"}>
                    <SimpleGrid gap={4} minChildWidth={"310px"} maxWidth="1600px" alignItems="flex-start">
                        <For each={filteredAndSortedProcesses}>
                            {(process, index) => (
                                <Card.Root
                                    variant="elevated"
                                    key={index}
                                    borderBottomColor={`${stateToColor(process.status)}/20`}
                                    borderBottomWidth={2}
                                    borderBottomRadius={"md"}
                                >
                                    <Card.Body>
                                        <Collapsible.Root>
                                            <Flex justifyContent={"space-between"} flexDir={"row"} alignItems={"center"} w="100%">
                                                <HStack gap="4">
                                                    <Avatar.Root
                                                        size="lg"
                                                        variant="outline"
                                                        outlineWidth="2px"
                                                        outlineColor={`${stateToColor(process.status)}/70`}
                                                        outlineOffset="2px"
                                                        outlineStyle="solid"
                                                    >
                                                        <Avatar.Image src={process.image} loading="eager" />
                                                        <Avatar.Fallback>
                                                            <IoWarning size="24" style={{ position: "relative", top: "-2px" }} />
                                                        </Avatar.Fallback>
                                                    </Avatar.Root>
                                                    <Text fontWeight="semibold" textStyle="md">{process.name}</Text>
                                                    <Text color="fg.subtle" fontSize="sm">{process.port ? `:${process.port}` : ""}</Text>
                                                </HStack>
                                                <Collapsible.Trigger as={"div"}>
                                                    <IconButton
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <BsThreeDots size="24" color={iconColor} />
                                                    </IconButton>
                                                </Collapsible.Trigger>
                                            </Flex>
                                            <Collapsible.Content mt={4}>
                                                <Text color="fg.muted">{process.description}</Text>
                                                {process.status === "online" && process.data &&
                                                    <VStack mt={4} gap={2}>
                                                        <Flex justifyContent="space-between" w="100%">
                                                            <Text color="fg" fontSize="sm">CPU</Text>
                                                            <Text color="fg.subtle" fontSize="sm">{process.data.cpu}%</Text>
                                                        </Flex>
                                                        <Flex justifyContent="space-between" w="100%">
                                                            <Text color="fg" fontSize="sm">Memory</Text>
                                                            <Text color="fg.subtle" fontSize="sm">{process.data.memory}%</Text>
                                                        </Flex>
                                                        <Flex justifyContent="space-between" w="100%">
                                                            <Text color="fg" fontSize="sm">Uptime</Text>
                                                            <Text color="fg.subtle" fontSize="sm">{readableTime(process.data.uptime)}</Text>
                                                        </Flex>
                                                    </VStack>
                                                }
                                                <Flex gap={2} mt={4}>
                                                    <For each={process.locations}>
                                                        {(location, index) => (
                                                            <Button
                                                                key={index}
                                                                variant="surface"
                                                                color={stateToColor(process.status)}
                                                                flex={1}
                                                                mt={2}
                                                                fontSize="sm"
                                                                onClick={() => {
                                                                    if (location.link) {
                                                                        window.open(location.link, "_blank");
                                                                    }
                                                                }}
                                                            >
                                                                {location.value}
                                                            </Button>
                                                        )}
                                                    </For>
                                                </Flex>
                                            </Collapsible.Content>
                                        </Collapsible.Root>
                                    </Card.Body>
                                </Card.Root>
                            )}
                        </For>
                    </SimpleGrid>
                </Box>
                {loading &&
                    <Box pos="absolute" bg="bg/80" inset="0">
                        <Center h="full">
                            <Spinner size="xl" color="green.500" />
                        </Center>
                    </Box>
                }
            </Flex>
            <Footer uptime={`Uptime: ${readableTime(uptime, false, false)}`} last={uptime != null ? timer < 60 ? `Live` : `Updated ${readableTime(timer * 1000, true, false)}` : "Loading..."} />
            <Toaster />
        </Flex >
    )
}

const filters = createListCollection({
    items: [
        { label: "Online", value: "online", group: "Status" },
        { label: "Offline", value: "offline", group: "Status" },
        { label: "Disabled", value: "disabled", group: "Status" },
        { label: "Games", value: "games", group: "Category" },
        { label: "Bots", value: "bots", group: "Category" },
        { label: "Services", value: "services", group: "Category" }
    ],
});

const categories = filters.items.reduce(
    (acc, item) => {
        const group = acc.find((group) => group.group === item.group);
        if (group) {
            group.items.push(item);
        } else {
            acc.push({ group: item.group, items: [item] });
        }
        return acc;
    },
    [] as { group: string; items: (typeof filters)["items"] }[]
);


const sorts = createListCollection({
    items: [
        { label: "Status", value: "status" },
        { label: "Name", value: "name" },
        { label: "Uptime", value: "uptime" },
        { label: "Category", value: "category" }
    ],
});

type State = "online" | "unknown" | "offline" | "disabled";

type Tag = "game" | "bot" | "service" | "other";

type Location = { value: string; link?: string };

interface Process {
    image: string;
    invert?: true;
    key: string;
    name: string;
    tag: Tag;
    port?: number;
    locations: Location[];
    description: string;
    status: State;
    data?: {
        cpu: number;
        memory: number;
        uptime: number;
    }
}

const stateToColor = (state: State) => {
    switch (state) {
        case "online":
            return "green.500";
        case "unknown":
            return "yellow.500";
        case "offline":
            return "red.500";
        case "disabled":
            return "gray.500";
    }
}

export default StatusPage;