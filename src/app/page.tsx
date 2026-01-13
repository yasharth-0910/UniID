'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Icon,
  Divider,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Fingerprint,
  Calendar,
  DoorOpen,
  UtensilsCrossed,
  Bus,
  Library,
  ArrowRight,
  Users,
  Zap,
  Shield,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Hero Section
function HeroSection() {
  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      position="relative"
      overflow="hidden"
    >
      {/* Background gradient */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="radial-gradient(ellipse at top, rgba(0, 115, 230, 0.15) 0%, transparent 50%)"
        pointerEvents="none"
      />

      <Container maxW="container.xl" py={20}>
        <VStack spacing={8} textAlign="center">
          <MotionBox
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              colorScheme="blue"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              mb={4}
            >
              Smart Campus Identity Platform
            </Badge>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Heading
              as="h1"
              fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
              fontWeight="bold"
              lineHeight="1.1"
              mb={6}
            >
              One Identity.
              <br />
              <Text as="span" color="blue.400">
                Every Campus Service.
              </Text>
            </Heading>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color="gray.400"
              maxW="2xl"
              mb={8}
            >
              UniID unifies student identity, attendance, access control, and
              campus payments into a single RFID-based card system.
            </Text>
          </MotionBox>

          <MotionFlex
            gap={4}
            flexDir={{ base: 'column', sm: 'row' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <Link href="/simulator">
              <Box
                as="button"
                px={8}
                py={4}
                bg="blue.500"
                color="white"
                borderRadius="lg"
                fontWeight="semibold"
                display="flex"
                alignItems="center"
                gap={2}
                _hover={{ bg: 'blue.600', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                Try Simulator
                <Icon as={ArrowRight} boxSize={5} />
              </Box>
            </Link>
            <Link href="/admin">
              <Box
                as="button"
                px={8}
                py={4}
                bg="transparent"
                color="white"
                borderRadius="lg"
                fontWeight="semibold"
                border="1px solid"
                borderColor="gray.600"
                _hover={{ borderColor: 'blue.500', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                Admin Dashboard
              </Box>
            </Link>
          </MotionFlex>
        </VStack>
      </Container>
    </Box>
  );
}

// Problem Section
function ProblemSection() {
  const problems = [
    {
      icon: CreditCard,
      title: 'Multiple Cards',
      description: 'Students carry separate cards for library, mess, and transport.',
    },
    {
      icon: Users,
      title: 'Siloed Systems',
      description: 'Each department manages its own isolated database.',
    },
    {
      icon: Calendar,
      title: 'Manual Attendance',
      description: 'Time-consuming paper-based or biometric attendance.',
    },
    {
      icon: Shield,
      title: 'Weak Access Control',
      description: 'Inconsistent security across campus facilities.',
    },
  ];

  return (
    <Box py={20} bg="rgba(255,255,255,0.02)">
      <Container maxW="container.xl">
        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <VStack spacing={4} textAlign="center" mb={16}>
            <Text color="red.400" fontWeight="semibold" letterSpacing="wide">
              THE PROBLEM
            </Text>
            <Heading as="h2" fontSize={{ base: '3xl', md: '4xl' }}>
              Fragmented Campus Systems
            </Heading>
            <Text color="gray.400" maxW="2xl">
              Today&apos;s campuses operate with disconnected identity systems,
              creating inefficiency for students and administration alike.
            </Text>
          </VStack>
        </MotionBox>

        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
            {problems.map((problem, index) => (
              <MotionBox key={index} variants={fadeIn}>
                <Box
                  p={6}
                  bg="rgba(255,255,255,0.03)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.800"
                  _hover={{ borderColor: 'red.500', transform: 'translateY(-4px)' }}
                  transition="all 0.3s"
                >
                  <Icon as={problem.icon} boxSize={10} color="red.400" mb={4} />
                  <Heading as="h3" size="md" mb={2}>
                    {problem.title}
                  </Heading>
                  <Text color="gray.500" fontSize="sm">
                    {problem.description}
                  </Text>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>
      </Container>
    </Box>
  );
}

// Services Section
function ServicesSection() {
  const services = [
    {
      icon: Calendar,
      title: 'Attendance',
      description: 'Automatic attendance logging with RFID tap',
      color: 'green',
    },
    {
      icon: Library,
      title: 'Library Access',
      description: 'Seamless entry and book checkout',
      color: 'purple',
    },
    {
      icon: UtensilsCrossed,
      title: 'Mess Payments',
      description: 'Cashless dining with UniPay wallet',
      color: 'orange',
    },
    {
      icon: Bus,
      title: 'Transport',
      description: 'Campus shuttle fare deduction',
      color: 'cyan',
    },
    {
      icon: DoorOpen,
      title: 'Building Access',
      description: 'Secure entry to labs and hostels',
      color: 'pink',
    },
    {
      icon: Fingerprint,
      title: 'Identity Verification',
      description: 'Instant student verification',
      color: 'blue',
    },
  ];

  return (
    <Box py={20}>
      <Container maxW="container.xl">
        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <VStack spacing={4} textAlign="center" mb={16}>
            <Text color="blue.400" fontWeight="semibold" letterSpacing="wide">
              THE SOLUTION
            </Text>
            <Heading as="h2" fontSize={{ base: '3xl', md: '4xl' }}>
              One Identity, Multiple Services
            </Heading>
            <Text color="gray.400" maxW="2xl">
              A single UniID card provides access to all campus services. The
              card holds only identity — all intelligence lives on the server.
            </Text>
          </VStack>
        </MotionBox>

        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {services.map((service, index) => (
              <MotionBox key={index} variants={fadeIn}>
                <HStack
                  p={6}
                  bg="rgba(255,255,255,0.03)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.800"
                  spacing={4}
                  _hover={{
                    borderColor: `${service.color}.500`,
                    transform: 'translateX(4px)',
                  }}
                  transition="all 0.3s"
                >
                  <Box
                    p={3}
                    bg={`${service.color}.500`}
                    borderRadius="lg"
                    opacity={0.9}
                  >
                    <Icon as={service.icon} boxSize={6} color="white" />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Heading as="h3" size="sm">
                      {service.title}
                    </Heading>
                    <Text color="gray.500" fontSize="sm">
                      {service.description}
                    </Text>
                  </VStack>
                </HStack>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>
      </Container>
    </Box>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Tap Card',
      description: 'Student taps UniID card on RFID reader',
      icon: CreditCard,
    },
    {
      step: '02',
      title: 'Identity Check',
      description: 'Backend verifies UID against student database',
      icon: Fingerprint,
    },
    {
      step: '03',
      title: 'Policy Engine',
      description: 'System checks permissions and payment requirements',
      icon: Layers,
    },
    {
      step: '04',
      title: 'Action',
      description: 'Service granted, wallet debited if required',
      icon: Zap,
    },
  ];

  return (
    <Box py={20} bg="rgba(255,255,255,0.02)">
      <Container maxW="container.xl">
        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <VStack spacing={4} textAlign="center" mb={16}>
            <Text color="green.400" fontWeight="semibold" letterSpacing="wide">
              HOW IT WORKS
            </Text>
            <Heading as="h2" fontSize={{ base: '3xl', md: '4xl' }}>
              Simple. Secure. Instant.
            </Heading>
            <Text color="gray.400" maxW="2xl">
              Every interaction follows the same secure flow, ensuring
              consistency across all campus services.
            </Text>
          </VStack>
        </MotionBox>

        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={0}>
            {steps.map((step, index) => (
              <MotionBox key={index} variants={fadeIn} position="relative">
                <VStack
                  p={8}
                  spacing={4}
                  textAlign="center"
                  position="relative"
                >
                  {index < steps.length - 1 && (
                    <Box
                      display={{ base: 'none', lg: 'block' }}
                      position="absolute"
                      right="-20px"
                      top="50%"
                      transform="translateY(-50%)"
                      color="gray.600"
                    >
                      <ArrowRight size={24} />
                    </Box>
                  )}
                  <Text
                    fontSize="4xl"
                    fontWeight="bold"
                    color="gray.700"
                    fontFamily="mono"
                  >
                    {step.step}
                  </Text>
                  <Box p={4} bg="blue.500" borderRadius="full" opacity={0.9}>
                    <Icon as={step.icon} boxSize={8} color="white" />
                  </Box>
                  <Heading as="h3" size="md">
                    {step.title}
                  </Heading>
                  <Text color="gray.500" fontSize="sm">
                    {step.description}
                  </Text>
                </VStack>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>
      </Container>
    </Box>
  );
}

// Team Section
function TeamSection() {
  const team = [
    { name: 'Yasharth Singh', role: 'Full Stack Developer', avatar: '' },
    { name: 'Mohammad Ali', role: 'Backend Developer', avatar: '' },
    { name: 'Vaibhav Katariya', role: 'Frontend Developer', avatar: '' },
    { name: 'Saniya Khan', role: 'UI/UX Designer', avatar: '' },
  ];

  return (
    <Box py={20}>
      <Container maxW="container.xl">
        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <VStack spacing={4} textAlign="center" mb={16}>
            <Text color="purple.400" fontWeight="semibold" letterSpacing="wide">
              THE TEAM
            </Text>
            <Heading as="h2" fontSize={{ base: '3xl', md: '4xl' }}>
              Built by Students, for Students
            </Heading>
          </VStack>
        </MotionBox>

        <MotionBox
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8}>
            {team.map((member, index) => (
              <MotionBox key={index} variants={fadeIn}>
                <VStack
                  p={6}
                  bg="rgba(255,255,255,0.03)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.800"
                  _hover={{ borderColor: 'purple.500' }}
                  transition="all 0.3s"
                >
                  <Avatar
                    size="xl"
                    name={member.name}
                    bg="purple.500"
                    color="white"
                    mb={2}
                  />
                  <Heading as="h3" size="sm" textAlign="center">
                    {member.name}
                  </Heading>
                  <Text color="gray.500" fontSize="sm" textAlign="center">
                    {member.role}
                  </Text>
                </VStack>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>
      </Container>
    </Box>
  );
}

// Footer
function Footer() {
  return (
    <Box py={10} borderTop="1px solid" borderColor="gray.800">
      <Container maxW="container.xl">
        <Flex
          justify="space-between"
          align="center"
          flexDir={{ base: 'column', md: 'row' }}
          gap={4}
        >
          <HStack spacing={2}>
            <Icon as={CreditCard} boxSize={6} color="blue.400" />
            <Text fontWeight="bold" fontSize="lg">
              UniID
            </Text>
          </HStack>
          <Text color="gray.500" fontSize="sm">
            © 2026 UniID. Built for the Online Hackathon.
          </Text>
        </Flex>
      </Container>
    </Box>
  );
}

// Main Page Component
export default function Home() {
  return (
    <Box>
      <HeroSection />
      <ProblemSection />
      <ServicesSection />
      <HowItWorksSection />
      <TeamSection />
      <Divider borderColor="gray.800" />
      <Footer />
    </Box>
  );
}
