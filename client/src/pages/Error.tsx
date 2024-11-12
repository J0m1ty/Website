import { Card, Center, Code, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";

const Error = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const goBack = () => {
        if (window.history.length > 2) {
            window.history.back();
        } else {
            navigate("/");
        }
    }

    return (
        <Center height="100vh">
            <Card.Root m={5}>
                <Stack dir="column" gap={5} divideY={"2px"}>
                    <Card.Header textAlign={"center"}>
                        404 Page Not Found
                    </Card.Header>
                    <Card.Body>
                        <Text>The requested page at <Code>{location.pathname.length < 20 ? location.pathname : location.pathname.substring(0, 17) + "..."}</Code> does not exist.</Text>
                        <Link onClick={goBack} color={"green.500"} >Go back to the previous page.</Link>
                    </Card.Body>
                </Stack>
            </Card.Root>
        </Center>
    );
}

export default Error;