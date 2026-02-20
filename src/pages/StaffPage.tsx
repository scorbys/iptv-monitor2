"use client";

import { useEffect, useState } from "react";
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
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";

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
    modals.openConfirmModal({
      title: "Delete Staff",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete staff member <b>{name}</b>? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("authToken") || localStorage.getItem("token");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

          const response = await fetch(`${apiUrl}/api/staff/${staffId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Refresh staff list
          fetchStaff();
        } catch (err) {
          console.error("Failed to delete staff:", err);
          setModalError({
            title: "Error",
            message: err instanceof Error ? err.message : "Failed to delete staff"
          });
        }
      },
    });
  };

  // Toggle staff active status
  const handleToggleActive = async (staffId: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "deactivate" : "activate";

    modals.openConfirmModal({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Staff`,
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to <b>{action}</b> staff member <b>{name}</b>?
        </Text>
      ),
      labels: { confirm: action.charAt(0).toUpperCase() + action.slice(1), cancel: "Cancel" },
      confirmProps: { color: currentStatus ? "orange" : "green" },
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("authToken") || localStorage.getItem("token");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

          const response = await fetch(`${apiUrl}/api/staff/${staffId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isActive: !currentStatus }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Refresh staff list
          fetchStaff();
        } catch (err) {
          console.error("Failed to toggle staff status:", err);
          setModalError({
            title: "Error",
            message: err instanceof Error ? err.message : "Failed to update staff"
          });
        }
      },
    });
  };

  // Filter staff
  const filteredStaff = staff.filter((member) => {
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

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / staffPerPage);
  const startIndex = (currentPage - 1) * staffPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + staffPerPage);

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "IT Support":
        return "blue";
      case "Network":
        return "cyan";
      case "Engineering":
        return "grape";
      case "Operations":
        return "orange";
      default:
        return "gray";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "red";
      case "Supervisor":
        return "orange";
      case "Technician":
        return "blue";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <Stack gap="lg">
        <LoadingOverlay visible={loading} />
        <Text>Loading staff...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap="xs">
          <Title order={2}>Staff Management</Title>
          <Text size="sm" c="dimmed">
            Manage staff members and their assignments
          </Text>
        </Stack>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={fetchStaff}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              modals.open({
                title: "Add New Staff",
                children: (
                  <Text size="sm">
                    Staff creation feature coming soon. For now, staff is created automatically when a user logs in.
                  </Text>
                ),
              });
            }}
          >
            Add Staff
          </Button>
        </Group>
      </Group>

      {/* Error */}
      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Group>
        <TextInput
          placeholder="Search by name, email, or phone..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filter by department"
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
        />
        <Select
          placeholder="Filter by status"
          data={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as string | null)}
          style={{ width: 130 }}
          clearable
        />
      </Group>

      {/* Staff Table */}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Stats</Table.Th>
            <Table.Th ta="right">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedStaff.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={9} ta="center">
                <Text c="dimmed" py="xl">
                  No staff found
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            paginatedStaff.map((member) => (
              <Table.Tr key={member._id}>
                <Table.Td>
                  <Group gap="xs">
                    {member.avatar && (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        style={{ width: 32, height: 32, borderRadius: "50%" }}
                      />
                    )}
                    <Stack gap={0}>
                      <Text fw={500} size="sm">{member.name}</Text>
                      <Text size="xs" c="dimmed">ID: {member._id.slice(-6)}</Text>
                    </Stack>
                  </Group>
                </Table.Td>
                <Table.Td>{member.email}</Table.Td>
                <Table.Td>{member.phone || "-"}</Table.Td>
                <Table.Td>
                  <Badge color={getDepartmentColor(member.department)} variant="light">
                    {member.department}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={getRoleColor(member.role)} variant="light">
                    {member.role}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={member.isActive ? "green" : "gray"}
                    variant="light"
                    leftSection={member.isActive ? <IconCheck size={12} /> : <IconX size={12} />}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="xs">
                      Assigned: <b>{member.stats.totalAssigned}</b>
                    </Text>
                    <Text size="xs">
                      Resolved: <b>{member.stats.totalResolved}</b>
                    </Text>
                    <Text size="xs">
                      Success: <b>{member.stats.successRate.toFixed(0)}%</b>
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td ta="right">
                  <Group gap="xs" justify="right">
                    <ActionIcon
                      color={member.isActive ? "orange" : "green"}
                      variant="light"
                      onClick={() => handleToggleActive(member._id, member.isActive, member.name)}
                      title={member.isActive ? "Deactivate" : "Activate"}
                    >
                      <IconRefresh size={16} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleDeleteStaff(member._id, member.name)}
                      title="Delete"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Group>
      )}

      {/* Stats */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Showing {paginatedStaff.length} of {filteredStaff.length} staff
        </Text>
        <Text size="sm" c="dimmed">
          Total: {staff.length} staff members
        </Text>
      </Group>

      {/* Error Modal */}
      <Modal
        opened={modalError !== null}
        onClose={() => setModalError(null)}
        title={modalError?.title || "Error"}
        centered
      >
        {modalError && (
          <Stack gap="xs">
            <Group gap="xs">
              <IconAlertTriangle size={20} color="red" />
              <Text c="red">{modalError.message}</Text>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
