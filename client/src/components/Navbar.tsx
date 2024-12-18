import { Box, Flex, IconButton, MenuItem, Stack, Text } from "@chakra-ui/react";
import { ColorModeButton, useColorModeValue } from "../components/ui/color-mode";
import { MenuContent, MenuRoot, MenuTrigger } from "../components/ui/menu";
import { RxHamburgerMenu } from "react-icons/rx";
import { Link } from "react-router-dom";
import { toaster } from "./ui/toaster";

const Navbar = ({ refresh }: { refresh: () => void }) => {
    const iconColor = useColorModeValue("#000", "#fff");

    return (
        <Box px={5} bgColor={"bg.subtle"} borderBottom={"1px solid"} borderColor={"bg.emphasized"}>
            <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
                <Box fontSize={"xl"} fontWeight={"bold"} flexDir="row" display="flex">jomity.net <Text color="green.solid" ml={2}>Services</Text></Box>

                <Flex alignItems={'center'}>
                    <Stack direction={"row"} gap={3}>
                        <ColorModeButton />
                        <MenuRoot>
                            <MenuTrigger asChild>
                                <IconButton
                                    variant="ghost"
                                    size="sm"
                                    css={{
                                        _icon: {
                                            width: "5",
                                            height: "5",
                                        },
                                    }}
                                >
                                    <RxHamburgerMenu color={iconColor} />
                                </IconButton>
                            </MenuTrigger>
                            <MenuContent>
                                <MenuItem
                                    value="home"
                                    _hover={{
                                        bg: "bg.emphasized",
                                        color: "fg.muted",
                                        transition: "all 0.2s",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Link to="/">Home</Link>
                                </MenuItem>
                                <MenuItem
                                    value="status"
                                    _hover={{
                                        bg: "bg.emphasized",
                                        color: "fg.muted",
                                        transition: "all 0.2s",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Link to="/status">Status</Link>
                                </MenuItem>
                                <MenuItem
                                    value="refresh"
                                    color={"green.fg"}
                                    _hover={{
                                        bg: "green.solid",
                                        color: "green.contrast",
                                        transition: "all 0.2s",
                                        cursor: "pointer"
                                    }}
                                    onClick={refresh}
                                >
                                    Refresh
                                </MenuItem>
                            </MenuContent>
                        </MenuRoot>
                    </Stack>
                </Flex>
            </Flex>
        </Box>
    )
}

export default Navbar;