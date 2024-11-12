import { Flex, Text } from "@chakra-ui/react";

const Footer = () => {
    return (
        <Flex bg="bg.subtle" p={2} justifyContent={"space-between"} borderTop={"1px solid"} borderColor={"bg.emphasized"}>
            <Text fontSize={"sm"} color={"fg.subtle"}>
                Uptime: 21 hours, 54 minutes
            </Text>
            <Text fontSize={"sm"} color={"fg.subtle"}>
                Updated 43 seconds ago
            </Text>
        </Flex>
    )
}

export default Footer;