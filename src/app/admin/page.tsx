'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Icon,
  Flex,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Select,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  Users,
  Wallet,
  Receipt,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  TrendingUp,
  Clock,
  Calendar,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

const MotionBox = motion(Box);

interface Student {
  id: number;
  name: string;
  roll_no: string;
  rfid_uid: string;
  wallet_balance: number;
  status: string;
  branch?: string;
  section?: string;
  program?: string;
  year?: number;
  last_attendance?: string;
}

interface Transaction {
  id: number;
  student_id: number;
  student_name: string;
  service_type: string;
  amount: number;
  timestamp: string;
}

interface Policy {
  service_type: string;
  cost: number;
  requires_payment: boolean;
}

interface Attendance {
  id: number;
  student_id: number;
  student_name: string;
  rfid_uid: string;
  branch: string;
  section: string;
  program: string;
  year: number;
  date: string;
  timestamp: string;
  service_context: string;
}

const API_BASE = '/api';

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Attendance filters
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterYear, setFilterYear] = useState('');
  
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build attendance URL with filters
      let attendanceUrl = `${API_BASE}/attendance`;
      const params = new URLSearchParams();
      if (filterBranch) params.append('branch', filterBranch);
      if (filterSection) params.append('section', filterSection);
      if (filterProgram) params.append('program', filterProgram);
      if (filterYear) params.append('year', filterYear);
      if (params.toString()) attendanceUrl += `?${params.toString()}`;

      const [studentsRes, transactionsRes, policiesRes, attendanceRes] = await Promise.all([
        fetch(`${API_BASE}/students`),
        fetch(`${API_BASE}/transactions`),
        fetch(`${API_BASE}/policies`),
        fetch(attendanceUrl),
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      }

      if (policiesRes.ok) {
        const policiesData = await policiesRes.json();
        setPolicies(policiesData);
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to connect to backend. Using demo data.');
      
      // Fallback demo data
      setStudents([
        { id: 1, name: 'Yasharth Singh', roll_no: 'ROLL001', rfid_uid: 'RFID_001', wallet_balance: 500, status: 'active', branch: 'CSE', section: 'F3', program: 'B.Tech', year: 3 },
        { id: 2, name: 'Mohammad Ali', roll_no: 'ROLL002', rfid_uid: 'RFID_002', wallet_balance: 300, status: 'active', branch: 'CSE', section: 'F5', program: 'B.Tech', year: 2 },
        { id: 3, name: 'Vaibhav Katariya', roll_no: 'ROLL003', rfid_uid: 'RFID_003', wallet_balance: 200, status: 'active', branch: 'ECS', section: 'E15', program: 'B.Tech', year: 3 },
        { id: 4, name: 'Saniya Khan', roll_no: 'ROLL004', rfid_uid: 'RFID_004', wallet_balance: 400, status: 'active', branch: 'CSE', section: 'F1', program: 'B.Sc', year: 1 },
      ]);
      
      setPolicies([
        { service_type: 'attendance', cost: 0, requires_payment: false },
        { service_type: 'library', cost: 0, requires_payment: false },
        { service_type: 'mess', cost: 50, requires_payment: true },
        { service_type: 'transport', cost: 20, requires_payment: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [filterBranch, filterSection, filterProgram, filterYear]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast({
      title: 'Data Refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
        toast({
          title: 'Demo Reset',
          description: 'All data has been reset to initial state.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch {
      toast({
        title: 'Reset Failed',
        description: 'Could not connect to backend.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Calculate stats
  const totalBalance = students.reduce((sum, s) => sum + Number(s.wallet_balance), 0);
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalAttendance = attendance.length;

  // Reset filters
  const resetFilters = () => {
    setFilterBranch('');
    setFilterSection('');
    setFilterProgram('');
    setFilterYear('');
  };

  return (
    <Box minH="100vh" bg="#0a0a0a">
      {/* Header */}
      <Box borderBottom="1px solid" borderColor="gray.800" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Link href="/">
              <HStack spacing={2} _hover={{ opacity: 0.8 }} transition="all 0.2s">
                <Icon as={ArrowLeft} boxSize={5} />
                <Text>Back to Home</Text>
              </HStack>
            </Link>
            <HStack spacing={4}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
                onClick={handleRefresh}
                isLoading={isRefreshing}
              >
                Refresh
              </Button>
              <HStack spacing={2}>
                <Icon as={CreditCard} boxSize={6} color="blue.400" />
                <Text fontWeight="bold" fontSize="lg">
                  UniID Admin
                </Text>
              </HStack>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Page Title */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="xl">Admin Dashboard</Heading>
              <Text color="gray.400">Monitor students, transactions, and system status</Text>
            </VStack>
            <Button colorScheme="red" variant="outline" size="sm" onClick={handleResetDemo}>
              Reset Demo Data
            </Button>
          </HStack>

          {/* Error Alert */}
          {error && (
            <Alert status="warning" borderRadius="lg" bg="orange.900" color="white">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 5 }} spacing={6}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Box
                p={6}
                bg="rgba(255,255,255,0.03)"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.800"
              >
                <Stat>
                  <StatLabel color="gray.400">
                    <HStack>
                      <Icon as={Users} boxSize={4} />
                      <Text>Total Students</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="3xl" color="blue.400">
                    {students.length}
                  </StatNumber>
                  <StatHelpText color="green.400">All active</StatHelpText>
                </Stat>
              </Box>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Box
                p={6}
                bg="rgba(255,255,255,0.03)"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.800"
              >
                <Stat>
                  <StatLabel color="gray.400">
                    <HStack>
                      <Icon as={Calendar} boxSize={4} />
                      <Text>Attendance</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="3xl" color="green.400">
                    {totalAttendance}
                  </StatNumber>
                  <StatHelpText color="gray.500">Records today</StatHelpText>
                </Stat>
              </Box>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Box
                p={6}
                bg="rgba(255,255,255,0.03)"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.800"
              >
                <Stat>
                  <StatLabel color="gray.400">
                    <HStack>
                      <Icon as={Wallet} boxSize={4} />
                      <Text>Total Balance</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="3xl" color="cyan.400">
                    ₹{totalBalance.toFixed(0)}
                  </StatNumber>
                  <StatHelpText color="gray.500">Across all wallets</StatHelpText>
                </Stat>
              </Box>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Box
                p={6}
                bg="rgba(255,255,255,0.03)"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.800"
              >
                <Stat>
                  <StatLabel color="gray.400">
                    <HStack>
                      <Icon as={Receipt} boxSize={4} />
                      <Text>Transactions</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="3xl" color="purple.400">
                    {totalTransactions}
                  </StatNumber>
                  <StatHelpText color="gray.500">Total recorded</StatHelpText>
                </Stat>
              </Box>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Box
                p={6}
                bg="rgba(255,255,255,0.03)"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.800"
              >
                <Stat>
                  <StatLabel color="gray.400">
                    <HStack>
                      <Icon as={TrendingUp} boxSize={4} />
                      <Text>Revenue</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="3xl" color="orange.400">
                    ₹{totalRevenue.toFixed(0)}
                  </StatNumber>
                  <StatHelpText color="gray.500">From transactions</StatHelpText>
                </Stat>
              </Box>
            </MotionBox>
          </SimpleGrid>

          {/* Tabs */}
          {isLoading ? (
            <Flex justify="center" py={20}>
              <Spinner size="xl" color="blue.400" />
            </Flex>
          ) : (
            <Tabs colorScheme="blue" variant="enclosed">
              <TabList borderColor="gray.700">
                <Tab _selected={{ bg: 'blue.900', color: 'white' }}>
                  <HStack>
                    <Icon as={Users} boxSize={4} />
                    <Text>Students</Text>
                  </HStack>
                </Tab>
                <Tab _selected={{ bg: 'green.900', color: 'white' }}>
                  <HStack>
                    <Icon as={Calendar} boxSize={4} />
                    <Text>Attendance</Text>
                  </HStack>
                </Tab>
                <Tab _selected={{ bg: 'blue.900', color: 'white' }}>
                  <HStack>
                    <Icon as={Receipt} boxSize={4} />
                    <Text>Transactions</Text>
                  </HStack>
                </Tab>
                <Tab _selected={{ bg: 'blue.900', color: 'white' }}>
                  <HStack>
                    <Icon as={Clock} boxSize={4} />
                    <Text>Policies</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Students Tab */}
                <TabPanel px={0}>
                  <Box
                    bg="rgba(255,255,255,0.02)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.800"
                    overflow="hidden"
                  >
                    <Table variant="simple">
                      <Thead bg="rgba(255,255,255,0.03)">
                        <Tr>
                          <Th color="gray.400" borderColor="gray.700">ID</Th>
                          <Th color="gray.400" borderColor="gray.700">Name</Th>
                          <Th color="gray.400" borderColor="gray.700">Program</Th>
                          <Th color="gray.400" borderColor="gray.700">Branch</Th>
                          <Th color="gray.400" borderColor="gray.700">Section</Th>
                          <Th color="gray.400" borderColor="gray.700">Year</Th>
                          <Th color="gray.400" borderColor="gray.700">RFID UID</Th>
                          <Th color="gray.400" borderColor="gray.700" isNumeric>Balance</Th>
                          <Th color="gray.400" borderColor="gray.700">Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {students.map((student) => (
                          <Tr key={student.id} _hover={{ bg: 'rgba(255,255,255,0.03)' }}>
                            <Td borderColor="gray.800">{student.id}</Td>
                            <Td borderColor="gray.800" fontWeight="medium">
                              {student.name}
                            </Td>
                            <Td borderColor="gray.800">
                              <Badge colorScheme="purple">{student.program || '-'}</Badge>
                            </Td>
                            <Td borderColor="gray.800">
                              <Badge colorScheme="blue">{student.branch || '-'}</Badge>
                            </Td>
                            <Td borderColor="gray.800" color="gray.400">
                              {student.section || '-'}
                            </Td>
                            <Td borderColor="gray.800" color="gray.400">
                              {student.year ? `Year ${student.year}` : '-'}
                            </Td>
                            <Td borderColor="gray.800" color="gray.400">
                              {student.roll_no}
                            </Td>
                            <Td borderColor="gray.800">
                              <Badge colorScheme="blue" fontFamily="mono">
                                {student.rfid_uid}
                              </Badge>
                            </Td>
                            <Td borderColor="gray.800" isNumeric>
                              <Text
                                color={Number(student.wallet_balance) > 100 ? 'green.400' : 'orange.400'}
                                fontWeight="semibold"
                              >
                                ₹{Number(student.wallet_balance).toFixed(2)}
                              </Text>
                            </Td>
                            <Td borderColor="gray.800">
                              <Badge
                                colorScheme={student.status === 'active' ? 'green' : 'red'}
                              >
                                {student.status}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </TabPanel>

                {/* Attendance Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Filters */}
                    <Box
                      bg="rgba(255,255,255,0.02)"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.800"
                      p={4}
                    >
                      <HStack mb={4}>
                        <Icon as={Filter} boxSize={5} color="green.400" />
                        <Text fontWeight="semibold">Filter Attendance</Text>
                      </HStack>
                      <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                        <Select
                          placeholder="Program"
                          value={filterProgram}
                          onChange={(e) => setFilterProgram(e.target.value)}
                          bg="rgba(255,255,255,0.05)"
                          borderColor="gray.700"
                        >
                          <option value="B.Tech" style={{ background: '#1a1a1a' }}>B.Tech</option>
                          <option value="M.Tech" style={{ background: '#1a1a1a' }}>M.Tech</option>
                          <option value="B.Sc" style={{ background: '#1a1a1a' }}>B.Sc</option>
                          <option value="MCA" style={{ background: '#1a1a1a' }}>MCA</option>
                          <option value="Diploma" style={{ background: '#1a1a1a' }}>Diploma</option>
                        </Select>
                        <Select
                          placeholder="Branch"
                          value={filterBranch}
                          onChange={(e) => setFilterBranch(e.target.value)}
                          bg="rgba(255,255,255,0.05)"
                          borderColor="gray.700"
                        >
                          <option value="CSE" style={{ background: '#1a1a1a' }}>CSE</option>
                          <option value="ECS" style={{ background: '#1a1a1a' }}>ECS</option>
                        </Select>
                        <Select
                          placeholder="Section"
                          value={filterSection}
                          onChange={(e) => setFilterSection(e.target.value)}
                          bg="rgba(255,255,255,0.05)"
                          borderColor="gray.700"
                        >
                          {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'E15', 'E16', 'E17'].map((s) => (
                            <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>
                          ))}
                        </Select>
                        <Select
                          placeholder="Year"
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                          bg="rgba(255,255,255,0.05)"
                          borderColor="gray.700"
                        >
                          <option value="1" style={{ background: '#1a1a1a' }}>1st Year</option>
                          <option value="2" style={{ background: '#1a1a1a' }}>2nd Year</option>
                          <option value="3" style={{ background: '#1a1a1a' }}>3rd Year</option>
                          <option value="4" style={{ background: '#1a1a1a' }}>4th Year</option>
                        </Select>
                        <Button 
                          variant="outline" 
                          colorScheme="gray" 
                          onClick={resetFilters}
                          size="md"
                        >
                          Clear Filters
                        </Button>
                      </SimpleGrid>
                    </Box>

                    {/* Attendance Stats */}
                    <HStack spacing={4}>
                      <Box
                        p={4}
                        bg="rgba(72, 187, 120, 0.1)"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="green.700"
                      >
                        <HStack>
                          <Icon as={Calendar} boxSize={5} color="green.400" />
                          <Text fontWeight="semibold" color="green.400">
                            {attendance.length} Records
                          </Text>
                        </HStack>
                      </Box>
                    </HStack>

                    {/* Attendance Table */}
                    <Box
                      bg="rgba(255,255,255,0.02)"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.800"
                      overflow="hidden"
                    >
                      {attendance.length === 0 ? (
                        <Flex justify="center" py={12}>
                          <VStack spacing={4}>
                            <Icon as={Calendar} boxSize={12} color="gray.600" />
                            <Text color="gray.500">No attendance records yet</Text>
                            <Text color="gray.600" fontSize="sm">
                              Use the simulator with &quot;Attendance&quot; service to mark attendance
                            </Text>
                          </VStack>
                        </Flex>
                      ) : (
                        <Table variant="simple">
                          <Thead bg="rgba(255,255,255,0.03)">
                            <Tr>
                              <Th color="gray.400" borderColor="gray.700">Student Name</Th>
                              <Th color="gray.400" borderColor="gray.700">RFID UID</Th>
                              <Th color="gray.400" borderColor="gray.700">Program</Th>
                              <Th color="gray.400" borderColor="gray.700">Branch</Th>
                              <Th color="gray.400" borderColor="gray.700">Section</Th>
                              <Th color="gray.400" borderColor="gray.700">Year</Th>
                              <Th color="gray.400" borderColor="gray.700">Timestamp</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {attendance.map((record) => (
                              <Tr key={record.id} _hover={{ bg: 'rgba(255,255,255,0.03)' }}>
                                <Td borderColor="gray.800" fontWeight="medium">
                                  {record.student_name}
                                </Td>
                                <Td borderColor="gray.800">
                                  <Badge colorScheme="blue" fontFamily="mono">
                                    {record.rfid_uid}
                                  </Badge>
                                </Td>
                                <Td borderColor="gray.800">
                                  <Badge colorScheme="purple">{record.program}</Badge>
                                </Td>
                                <Td borderColor="gray.800">
                                  <Badge colorScheme="cyan">{record.branch}</Badge>
                                </Td>
                                <Td borderColor="gray.800" color="gray.400">
                                  {record.section}
                                </Td>
                                <Td borderColor="gray.800" color="gray.400">
                                  Year {record.year}
                                </Td>
                                <Td borderColor="gray.800" color="gray.400" fontSize="sm">
                                  {new Date(record.timestamp).toLocaleString()}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Transactions Tab */}
                <TabPanel px={0}>
                  <Box
                    bg="rgba(255,255,255,0.02)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.800"
                    overflow="hidden"
                  >
                    {transactions.length === 0 ? (
                      <Flex justify="center" py={12}>
                        <VStack spacing={4}>
                          <Icon as={Receipt} boxSize={12} color="gray.600" />
                          <Text color="gray.500">No transactions yet</Text>
                          <Text color="gray.600" fontSize="sm">
                            Use the simulator to create transactions
                          </Text>
                        </VStack>
                      </Flex>
                    ) : (
                      <Table variant="simple">
                        <Thead bg="rgba(255,255,255,0.03)">
                          <Tr>
                            <Th color="gray.400" borderColor="gray.700">ID</Th>
                            <Th color="gray.400" borderColor="gray.700">Student</Th>
                            <Th color="gray.400" borderColor="gray.700">Service</Th>
                            <Th color="gray.400" borderColor="gray.700" isNumeric>Amount</Th>
                            <Th color="gray.400" borderColor="gray.700">Timestamp</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {transactions.map((tx) => (
                            <Tr key={tx.id} _hover={{ bg: 'rgba(255,255,255,0.03)' }}>
                              <Td borderColor="gray.800">{tx.id}</Td>
                              <Td borderColor="gray.800" fontWeight="medium">
                                {tx.student_name}
                              </Td>
                              <Td borderColor="gray.800">
                                <Badge
                                  colorScheme={
                                    tx.service_type === 'mess'
                                      ? 'orange'
                                      : tx.service_type === 'transport'
                                      ? 'cyan'
                                      : tx.service_type === 'library'
                                      ? 'purple'
                                      : 'green'
                                  }
                                >
                                  {tx.service_type}
                                </Badge>
                              </Td>
                              <Td borderColor="gray.800" isNumeric>
                                <Text
                                  color={Number(tx.amount) > 0 ? 'orange.400' : 'gray.500'}
                                  fontWeight="semibold"
                                >
                                  {Number(tx.amount) > 0 ? `-₹${tx.amount}` : 'Free'}
                                </Text>
                              </Td>
                              <Td borderColor="gray.800" color="gray.400" fontSize="sm">
                                {new Date(tx.timestamp).toLocaleString()}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </Box>
                </TabPanel>

                {/* Policies Tab */}
                <TabPanel px={0}>
                  <Box
                    bg="rgba(255,255,255,0.02)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.800"
                    overflow="hidden"
                  >
                    <Table variant="simple">
                      <Thead bg="rgba(255,255,255,0.03)">
                        <Tr>
                          <Th color="gray.400" borderColor="gray.700">Service</Th>
                          <Th color="gray.400" borderColor="gray.700" isNumeric>Cost</Th>
                          <Th color="gray.400" borderColor="gray.700">Payment Required</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {policies.map((policy) => (
                          <Tr key={policy.service_type} _hover={{ bg: 'rgba(255,255,255,0.03)' }}>
                            <Td borderColor="gray.800">
                              <Badge
                                colorScheme={
                                  policy.service_type === 'mess'
                                    ? 'orange'
                                    : policy.service_type === 'transport'
                                    ? 'cyan'
                                    : policy.service_type === 'library'
                                    ? 'purple'
                                    : 'green'
                                }
                                px={3}
                                py={1}
                                fontSize="sm"
                              >
                                {policy.service_type.charAt(0).toUpperCase() +
                                  policy.service_type.slice(1)}
                              </Badge>
                            </Td>
                            <Td borderColor="gray.800" isNumeric>
                              <Text fontWeight="semibold">
                                {Number(policy.cost) > 0 ? `₹${policy.cost}` : 'Free'}
                              </Text>
                            </Td>
                            <Td borderColor="gray.800">
                              <Badge colorScheme={policy.requires_payment ? 'red' : 'green'}>
                                {policy.requires_payment ? 'Yes' : 'No'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}

          {/* Footer Info */}
          <Box
            p={4}
            bg="rgba(255,255,255,0.02)"
            borderRadius="lg"
            textAlign="center"
          >
            <Text color="gray.500" fontSize="sm">
              Dashboard auto-refreshes every 5 seconds • Last updated:{' '}
              {new Date().toLocaleTimeString()}
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
