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
  IconAlertTriangle,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";

interface User {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  provider: string;
  googleId?: string;
  createdAt: string;
}

interface UsersPageProps {
  user: any;
}

export default function UsersPage({ user }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalError, setModalError] = useState<{ title: string; message: string } | null>(null);
  const usersPerPage = 10;

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user
  const handleDeleteUser = async (userId: string, username: string) => {
    modals.openConfirmModal({
      title: "Delete User",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete user <b>{username}</b>? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("authToken") || localStorage.getItem("token");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

          const response = await fetch(`${apiUrl}/api/users/${userId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Refresh users list
          fetchUsers();
        } catch (err) {
          console.error("Failed to delete user:", err);
          setModalError({
            title: "Error",
            message: err instanceof Error ? err.message : "Failed to delete user"
          });
        }
      },
    });
  };

  // Change user role
  const handleChangeRole = async (userId: string, newRole: string, username: string) => {
    modals.openConfirmModal({
      title: "Change User Role",
      centered: true,
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Change role for user <b>{username}</b> to <b>{newRole}</b>?
          </Text>
          <Text size="xs" color="dimmed">
            This will affect the user's permissions immediately.
          </Text>
        </Stack>
      ),
      labels: { confirm: "Change", cancel: "Cancel" },
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("authToken") || localStorage.getItem("token");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

          const response = await fetch(`${apiUrl}/api/users/${userId}/role`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: newRole }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Refresh users list
          fetchUsers();
        } catch (err) {
          console.error("Failed to change role:", err);
          setModalError({
            title: "Error",
            message: err instanceof Error ? err.message : "Failed to change role"
          });
        }
      },
    });
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  if (loading) {
    return (
      <Stack gap="lg">
        <LoadingOverlay visible={loading} />
        <Text>Loading users...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap="xs">
          <Title order={2}>User Management</Title>
          <Text size="sm" c="dimmed">
            Manage user accounts and permissions
          </Text>
        </Stack>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => window.location.href = "/register"}
          >
            Add User
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
          placeholder="Search by username or email..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filter by role"
          data={[
            { value: "all", label: "All Roles" },
            { value: "admin", label: "Admin" },
            { value: "guest", label: "Guest" },
            { value: "user", label: "User" },
          ]}
          value={roleFilter}
          onChange={(value) => setRoleFilter(value as string | null)}
          style={{ width: 150 }}
          clearable
        />
      </Group>

      {/* Users Table */}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Username</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Provider</Table.Th>
            <Table.Th>Created At</Table.Th>
            <Table.Th ta="right">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedUsers.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6} ta="center">
                <Text c="dimmed" py="xl">
                  No users found
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            paginatedUsers.map((userData) => (
              <Table.Tr key={userData._id}>
                <Table.Td>
                  <Text fw={500}>{userData.username}</Text>
                </Table.Td>
                <Table.Td>{userData.email}</Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    data={[
                      { value: "admin", label: "Admin" },
                      { value: "guest", label: "Guest" },
                      { value: "user", label: "User" },
                    ]}
                    value={userData.role}
                    onChange={(value) => {
                      if (value && value !== userData.role) {
                        handleChangeRole(userData._id, value, userData.username);
                      }
                    }}
                    styles={{
                      input: {
                        fontWeight: 500,
                      },
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    leftSection={userData.provider === "google" ? "🔷" : "📧"}
                  >
                    {userData.provider}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => handleDeleteUser(userData._id, userData.username)}
                    disabled={userData._id === user?._id}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
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
          Showing {paginatedUsers.length} of {filteredUsers.length} users
        </Text>
        <Text size="sm" c="dimmed">
          Total: {users.length} users
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
