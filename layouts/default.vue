<template>
  <div class="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-slate-950 text-slate-300 flex-shrink-0 flex flex-col shadow-xl">
      <div class="p-6 border-b border-slate-800/50">
        <h1 class="text-xl font-bold flex items-center gap-2 text-white">
          <i class="pi pi-building text-primary-500"></i>
          Nhat Nam Manager
        </h1>
      </div>
      
      <nav class="flex-1 overflow-y-auto p-4 flex flex-col gap-2 relative z-10">
        <template v-for="item in menuItems" :key="item.key || item.route">
          <NuxtLink
            v-if="!item.children?.length"
            :to="item.route"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-slate-900 hover:text-white"
            active-class="bg-primary-600 text-white font-medium hover:bg-primary-600 shadow-md shadow-primary-900/20"
          >
            <i :class="item.icon"></i>
            {{ item.label }}
          </NuxtLink>

          <div v-else class="rounded-xl overflow-hidden border border-slate-900/60 bg-slate-950/60">
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-slate-900 hover:text-white"
              :class="isParentActive(item) ? 'bg-slate-900 text-white' : 'text-slate-300'"
              @click="toggleMenu(item.key)"
            >
              <span class="flex items-center gap-3">
                <i :class="item.icon"></i>
                {{ item.label }}
              </span>
              <i :class="openMenus[item.key] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
            </button>

            <div v-if="openMenus[item.key]" class="px-2 pb-2 flex flex-col gap-1 bg-slate-950/80">
              <NuxtLink
                v-for="child in item.children"
                :key="child.route"
                :to="child.route"
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg ml-3 text-sm text-slate-400 transition-all duration-200 hover:bg-slate-900 hover:text-white"
                active-class="bg-primary-600 text-white font-medium hover:bg-primary-600 shadow-md shadow-primary-900/20"
              >
                <i :class="child.icon"></i>
                {{ child.label }}
              </NuxtLink>
            </div>
          </div>
        </template>
      </nav>

      <div class="p-4 border-t border-slate-800/50">
        <button class="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors" @click="logout">
          <i class="pi pi-sign-out"></i>
          Đăng xuất
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <h2 class="text-lg font-medium text-slate-800">{{ pageTitle }}</h2>
        <div class="flex items-center gap-4">
          <!-- Notifications Bell -->
          <button class="relative p-2 rounded-full hover:bg-slate-100 transition-colors notification-bell" @click="toggleNotifications">
            <i class="pi pi-bell text-slate-600"></i>
            <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>
          
          <!-- Notifications Dropdown -->
          <div v-if="showNotifications" class="absolute right-6 top-16 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 notifications-dropdown">
            <div class="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 class="font-semibold text-slate-800">Thông báo</h3>
              <button v-if="unreadCount > 0" class="text-sm text-primary-600 hover:underline" @click="markAllRead">
                Đánh dấu đã đọc
              </button>
            </div>
            <div class="max-h-96 overflow-y-auto">
              <div v-if="notifications.length === 0" class="p-8 text-center text-slate-400">
                <i class="pi pi-inbox text-3xl mb-2"></i>
                <p>Không có thông báo</p>
              </div>
              <div v-else>
                <div v-for="notif in notifications.slice(0, 10)" :key="notif.id"
                     class="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                     :class="{ 'bg-blue-50': !notif.is_read }"
                     @click="handleNotificationClick(notif)">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center"
                         :class="getNotificationIconClass(notif.type)">
                      <i :class="getNotificationIcon(notif.type)"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-slate-800 text-sm">{{ notif.title }}</p>
                      <p class="text-xs text-slate-500 line-clamp-2">{{ notif.message }}</p>
                      <p class="text-xs text-slate-400 mt-1">{{ formatTimeAgo(notif.created_at) }}</p>
                    </div>
                    <div v-if="!notif.is_read" class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="notifications.length > 10" class="p-3 border-t border-slate-100 text-center">
              <NuxtLink to="/notifications" class="text-sm text-primary-600 hover:underline" @click="showNotifications = false">
                Xem tất cả thông báo
              </NuxtLink>
            </div>
          </div>
          
          <span class="text-sm text-slate-500">Xin chào, <b>{{ user?.name }}</b></span>
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
            {{ user?.name?.charAt(0) }}
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const openMenus = ref({
  tasks: route.path.startsWith('/my-tasks') || route.path.startsWith('/task-management')
})

const toggleMenu = (key) => {
  openMenus.value[key] = !openMenus.value[key]
}

const menuItems = computed(() => {
  const role = user.value?.role
  const items = [
    { key: 'dashboard', label: 'Tổng quan', icon: 'pi pi-home', route: '/', roles: ['Admin', 'Sale', 'Design', 'Construction'] },
    { key: 'projects', label: 'Công trình', icon: 'pi pi-briefcase', route: '/projects', roles: ['Admin', 'Sale', 'Design', 'Construction'] },
    { key: 'customers', label: 'Khách hàng', icon: 'pi pi-id-card', route: '/customers', roles: ['Admin', 'Sale', 'Design', 'Construction'] },
    { key: 'leads', label: 'Thu thập KH', icon: 'pi pi-file-edit', route: '/customer-leads', roles: ['Admin', 'Sale'] },
    {
      key: 'tasks',
      label: 'Công việc',
      icon: 'pi pi-list-check',
      roles: ['Admin', 'Design', 'Construction'],
      children: [
        { label: 'Công việc của tôi', icon: 'pi pi-user', route: '/my-tasks', roles: ['Admin', 'Design', 'Construction'] },
        { label: 'Kanban', icon: 'pi pi-th-large', route: '/task-kanban', roles: ['Admin'] },
        { label: 'QL Công việc', icon: 'pi pi-sitemap', route: '/task-management', roles: ['Admin'] }
      ]
    },
    { key: 'receipts', label: 'Thu tiền', icon: 'pi pi-wallet', route: '/receipts', roles: ['Admin', 'Sale'] },
    { key: 'expenses', label: 'Chi phí', icon: 'pi pi-credit-card', route: '/expenses', roles: ['Admin', 'Construction'] },
    { key: 'reports', label: 'BC Tài chính', icon: 'pi pi-chart-pie', route: '/reports', roles: ['Admin'] },
    { key: 'performance', label: 'BC Hiệu suất', icon: 'pi pi-chart-bar', route: '/performance', roles: ['Admin'] },
    { key: 'users', label: 'Nhân viên', icon: 'pi pi-users', route: '/users', roles: ['Admin'] },
    { key: 'logs', label: 'Lịch sử', icon: 'pi pi-history', route: '/logs', roles: ['Admin'] }
  ]

  return items
    .map((item) => {
      if (!item.children) return item
      const children = item.children.filter(child => !role || child.roles.includes(role))
      return { ...item, children }
    })
    .filter(item => (!role || item.roles.includes(role)) && (!item.children || item.children.length > 0))
})

const isParentActive = (item) => item.children?.some(child => child.route === route.path)

const pageTitle = computed(() => {
  for (const item of menuItems.value) {
    if (item.route === route.path) return item.label
    const child = item.children?.find(entry => entry.route === route.path)
    if (child) return child.label
  }
  return 'Quản lý'
})

const { user, logout } = useAuth();

const showNotifications = ref(false);
const notifications = ref([]);

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

const fetchNotifications = async () => {
  try {
    const { data } = await useFetch('/api/notifications');
    if (data.value?.notifications) {
      notifications.value = data.value.notifications;
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
};

const toggleNotifications = async () => {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value && notifications.value.length === 0) {
    await fetchNotifications();
  }
};

const markAllRead = async () => {
  try {
    await $fetch('/api/notifications/mark-all-read', { method: 'POST' });
    notifications.value.forEach(n => n.is_read = true);
  } catch (error) {
    console.error('Failed to mark all as read:', error);
  }
};

const handleNotificationClick = async (notif) => {
  if (!notif.is_read) {
    try {
      await $fetch(`/api/notifications/${notif.id}/mark-read`, { method: 'POST' });
      notif.is_read = true;
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }
  if (notif.link) {
    navigateTo(notif.link);
    showNotifications.value = false;
  }
};

const getNotificationIcon = (type) => {
  const icons = {
    task_assigned: 'pi pi-check-circle',
    task_overdue: 'pi pi-exclamation-triangle',
    task_completed: 'pi pi-check-square',
    project_update: 'pi pi-briefcase',
    reminder: 'pi pi-clock',
    system: 'pi pi-info-circle'
  };
  return icons[type] || 'pi pi-bell';
};

const getNotificationIconClass = (type) => {
  const classes = {
    task_assigned: 'bg-blue-100 text-blue-600',
    task_overdue: 'bg-red-100 text-red-600',
    task_completed: 'bg-green-100 text-green-600',
    project_update: 'bg-purple-100 text-purple-600',
    reminder: 'bg-amber-100 text-amber-600',
    system: 'bg-slate-100 text-slate-600'
  };
  return classes[type] || 'bg-slate-100 text-slate-600';
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

onMounted(() => {
  fetchNotifications();
  setInterval(fetchNotifications, 60000);
  
  document.addEventListener('click', (event) => {
    const dropdown = event.target.closest('.notifications-dropdown');
    const bell = event.target.closest('.notification-bell');
    if (!dropdown && !bell) {
      showNotifications.value = false;
    }
  });
});
</script>
