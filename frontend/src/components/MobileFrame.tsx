// src/components/MobileFrame.tsx
import { ReactNode } from "react";
import {
    Box,
    Flex,
    Text,
} from "@chakra-ui/react";
import { FiBatteryCharging, FiWifi } from "react-icons/fi";
import {useColorModeValue} from "./ui/color-mode";

export function MobileFrame({ children }: { children: ReactNode }) {
    const bg = useColorModeValue("gray.50", "gray.800");
    const frameBg = useColorModeValue("white", "gray.700");

    return (
        <Flex justify="center" align="center" h="100vh" bg={bg}>
            <Box
                w="360px"
                h="640px"
                bg={frameBg}
                borderRadius="2xl"
                shadow="2xl"
                position="relative"
                overflow="hidden"
            >
                {/* Status Bar */}
                <Flex
                    px={4}
                    py={2}
                    justify="space-between"
                    align="center"
                    opacity={0.5}
                >
                    <Text fontSize="xs">9:12</Text>
                    <Flex align="center" gap={2} fontSize="xs">
                        <FiWifi />
                        <FiBatteryCharging />
                    </Flex>
                </Flex>

                {/* Content */}
                <Box p={4} h="full" overflowY="auto">
                    {children}
                </Box>
            </Box>
        </Flex>
    );
}
