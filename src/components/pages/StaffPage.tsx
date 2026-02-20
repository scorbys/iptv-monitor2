"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Title,
  Text,
  Table,
  ActionIcon,
  Button,
  Select,
  TextInput,
  Group,
  Stack,
  Badge,
  Pagination,
  LoadingOverlay,
  Alert,
  Modal,
  Card,
  Avatar,
  Center,
  Loader,
  Progress,
  ThemeIcon,
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconUsers,
  IconBuilding,
  IconIdBadge,
  IconBriefcase,
  IconActivity,
  IconToggleLeft,
  IconShield,
  IconMail,
  IconPhone,
  IconCalendar,
} from "@tabler/icons-react";

interface Staff {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  isActive: boolean;
  avatar: string | null;
  stats: {
    totalAssigned: number;
    totalResolved: number;
    avgResolutionTime: number;
    successRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface StaffPageProps {
  user: any;
}

export default function StaffPage({ user }: StaffPageProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>("all");
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalError, setModalError] = useState<{ title: string; message: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; staffId: string; name: string } | null>(null);
  const [toggleModal, setToggleModal] = useState<{ open: boolean; staffId: string; name: string; currentStatus: boolean } | null>(null);
  const [createModal, setCreateModal] = useState<{ open: boolean } | null>(null);
  const [createStaffForm, setCreateStaffForm] = useState({ name: "", email: "", phone: "", department: "", position: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const staffPerPage = 10;

  // Fetch staff from backend
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/staff`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStaff(data.staff || []);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Delete staff
  const handleDeleteStaff = async (staffId: string, name: string) => {
    setDeleteModal({ open: true, staffId, name });
  };

  const confirmDeleteStaff = async () => {
    if (!deleteModal) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/staff/${deleteModal.staffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setDeleteModal(null);
      fetchStaff();
    } catch (err) {
      console.error("Failed to delete staff:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to delete staff"
      });
      setDeleteModal(null);
    }
  };

  // Toggle staff active status
  const handleToggleActive = async (staffId: string, currentStatus: boolean, name: string) => {
    setToggleModal({ open: true, staffId, name, currentStatus });
  };

  const confirmToggleActive = async () => {
    if (!toggleModal) return;

    const action = toggleModal.currentStatus ? "deactivate" : "activate";

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/staff/${toggleModal.staffId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !toggleModal.currentStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setToggleModal(null);
      fetchStaff();
    } catch (err) {
      console.error("Failed to toggle staff status:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to update staff"
      });
      setToggleModal(null);
    }
  };

  // Create staff
  const handleCreateStaff = async () => {
    if (!createStaffForm.name || !createStaffForm.email) {
      setModalError({
        title: "Validation Error",
        message: "Name and email are required"
      });
      return;
    }

    try {
      setCreateLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createStaffForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setCreateModal(null);
      setCreateStaffForm({ name: "", email: "", phone: "", department: "", position: "" });
      fetchStaff();
    } catch (err) {
      console.error("Failed to create staff:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to create staff"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        searchQuery === "" ||
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery);

      const matchesDepartment = departmentFilter === "all" || member.department === departmentFilter;
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && member.isActive) ||
        (statusFilter === "inactive" && !member.isActive);

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [staff, searchQuery, departmentFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / staffPerPage);
  const startIndex = (currentPage - 1) * staffPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + staffPerPage);

  // Stats
  const stats = useMemo(() => {
    return {
      total: staff.length,
      active: staff.filter(s => s.isActive).length,
      inactive: staff.filter(s => !s.isActive).length,
      itSupport: staff.filter(s => s.department === "IT Support").length,
      network: staff.filter(s => s.department === "Network").length,
      engineering: staff.filter(s => s.department === "Engineering").length,
      operations: staff.filter(s => s.department === "Operations").length,
    };
  }, [staff]);

  // Get department badge color
  const getDepartmentConfig = (department: string) => {
    const config = {
      "IT Support": {
        color: "blue",
        icon: IconBuilding,
        bg: "bg-blue-50",
        text: "text-blue-700"
      },
      "Network": {
        color: "cyan",
        icon: IconIdBadge,
        bg: "bg-cyan-50",
        text: "text-cyan-700"
      },
      "Engineering": {
        color: "grape",
        icon: IconBriefcase,
        bg: "bg-grape-50",
        text: "text-grape-700"
      },
      "Operations": {
        color: "orange",
        icon: IconActivity,
        bg: "bg-orange-50",
        text: "text-orange-700"
      },
    };
    return config[department as keyof typeof config] || {
      color: "gray",
      icon: IconIdBadge,
      bg: "bg-gray-50",
      text: "text-gray-700"
    };
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    const config = {
      "Admin": { color: "red", label: "Admin" },
      "Supervisor": { color: "orange", label: "Supervisor" },
      "Technician": { color: "blue", label: "Technician" },
    };
    return config[role as keyof typeof config] || { color: "gray", label: role };
  };

  if (loading) {
    return (
      <Stack gap="lg" h="100%">
        <LoadingOverlay visible={loading} />
        <Stack align="center">
          <Loader size="lg" color="blue" />
          <Text size="lg" fw={500}>Loading staff...</Text>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header Section */}
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Stack gap={0}>
            <Group gap="sm">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <IconUsers size={24} color="white" />
              </div>
              <Title order={2}>Staff Management</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Manage staff members, assignments, and performance
            </Text>
          </Stack>
          <Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              onClick={fetchStaff}
              size="lg"
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateModal({ open: true })}
              size="lg"
              gradient={{ from: "purple", to: "pink" }}
            >
              Add Staff
            </Button>
          </Group>
        </Group>
      </Stack>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-purple-700">{stats.total}</div>
            <div className="text-sm font-medium text-purple-600">Total</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-green-700">{stats.active}</div>
            <div className="text-sm font-medium text-green-600">Active</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-gray-700">{stats.inactive}</div>
            <div className="text-sm font-medium text-gray-600">Inactive</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-blue-700">{stats.itSupport}</div>
            <div className="text-sm font-medium text-blue-600">IT</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-cyan-700">{stats.network}</div>
            <div className="text-sm font-medium text-cyan-600">Network</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-grape-50 to-grape-100 border-grape-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-grape-700">{stats.engineering}</div>
            <div className="text-sm font-medium text-grape-600">Eng</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-orange-700">{stats.operations}</div>
            <div className="text-sm font-medium text-orange-600">Ops</div>
          </Stack>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="red" title="Error" icon={<IconAlertTriangle size={20} />}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md">
        <Group>
          <TextInput
            placeholder="Search by name, email, or phone..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
            size="lg"
            radius="md"
          />
          <Select
            placeholder="Department"
            data={[
              { value: "all", label: "All Departments" },
              { value: "IT Support", label: "IT Support" },
              { value: "Network", label: "Network" },
              { value: "Engineering", label: "Engineering" },
              { value: "Operations", label: "Operations" },
            ]}
            value={departmentFilter}
            onChange={(value) => setDepartmentFilter(value as string | null)}
            style={{ width: 150 }}
            clearable
            size="lg"
            radius="md"
            leftSection={<IconBuilding size={16} />}
          />
          <Select
            placeholder="Status"
            data={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as string | null)}
            style={{ width: 130 }}
            clearable
            size="lg"
            radius="md"
            leftSection={<IconToggleLeft size={16} />}
          />
        </Group>
      </Card>

      {/* Staff Table */}
      <Card shadow="sm" padding={0} radius="md">
        <Table striped highlightOnHover>
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th fw={600}>Staff Member</Table.Th>
              <Table.Th fw={600}>Contact</Table.Th>
              <Table.Th fw={600}>Department</Table.Th>
              <Table.Th fw={600}>Role</Table.Th>
              <Table.Th fw={600}>Status</Table.Th>
              <Table.Th fw={600}>Performance</Table.Th>
              <Table.Th fw={600} ta="right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedStaff.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Stack gap="sm" py="xl" align="center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <IconSearch size={32} className="text-gray-400" />
                    </div>
                    <Text size="lg" fw={500} c="dimmed">No staff found</Text>
                    <Text size="sm" c="dimmed">Try adjusting your search or filters</Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedStaff.map((member) => {
                const deptConfig = getDepartmentConfig(member.department);
                const DeptIcon = deptConfig.icon;
                const roleBadge = getRoleBadge(member.role);

                return (
                  <Table.Tr key={member._id} className="hover:bg-purple-50/30 transition-colors">
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar
                          size="md"
                          radius="xl"
                          src={member.avatar || undefined}
                          color={deptConfig.color}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">{member.name}</Text>
                          <Group gap={0}>
                            <Text size="xs" c="dimmed">ID: {member._id.slice(-6)}</Text>
                          </Group>
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Group gap={0}>
                          <IconMail size={14} className="text-gray-500" />
                          <Text size="xs">{member.email}</Text>
                        </Group>
                        {member.phone && (
                          <Group gap={0}>
                            <IconPhone size={14} className="text-gray-500" />
                            <Text size="xs">{member.phone}</Text>
                          </Group>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={deptConfig.color}
                        variant="light"
                        leftSection={<DeptIcon size={12} />}
                        radius="md"
                      >
                        {member.department}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={roleBadge.color}
                        variant="light"
                        radius="md"
                      >
                        {roleBadge.label}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={member.isActive ? "green" : "gray"}
                        variant="light"
                        leftSection={member.isActive ? <IconCheck size={12} /> : <IconX size={12} />}
                        radius="md"
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Group gap={0}>
                          <Text size="xs" c="dimmed">Assigned:</Text>
                          <Text size="xs" fw={600}>{member.stats.totalAssigned}</Text>
                        </Group>
                        <Group gap={0}>
                          <Text size="xs" c="dimmed">Resolved:</Text>
                          <Text size="xs" fw={600}>{member.stats.totalResolved}</Text>
                        </Group>
                        <Group gap={0}>
                          <Text size="xs" c="dimmed">Success:</Text>
                          <Text
                            size="xs"
                            fw={600}
                            c={member.stats.successRate >= 80 ? "green" : member.stats.successRate >= 50 ? "yellow" : "red"}
                          >
                            {member.stats.successRate.toFixed(0)}%
                          </Text>
                        </Group>
                      </Stack>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Group gap="xs" justify="right">
                        <ActionIcon
                          color={member.isActive ? "orange" : "green"}
                          variant="light"
                          onClick={() => handleToggleActive(member._id, member.isActive, member.name)}
                          size="lg"
                          radius="md"
                          title={member.isActive ? "Deactivate" : "Activate"}
                        >
                          <IconRefresh size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleDeleteStaff(member._id, member.name)}
                          size="lg"
                          radius="md"
                          title="Delete"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <Stack p="md">
            <Group justify="center" mt="md">
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={setCurrentPage}
                size="lg"
                radius="md"
              />
            </Group>
            <Text size="sm" c="dimmed" ta="center">
              Showing {startIndex + 1}-{Math.min(startIndex + staffPerPage, filteredStaff.length)} of {filteredStaff.length} staff
            </Text>
          </Stack>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModal?.open || false}
        onClose={() => setDeleteModal(null)}
        title={
          <Group gap="sm">
            <div className="p-2 bg-red-100 rounded-lg">
              <IconAlertTriangle size={24} color="red" />
            </div>
            <Text size="lg" fw={600}>Delete Staff</Text>
          </Group>
        }
        centered
        size="md"
        radius="md"
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <Text size="sm">
              Are you sure you want to delete staff member <b>{deleteModal?.name}</b>?
            </Text>
            <Text size="xs" c="red" fw={500}>
              This action cannot be undone and will permanently remove the staff member from the system.
            </Text>
          </Stack>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => setDeleteModal(null)}
              size="md"
              radius="md"
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmDeleteStaff}
              size="md"
              radius="md"
              leftSection={<IconTrash size={16} />}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Toggle Active Confirmation Modal */}
      <Modal
        opened={toggleModal?.open || false}
        onClose={() => setToggleModal(null)}
        title={
          <Group gap="sm">
            <div className={`p-2 rounded-lg ${toggleModal?.currentStatus ? "bg-orange-100" : "bg-green-100"}`}>
              <IconToggleLeft size={24} color={toggleModal?.currentStatus ? "orange" : "green"} />
            </div>
            <Text size="lg" fw={600}>
              {toggleModal?.currentStatus ? "Deactivate" : "Activate"} Staff
            </Text>
          </Group>
        }
        centered
        size="md"
        radius="md"
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <Text size="sm">
              Are you sure you want to <b>{toggleModal?.currentStatus ? "deactivate" : "activate"}</b> staff member <b>{toggleModal?.name}</b>?
            </Text>
            <Text size="xs" c="dimmed">
              {toggleModal?.currentStatus
                ? "This will prevent the staff member from receiving new assignments."
                : "This will allow the staff member to receive new assignments."
              }
            </Text>
          </Stack>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => setToggleModal(null)}
              size="md"
              radius="md"
            >
              Cancel
            </Button>
            <Button
              color={toggleModal?.currentStatus ? "orange" : "green"}
              onClick={confirmToggleActive}
              size="md"
              radius="md"
              leftSection={<IconToggleLeft size={16} />}
            >
              {toggleModal?.currentStatus ? "Deactivate" : "Activate"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Error Modal */}
      <Modal
        opened={modalError !== null}
        onClose={() => setModalError(null)}
        title={
          <Group gap="sm">
            <div className="p-2 bg-red-100 rounded-lg">
              <IconAlertTriangle size={24} color="red" />
            </div>
            <Text size="lg" fw={600}>{modalError?.title || "Error"}</Text>
          </Group>
        }
        centered
        size="md"
        radius="md"
      >
        {modalError && (
          <Stack gap="md">
            <Group gap="sm" p="md" className="bg-red-50 rounded-lg">
              <IconAlertTriangle size={24} color="red" />
              <Text c="red" fw={500}>{modalError.message}</Text>
            </Group>
            <Group justify="flex-end">
              <Button
                onClick={() => setModalError(null)}
                size="md"
                radius="md"
              >
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Create Staff Modal */}
      <Modal
        opened={createModal?.open || false}
        onClose={() => {
          setCreateModal(null);
          setCreateStaffForm({ name: "", email: "", phone: "", department: "", position: "" });
        }}
        title={
          <Group gap="sm">
            <div className="p-2 bg-purple-100 rounded-lg">
              <IconUsers size={24} color="purple" />
            </div>
            <Text size="lg" fw={600}>Create New Staff</Text>
          </Group>
        }
        centered
        size="md"
        radius="md"
      >
        <Stack gap="lg">
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Enter full name"
              value={createStaffForm.name}
              onChange={(e) => setCreateStaffForm({ ...createStaffForm, name: e.currentTarget.value })}
              required
              size="md"
              radius="md"
              leftSection={<IconUsers size={16} />}
            />
            <TextInput
              label="Email"
              type="email"
              placeholder="staff@example.com"
              value={createStaffForm.email}
              onChange={(e) => setCreateStaffForm({ ...createStaffForm, email: e.currentTarget.value })}
              required
              size="md"
              radius="md"
              leftSection={<IconMail size={16} />}
            />
            <TextInput
              label="Phone"
              placeholder="+1234567890"
              value={createStaffForm.phone}
              onChange={(e) => setCreateStaffForm({ ...createStaffForm, phone: e.currentTarget.value })}
              size="md"
              radius="md"
              leftSection={<IconPhone size={16} />}
            />
            <Select
              label="Department"
              placeholder="Select department"
              data={[
                { value: "IT Support", label: "IT Support" },
                { value: "Network", label: "Network" },
                { value: "Engineering", label: "Engineering" },
                { value: "Operations", label: "Operations" },
              ]}
              value={createStaffForm.department}
              onChange={(value) => setCreateStaffForm({ ...createStaffForm, department: value || "" })}
              size="md"
              radius="md"
              leftSection={<IconBuilding size={16} />}
            />
            <Select
              label="Position"
              placeholder="Select position"
              data={[
                { value: "Admin", label: "Admin" },
                { value: "Supervisor", label: "Supervisor" },
                { value: "Technician", label: "Technician" },
              ]}
              value={createStaffForm.position}
              onChange={(value) => setCreateStaffForm({ ...createStaffForm, position: value || "" })}
              size="md"
              radius="md"
              leftSection={<IconBriefcase size={16} />}
            />
          </Stack>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => {
                setCreateModal(null);
                setCreateStaffForm({ name: "", email: "", phone: "", department: "", position: "" });
              }}
              size="md"
              radius="md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStaff}
              loading={createLoading}
              size="md"
              radius="md"
              gradient={{ from: "purple", to: "pink" }}
              leftSection={<IconPlus size={16} />}
            >
              Create Staff
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
