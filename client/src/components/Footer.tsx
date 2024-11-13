import { Box, Flex, Text } from "@chakra-ui/react";
import { Status } from "./ui/status";

const Footer = ({ uptime, live, last }: { uptime: string, live: boolean, last: string }) => {
    return (
        <Flex bg="bg.subtle" p={2} justifyContent={"space-between"} borderTop={"1px solid"} borderColor={"bg.emphasized"}>
            <Text fontSize={"sm"} color={"fg.subtle"}>
                {uptime}
            </Text>
            {live ?
                <Box fontSize={"sm"} color={"fg.subtle"}>
                    Updating live <Status ml={1} value="success" opacity="0.8" />
                </Box> :
                <Text fontSize={"sm"} color={"fg.subtle"}>
                    {last}
                </Text>
            }
        </Flex>
    )
}

export default Footer;