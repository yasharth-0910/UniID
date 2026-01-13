'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Select,
  Button,
  useToast,
  Badge,
  Divider,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Wifi,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  UtensilsCrossed,
  Calendar,
  Library,
  Bus,
} from 'lucide-react';
import Link from 'next/link';

const MotionBox = motion(Box);

// Demo student data
const students = [
  { id: 1, name: 'Yasharth Singh', rfid_uid: 'RFID_001', balance: 500 },
  { id: 2, name: 'Mohammad Ali', rfid_uid: 'RFID_002', balance: 300 },
  { id: 3, name: 'Vaibhav Katariya', rfid_uid: 'RFID_003', balance: 200 },
  { id: 4, name: 'Saniya Khan', rfid_uid: 'RFID_004', balance: 400 },
];

// Service types
const services = [
  { id: 'attendance', name: 'Attendance', icon: Calendar, color: 'green' },
  { id: 'library', name: 'Library', icon: Library, color: 'purple' },
  { id: 'mess', name: 'Mess', icon: UtensilsCrossed, color: 'orange' },
  { id: 'transport', name: 'Transport', icon: Bus, color: 'cyan' },
];

interface TapResponse {
  success: boolean;
  student: string;
  service: string;
  action: string;
  balance_remaining: number;
  amount_deducted?: number;
}

export default function SimulatorPage() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tapResult, setTapResult] = useState<TapResponse | null>(null);
  const [isTapping, setIsTapping] = useState(false);
  const toast = useToast();

  const handleTap = async () => {
    if (!selectedStudent || !selectedService) {
      toast({
        title: 'Selection Required',
        description: 'Please select a student and service type.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const student = students.find((s) => s.rfid_uid === selectedStudent);
    if (!student) return;

    // Start tap animation
    setIsTapping(true);
    setIsLoading(true);
    setTapResult(null);

    // Show UID detected toast
    setTimeout(() => {
      toast({
        title: 'UID Detected',
        description: `RFID: ${selectedStudent}`,
        status: 'info',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
    }, 500);

    try {
      // Call the backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/tap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rfid_uid: selectedStudent,
          service: selectedService,
        }),
      });

      const data = await response.json();

      // Simulate additional processing time for UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTapResult(data);

      toast({
        title: data.success ? 'Success' : 'Failed',
        description: data.action,
        status: data.success ? 'success' : 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } catch {
      // Fallback to mock response if backend is not running
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const service = services.find((s) => s.id === selectedService);
      const mockCosts: Record<string, number> = {
        attendance: 0,
        library: 0,
        mess: 50,
        transport: 20,
      };
      const cost = mockCosts[selectedService] || 0;
      const currentBalance = student.balance;
      const canAfford = currentBalance >= cost;

      const mockResponse: TapResponse = {
        success: canAfford || cost === 0,
        student: student.name,
        service: service?.name || selectedService,
        action: canAfford || cost === 0
          ? cost > 0
            ? 'Payment Approved'
            : 'Access Granted'
          : 'Insufficient Balance',
        balance_remaining: canAfford ? currentBalance - cost : currentBalance,
        amount_deducted: canAfford && cost > 0 ? cost : undefined,
      };

      setTapResult(mockResponse);

      toast({
        title: mockResponse.success ? 'Success' : 'Failed',
        description: mockResponse.action,
        status: mockResponse.success ? 'success' : 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsTapping(false), 500);
    }
  };

  return (
    <Box minH="100vh" bg="#0a0a0a">
      {/* Header */}
      <Box borderBottom="1px solid" borderColor="gray.800" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Link href="/">
              <HStack
                spacing={2}
                _hover={{ opacity: 0.8 }}
                transition="all 0.2s"
              >
                <Icon as={ArrowLeft} boxSize={5} />
                <Text>Back to Home</Text>
              </HStack>
            </Link>
            <HStack spacing={2}>
              <Icon as={CreditCard} boxSize={6} color="blue.400" />
              <Text fontWeight="bold" fontSize="lg">
                UniID
              </Text>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.lg" py={12}>
        <VStack spacing={10}>
          {/* Page Title */}
          <VStack spacing={4} textAlign="center">
            <Badge colorScheme="blue" px={4} py={2} borderRadius="full">
              Simulation Mode
            </Badge>
            <Heading as="h1" size="2xl">
              RFID Tap Simulator
            </Heading>
            <Text color="gray.400" maxW="lg">
              Simulate an RFID card tap to test the UniID system. Select a
              student and service, then tap the card.
            </Text>
          </VStack>

          {/* Main Card */}
          <Box
            w="full"
            maxW="600px"
            bg="rgba(255,255,255,0.03)"
            borderRadius="2xl"
            border="1px solid"
            borderColor="gray.800"
            p={8}
          >
            <VStack spacing={6}>
              {/* Student Selection */}
              <Box w="full">
                <Text mb={2} fontWeight="semibold">
                  Select Student
                </Text>
                <Select
                  placeholder="Choose a student..."
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  bg="rgba(255,255,255,0.05)"
                  borderColor="gray.700"
                  _hover={{ borderColor: 'blue.500' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
                >
                  {students.map((student) => (
                    <option
                      key={student.id}
                      value={student.rfid_uid}
                      style={{ background: '#1a1a1a' }}
                    >
                      {student.name} — {student.rfid_uid} — ₹{student.balance}
                    </option>
                  ))}
                </Select>
              </Box>

              {/* Service Selection */}
              <Box w="full">
                <Text mb={2} fontWeight="semibold">
                  Select Service
                </Text>
                <Select
                  placeholder="Choose a service..."
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  bg="rgba(255,255,255,0.05)"
                  borderColor="gray.700"
                  _hover={{ borderColor: 'blue.500' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
                >
                  {services.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                      style={{ background: '#1a1a1a' }}
                    >
                      {service.name}
                    </option>
                  ))}
                </Select>
              </Box>

              <Divider borderColor="gray.700" />

              {/* Tap Animation Area */}
              <Box w="full" position="relative" h="200px">
                <AnimatePresence mode="wait">
                  {!isTapping ? (
                    <MotionBox
                      key="idle"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      position="absolute"
                      w="full"
                      h="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <VStack spacing={4}>
                        <Box
                          p={6}
                          borderRadius="full"
                          bg="rgba(0, 115, 230, 0.1)"
                          border="2px dashed"
                          borderColor="blue.500"
                        >
                          <Icon as={Wifi} boxSize={12} color="blue.400" />
                        </Box>
                        <Text color="gray.500">
                          Ready to simulate card tap
                        </Text>
                      </VStack>
                    </MotionBox>
                  ) : (
                    <MotionBox
                      key="tapping"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      position="absolute"
                      w="full"
                      h="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <VStack spacing={4}>
                        <MotionBox
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <Box
                            p={6}
                            borderRadius="full"
                            bg="rgba(0, 230, 115, 0.2)"
                            border="2px solid"
                            borderColor="green.400"
                          >
                            {isLoading ? (
                              <Icon
                                as={Loader2}
                                boxSize={12}
                                color="green.400"
                                className="animate-spin"
                              />
                            ) : tapResult?.success ? (
                              <Icon
                                as={CheckCircle}
                                boxSize={12}
                                color="green.400"
                              />
                            ) : (
                              <Icon as={XCircle} boxSize={12} color="red.400" />
                            )}
                          </Box>
                        </MotionBox>
                        <Text color="gray.400">
                          {isLoading
                            ? 'Processing...'
                            : tapResult?.success
                            ? 'Success!'
                            : 'Failed'}
                        </Text>
                      </VStack>
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>

              {/* Tap Button */}
              <Button
                size="lg"
                w="full"
                colorScheme="blue"
                leftIcon={<CreditCard />}
                onClick={handleTap}
                isLoading={isLoading}
                loadingText="Processing..."
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                Simulate RFID Tap
              </Button>
            </VStack>
          </Box>

          {/* Result Display */}
          <AnimatePresence>
            {tapResult && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                w="full"
                maxW="600px"
              >
                <Box
                  bg={
                    tapResult.success
                      ? 'rgba(72, 187, 120, 0.1)'
                      : 'rgba(245, 101, 101, 0.1)'
                  }
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={tapResult.success ? 'green.500' : 'red.500'}
                  p={6}
                >
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <HStack>
                        <Icon
                          as={tapResult.success ? CheckCircle : XCircle}
                          color={tapResult.success ? 'green.400' : 'red.400'}
                          boxSize={6}
                        />
                        <Text fontWeight="bold" fontSize="lg">
                          {tapResult.action}
                        </Text>
                      </HStack>
                      <Badge
                        colorScheme={tapResult.success ? 'green' : 'red'}
                        px={3}
                        py={1}
                      >
                        {tapResult.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    </HStack>

                    <Divider borderColor="gray.700" />

                    <SimpleResultRow label="Student" value={tapResult.student} />
                    <SimpleResultRow label="Service" value={tapResult.service} />
                    {tapResult.amount_deducted && (
                      <SimpleResultRow
                        label="Amount Deducted"
                        value={`₹${tapResult.amount_deducted}`}
                      />
                    )}
                    <SimpleResultRow
                      label="Balance Remaining"
                      value={`₹${tapResult.balance_remaining}`}
                      highlight
                    />
                  </VStack>
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Service Legend */}
          <Box
            w="full"
            maxW="600px"
            bg="rgba(255,255,255,0.02)"
            borderRadius="xl"
            p={6}
          >
            <Text fontWeight="semibold" mb={4}>
              Service Costs
            </Text>
            <HStack justify="space-between" flexWrap="wrap" gap={4}>
              <ServiceBadge name="Attendance" cost="Free" color="green" />
              <ServiceBadge name="Library" cost="Free" color="purple" />
              <ServiceBadge name="Mess" cost="₹50" color="orange" />
              <ServiceBadge name="Transport" cost="₹20" color="cyan" />
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

function SimpleResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <HStack justify="space-between">
      <Text color="gray.400">{label}</Text>
      <Text fontWeight={highlight ? 'bold' : 'normal'} color={highlight ? 'blue.300' : 'white'}>
        {value}
      </Text>
    </HStack>
  );
}

function ServiceBadge({
  name,
  cost,
  color,
}: {
  name: string;
  cost: string;
  color: string;
}) {
  return (
    <HStack
      bg={`${color}.900`}
      px={3}
      py={2}
      borderRadius="lg"
      border="1px solid"
      borderColor={`${color}.700`}
    >
      <Text fontSize="sm" color={`${color}.200`}>
        {name}:
      </Text>
      <Text fontSize="sm" fontWeight="bold" color={`${color}.300`}>
        {cost}
      </Text>
    </HStack>
  );
}
