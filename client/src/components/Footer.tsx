import { Box, Flex, Text } from "@chakra-ui/react";
import { Status } from "./ui/status";

const Footer = ({ uptime, last }: { uptime: string, last: string }) => {
    return (
        <Flex bg="bg.subtle" p={2} px={5} justifyContent={"space-between"} borderTop={"1px solid"} borderColor={"bg.emphasized"}>
            <Text fontSize={"sm"} color={"fg.subtle"}>
                {uptime}
            </Text>
            <Box fontSize={"sm"} color={"fg.subtle"}>
                {last} { last === 'Live' ? <Status ml={1} value="success" opacity="0.8" /> : null }
            </Box>
        </Flex>
    )
}

export default Footer;