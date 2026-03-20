<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <i class="pi pi-arrow-left text-slate-600"></i>
        </button>
        <h1 class="text-xl font-semibold text-slate-800">Thông báo</h1>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-slate-500">{{ unreadCount }} chưa đọc</span>
        <Button v-if="unreadCount > 0" label="Đánh dấu tất cả đã đọc" icon="pi pi-check" size="small" severity="secondary" outlined @click="markAllRead" />
        <Button label="Làm mới" icon="pi pi-refresh" size="small" severity="secondary" text @click="fetchNotifications" :loading="loading" />
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-100">
      <div class="border-b border-slate-100">
        <div class="flex">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            :class="activeTab === tab.value ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>

      <div v-else-if="filteredNotifications.length === 0" class="p-12 text-center">
        <div class="text-slate-300 mb-4">
          <i class="pi pi-bell text-6xl"></i>
        </div>
        <p class="text-slate-500 text-lg">{{ emptyMessage }}</p>
      </div>

      <div v-else class="divide-y divide-slate-50">
        <div
          v-for="notif in filteredNotifications"
          :key="notif.id"
          class="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
          :class="{ 'bg-blue-50/50': !notif.is_read }"
          @click="handleNotificationClick(notif)"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                 :class="getNotificationIconClass(notif.type)">
              <i :class="getNotificationIcon(notif.type)" class="text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold text-slate-800">{{ notif.title }}</h3>
                    <span v-if="!notif.is_read" class="w-2 h-2 bg-primary-500 rounded-full"></span>
                  </div>
                  <p class="text-sm text-slate-600">{{ notif.message }}</p>
                </div>
                <div class="flex flex-col items-end gap-2 shrink-0">
                  <span class="text-xs text-slate-400 whitespace-nowrap">{{ formatTimeAgo(notif.created_at) }}</span>
                  <Button v-if="!notif.is_read" icon="pi pi-check" size="small" severity="secondary" text rounded @click.stop="markAsRead(notif)" v-tooltip="'Đánh dấu đã đọc'" />
                </div>
              </div>
              <div v-if="notif.link" class="mt-2">
                <span class="text-xs text-primary-600 hover:underline flex items-center gap-1">
                  <i class="pi pi-external-link"></i>
                  Xem chi tiết
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredNotifications.length > 0" class="p-4 border-t border-slate-100">
        <Paginator
          :rows="pageSize"
          :totalRecords="totalNotifications"
          :first="(currentPage - 1) * pageSize"
          @page="onPageChange"
          :rowsPerPageOptions="[10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const notifications = ref([]);
const loading = ref(false);
const activeTab = ref('all');
const currentPage = ref(1);
const pageSize = ref(20);
const totalNotifications = ref(0);

const tabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chưa đọc', value: 'unread' },
  { label: 'Đã đọc', value: 'read' }
];

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);
const emptyMessage = computed(() => {
  if (activeTab.value === 'unread') return 'Không có thông báo chưa đọc';
  if (activeTab.value === 'read') return 'Không có thông báo đã đọc';
  return 'Không có thông báo nào';
});

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') return notifications.value.filter(n => !n.is_read);
  if (activeTab.value === 'read') return notifications.value.filter(n => n.is_read);
  return notifications.value;
});

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const { data } = await useFetch('/api/notifications');
    if (data.value?.notifications) {
      notifications.value = data.value.notifications;
      totalNotifications.value = notifications.value.length;
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  } finally {
    loading.value = false;
  }
};

const markAsRead = async (notif) => {
  if (!notif.is_read) {
    try {
      await $fetch(`/api/notifications/${notif.id}/mark-read`, { method: 'POST' });
      notif.is_read = true;
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
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
    await markAsRead(notif);
  }
  if (notif.link) {
    router.push(notif.link);
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

const onPageChange = (event) => {
  currentPage.value = event.page + 1;
  pageSize.value = event.rows;
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchNotifications();
});
</script>
