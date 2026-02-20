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
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconAlertTriangle,
  IconUser,
  IconShield,
  IconMail,
  IconCalendar,
  IconChevronDown,
  IconUsers,
  IconSettings,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

interface User {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  provider: string;
  googleId?: string;
  createdAt: string;
  isActive?: boolean;
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
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string; username: string } | null>(null);
  const [roleModal, setRoleModal] = useState<{ open: boolean; userId: string; username: string; newRole: string } | null>(null);
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
    setDeleteModal({ open: true, userId, username });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/users/${deleteModal.userId}`, {
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
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to delete user"
      });
      setDeleteModal(null);
    }
  };

  // Change user role
  const handleChangeRole = async (userId: string, newRole: string, username: string) => {
    setRoleModal({ open: true, userId, username, newRole });
  };

  const confirmChangeRole = async () => {
    if (!roleModal) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/users/${roleModal.userId}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: roleModal.newRole }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setRoleModal(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to change role:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to change role"
      });
      setRoleModal(null);
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter(u => u.role === "admin").length,
      guest: users.filter(u => u.role === "guest").length,
      regular: users.filter(u => u.role === "user").length,
      google: users.filter(u => u.provider === "google").length,
      email: users.filter(u => u.provider === "email").length,
    };
  }, [users]);

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const config = {
      admin: { color: "red", label: "Admin", icon: IconShield },
      guest: { color: "grape", label: "Guest", icon: IconUser },
      user: { color: "blue", label: "User", icon: IconUser },
    };
    return config[role as keyof typeof config] || { color: "gray", label: role, icon: IconUser };
  };

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    return provider === "google" ? "🔷" : "📧";
  };

  if (loading) {
    return (
      <Stack gap="lg" h="100%">
        <LoadingOverlay visible={loading} />
        <Stack align="center">
          <Loader size="lg" color="blue" />
          <Text size="lg" fw={500}>Loading users...</Text>
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
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <IconUsers size={24} color="white" />
              </div>
              <Title order={2}>User Management</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Manage user accounts, roles, and permissions
            </Text>
          </Stack>
          <Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              onClick={fetchUsers}
              size="lg"
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Stack>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-sm font-medium text-blue-600">Total Users</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-red-700">{stats.admin}</div>
            <div className="text-sm font-medium text-red-600">Admins</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-purple-700">{stats.guest}</div>
            <div className="text-sm font-medium text-purple-600">Guests</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-blue-700">{stats.regular}</div>
            <div className="text-sm font-medium text-blue-600">Users</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-indigo-700">{stats.google}</div>
            <div className="text-sm font-medium text-indigo-600">Google</div>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <Stack gap={0} align="center">
            <div className="text-3xl font-bold text-gray-700">{stats.email}</div>
            <div className="text-sm font-medium text-gray-600">Email</div>
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
            placeholder="Search by username or email..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
            size="lg"
            radius="md"
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
            size="lg"
            radius="md"
            leftSection={<IconSettings size={16} />}
          />
        </Group>
      </Card>

      {/* Users Table */}
      <Card shadow="sm" padding={0} radius="md">
        <Table striped highlightOnHover>
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th fw={600}>User</Table.Th>
              <Table.Th fw={600}>Role</Table.Th>
              <Table.Th fw={600}>Provider</Table.Th>
              <Table.Th fw={600}>Joined</Table.Th>
              <Table.Th fw={600} ta="right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedUsers.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center">
                  <Stack gap="sm" py="xl" align="center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <IconSearch size={32} className="text-gray-400" />
                    </div>
                    <Text size="lg" fw={500} c="dimmed">No users found</Text>
                    <Text size="sm" c="dimmed">Try adjusting your search or filter</Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedUsers.map((userData) => {
                const roleConfig = getRoleBadge(userData.role);
                const RoleIcon = roleConfig.icon;

                return (
                  <Table.Tr key={userData._id} className="hover:bg-blue-50/30 transition-colors">
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar
                          size="md"
                          radius="xl"
                          color={roleConfig.color === "red" ? "red" : roleConfig.color === "grape" ? "grape" : "blue"}
                        >
                          {userData.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">{userData.username}</Text>
                          <Group gap={0}>
                            <Text size="xs" c="dimmed">{userData.email}</Text>
                          </Group>
                        </Stack>
                      </Group>
                    </Table.Td>
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
                        leftSection={<RoleIcon size={12} />}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={userData.provider === "google" ? "indigo" : "gray"}
                        variant="light"
                        leftSection={getProviderIcon(userData.provider)}
                        radius="md"
                      >
                        {userData.provider}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconCalendar size={14} className="text-gray-500" />
                        <Text size="sm">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td ta="right">
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleDeleteUser(userData._id, userData.username)}
                        disabled={userData._id === user?._id}
                        size="lg"
                        radius="md"
                        title={userData._id === user?._id ? "Cannot delete your own account" : "Delete user"}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
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
              Showing {startIndex + 1}-{Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
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
            <Text size="lg" fw={600}>Delete User</Text>
          </Group>
        }
        centered
        size="md"
        radius="md"
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <Text size="sm">
              Are you sure you want to delete user <b>{deleteModal?.username}</b>?
            </Text>
            <Text size="xs" c="red" fw={500}>
              This action cannot be undone and will permanently remove the user account.
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
              onClick={confirmDeleteUser}
              size="md"
              radius="md"
              leftSection={<IconTrash size={16} />}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Change Role Confirmation Modal */}
      <Modal
        opened={roleModal?.open || false}
        onClose={() => setRoleModal(null)}
        title={
          <Group gap="sm">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconSettings size={24} color="blue" />
            </div>
            <Text size="lg" fw={600}>Change User Role</Text>
          </Group>
        }
        centered
        size="md"
        radius="md"
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <Text size="sm">
              Change role for user <b>{roleModal?.username}</b> to <Badge color="blue" variant="light">{roleModal?.newRole}</Badge>?
            </Text>
            <Text size="xs" c="dimmed">
              This will affect the user's permissions and access immediately.
            </Text>
          </Stack>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => setRoleModal(null)}
              size="md"
              radius="md"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmChangeRole}
              size="md"
              radius="md"
              gradient={{ from: "blue", to: "indigo" }}
              leftSection={<IconCheck size={16} />}
            >
              Change Role
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
    </Stack>
  );
}
