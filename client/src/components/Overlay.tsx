import { Box, Stack, Text, useBreakpointValue } from "@chakra-ui/react";
import { Button } from "./ui/button";

const Overlay = () => {
    const fontSize = useBreakpointValue({ base: "75px", md: "100px", lg: "120px" });
    const bgHeight = useBreakpointValue({ base: "200px", lg: "250px" });

    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            color="white"
            textAlign={"center"}
            width="100%"
            height={"100%"}
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"center"}
            overflow={"hidden"}
            id={"noSelect"}
        >
            <Stack display="flex" flexDirection="column" alignItems="center" gap={5}>
                <Box
                    bg="rgba(0,0,0,0.5)"
                    height={bgHeight}
                    width={"100%"}
                    textAlign={"center"}
                    justifyContent={"center"}
                    display={"flex"}
                    alignItems={"center"}
                >
                    <Text fontSize={fontSize} color="white">
                        jomity.net
                    </Text>
                </Box>
                <Stack display="flex" flexDirection="row" gap={5}>
                    <Button
                        bg={"#00ff00"}
                        _hover={{
                            bg: "#00ff00",
                            opacity: 0.7,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open("https://github.com/J0m1ty", "_blank");
                        }}
                    >
                        GitHub
                    </Button>
                    <Button
                        bg={"#00ff00"}
                        _hover={{
                            bg: "#00ff00",
                            opacity: 0.7,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open("https://www.linkedin.com/in/jomity/", "_blank");
                        }}
                    >
                        LinkedIn
                    </Button>
                    <Button
                        bg={"#00ff00"}
                        _hover={{
                            bg: "#00ff00",
                            opacity: 0.7,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open(
                                "https://open.spotify.com/user/psbmkzrjh8ap9z2j0ioraesci?si=ffd394c84a164056",
                                "_blank"
                            );
                        }}
                    >
                        Spotify
                    </Button>
                </Stack>
            </Stack>
        </Box>
    )
}

export default Overlay;