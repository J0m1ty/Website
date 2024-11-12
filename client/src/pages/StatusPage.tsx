import { Box, Card, Collapsible, createListCollection, Flex, For, HStack, IconButton, SimpleGrid, Text } from "@chakra-ui/react";
import Navbar from "../components/Navbar"
import Footer from "../components/Footer";
import { SelectContent, SelectItem, SelectItemGroup, SelectRoot, SelectTrigger, SelectValueText } from "../components/ui/select";
import { useEffect, useState } from "react";
import { Avatar } from "../components/ui/avatar";
import { IoWarning } from "react-icons/io5";
import { BsThreeDots } from "react-icons/bs";
import { useColorModeValue } from "../components/ui/color-mode";
import { Button } from "../components/ui/button";

const StatusPage = () => {
    const iconColor = useColorModeValue("#000", "#fff");

    const [processes, setProcesses] = useState<Process[]>([
        {
            image: "",
            name: "Minecraft",
            port: 25565,
            locations: [],
            description: "A survival Minecraft server for friends. Invite only.",
            state: "online",
        },
        {
            image: "",
            name: "Mindustry",
            port: 6567,
            locations: [{ value: "Website", link: "https://mindustrygame.github.io/" }, { value: "GitHub", link: "https://github.com/J0m1ty/JomMod" }],
            description: "A sandbox tower-defense game. Defend your base from waves of powerful enemies.",
            state: "unknown",
        },
        {
            image: "",
            name: "pokerbot",
            locations: [{ value: "GitHub", link: "https://github.com/J0m1ty/pokerbot" }],
            description: "A discord bot that plays poker with you and your friends.",
            state: "offline",
        },
        {
            image: "",
            name: "threadblend",
            locations: [{ value: "GitHub", link: "https://github.com/J0m1ty/threadblend" }],
            description: "A discord bot for managing channels in your server. Highly customizable with plugins.",
            state: "offline",
        },
        {
            image: "",
            name: "Armadahex Auth",
            locations: [{ value: "GitHub", link: "https://github.com/J0m1ty/ArmadahexAuth" }],
            description: "A custom authentication service for Armadahex.",
            state: "online",
        },
        {
            image: "",
            name: "NGINX",
            locations: [],
            description: "A reverse proxy server for routing traffic from Cloudflare to different services.",
            state: "online",
        },
        {
            image: "",
            name: "Status",
            locations: [{ value: "Website", link: "https://status.jomity.com" }, { value: "GitHub", link: "https://github.com/J0m1ty/Website" }],
            description: "This status page. Shows the status of all services.",
            state: "online",
        }
    ]);

    useEffect(() => {
    }, []);

    return (
        <Flex h={"100vh"} flexDir={"column"}>
            <Navbar />
            <Box bg={"bg"} p={4} width={"100%"} display="flex" alignItems="center" borderBottom={"1px solid"} borderColor={"bg.emphasized"} gap={5}>
                <SelectRoot collection={sorts} size="sm" flex={{ base: "1", md: "0.3" }} maxW={{ base: "500px", md: "300px" }}>
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
                <SelectRoot collection={filters} size="sm" flex={{ base: "1", md: "0.3" }} maxW={{ base: "500px", md: "300px" }}>
                    <SelectTrigger clearable>
                        <SelectValueText placeholder="Filter by..." />
                    </SelectTrigger>
                    <SelectContent>
                        { categories.map((category, index) => (
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
            <Box p={5} overflowY={"auto"} flex={1}>
                <SimpleGrid gap={4} minChildWidth={"310px"} maxWidth="1600px" alignItems="flex-start">
                    <For each={processes}>
                        {(process, index) => (
                            <Card.Root variant="elevated" key={index}>
                                <Card.Body>
                                    <Collapsible.Root>
                                        <Flex justifyContent={"space-between"} flexDir={"row"} alignItems={"center"} w="100%">
                                            <HStack gap="4">
                                                <Avatar
                                                    src={process.image}
                                                    size="lg"
                                                    variant="outline"
                                                    outlineWidth="2px"
                                                    outlineColor={`${stateToColor(process.state)}/70`}
                                                    outlineOffset="2px"
                                                    outlineStyle="solid"
                                                    fallback={<IoWarning size="24" style={{ position: "relative", top: "-2px" }} />}
                                                />
                                                <Text fontWeight="semibold" textStyle="md">{process.name}</Text>
                                                <Text color="fg.subtle" fontSize="sm">{process.port ? `:${process.port}` : ""}</Text>
                                            </HStack>
                                            <Collapsible.Trigger>
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <BsThreeDots size="24" color={iconColor} />
                                                </IconButton>
                                            </Collapsible.Trigger>
                                        </Flex>
                                        <Collapsible.Content mt={2}>
                                            <Text color="fg.muted">{process.description}</Text>
                                            <Flex gap={2} mt={2}>
                                                <For each={process.locations}>
                                                    {(location, index) => (
                                                        <Button
                                                            key={index}
                                                            variant="surface"
                                                            color={stateToColor(process.state)}
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
            <Footer />
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
        { label: "Name", value: "name" },
        { label: "Uptime", value: "uptime" },
        { label: "Status", value: "status" },
        { label: "Category", value: "category" }
    ],
});

type State = "online" | "unknown" | "offline" | "disabled";

type Location = { value: string; link?: string };

interface Process {
    image: string;
    name: string;
    port?: number;
    locations: Location[];
    description: string;
    state: State;
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