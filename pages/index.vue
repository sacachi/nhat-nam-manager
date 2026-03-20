<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="stat in stats" :key="stat.title" 
           class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform hover:-translate-y-1 duration-300">
        <div>
          <p class="text-sm font-medium text-slate-500 mb-1">{{ stat.title }}</p>
          <h3 class="text-2xl font-bold text-slate-800">{{ stat.value }}</h3>
        </div>
        <div :class="`w-12 h-12 rounded-full flex items-center justify-center ${stat.colorClass}`">
          <i :class="stat.icon + ' text-xl'"></i>
        </div>
      </div>
    </div>

    <!-- Sale: Leads Stats -->
    <div v-if="dashboardData.leadsStats" class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
      <h3 class="text-lg font-bold mb-3">Thu Thập Khách Hàng</h3>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-3xl font-bold">{{ dashboardData.leadsStats.total }}</p>
          <p class="text-sm opacity-80">Tổng phiếu</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ dashboardData.leadsStats.converted }}</p>
          <p class="text-sm opacity-80">Đã chuyển đổi</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ dashboardData.leadsStats.pending }}</p>
          <p class="text-sm opacity-80">Chờ duyệt</p>
        </div>
      </div>
    </div>

    <!-- Design: Design Stats -->
    <div v-if="dashboardData.designStats" class="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl shadow-lg p-6 text-white">
      <h3 class="text-lg font-bold mb-3">Thiết Kế Của Tôi</h3>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-3xl font-bold">{{ dashboardData.designStats.assigned }}</p>
          <p class="text-sm opacity-80">Được giao</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ dashboardData.designStats.inProgress }}</p>
          <p class="text-sm opacity-80">Đang TK</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ dashboardData.designStats.completed }}</p>
          <p class="text-sm opacity-80">Đã duyệt</p>
        </div>
      </div>
    </div>

    <!-- My Performance Widget (for non-admin users) -->
    <div v-if="!isAdmin && myPerformance" class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg p-6 text-white">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-bold mb-2">Hiệu Suất Của Tôi</h3>
          <div class="flex items-center gap-4">
            <div class="text-4xl font-bold">{{ myPerformance.score }}</div>
            <div>
              <Tag :value="myPerformance.grade" severity="secondary" class="mb-1" />
              <p class="text-sm opacity-80">Hạng #{{ myPerformance.team_comparison?.your_rank }}/{{ myPerformance.team_comparison?.team_size }}</p>
            </div>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm opacity-80 mb-1">So với team</p>
          <p class="text-lg font-semibold">TB: {{ myPerformance.team_comparison?.team_avg_score }}</p>
          <span v-if="myPerformance.trend === 'up'" class="text-green-300 text-sm">↑ Tăng</span>
          <span v-else-if="myPerformance.trend === 'down'" class="text-red-300 text-sm">↓ Giảm</span>
          <span v-else class="text-slate-300 text-sm">— Ổn định</span>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-white/20">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div v-for="(value, key) in quickMetrics" :key="key">
            <p class="text-2xl font-bold">{{ value }}</p>
            <p class="text-xs opacity-80">{{ key }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Stats & Overdue Alerts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Task Summary -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">Công việc</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-slate-600">Tổng số</span>
            <span class="font-semibold text-slate-800">{{ dashboardData.tasks?.total || 0 }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-amber-600">Đang chờ</span>
            <span class="font-semibold text-amber-600">{{ dashboardData.tasks?.pending || 0 }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-blue-600">Đang làm</span>
            <span class="font-semibold text-blue-600">{{ dashboardData.tasks?.inProgress || 0 }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-green-600">Hoàn thành</span>
            <span class="font-semibold text-green-600">{{ dashboardData.tasks?.completed || 0 }}</span>
          </div>
          <div class="pt-2 border-t">
            <NuxtLink to="/my-tasks" class="text-primary-600 text-sm hover:underline font-medium">
              Xem chi tiết →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Overdue Tasks -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i class="pi pi-exclamation-triangle text-red-500"></i>
            Công việc quá hạn
          </h3>
          <span class="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-medium">
            {{ dashboardData.overdueTasks?.length || 0 }}
          </span>
        </div>
        
        <div v-if="dashboardData.overdueTasks?.length > 0" class="space-y-3">
          <div v-for="task in dashboardData.overdueTasks" :key="task.id" 
               class="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p class="font-medium text-slate-800">{{ task.title }}</p>
              <p class="text-sm text-slate-500">{{ task.project_name }}</p>
            </div>
            <div class="text-right">
              <p class="text-red-600 font-medium text-sm">{{ formatDate(task.deadline) }}</p>
              <p class="text-xs text-slate-500">{{ task.assignee_name || 'Chưa gán' }}</p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4 text-slate-400">
          <i class="pi pi-check-circle text-2xl mb-2"></i>
          <p>Không có công việc quá hạn</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-slate-800">Hoạt động gần đây</h3>
          <NuxtLink to="/logs" class="text-primary-600 text-sm hover:underline font-medium">Xem tất cả</NuxtLink>
      </div>

      <div class="space-y-4" v-if="dashboardData.recentLogs?.length > 0">
        <div v-for="log in dashboardData.recentLogs" :key="log.id" class="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            :class="{
                'bg-emerald-100 text-emerald-600': log.action === 'create',
                'bg-blue-100 text-blue-600': log.action === 'update',
                'bg-red-100 text-red-600': log.action === 'delete'
            }">
            <i class="pi" :class="{
                'pi-plus': log.action === 'create',
                'pi-pencil': log.action === 'update',
                'pi-trash': log.action === 'delete'
            }"></i>
          </div>
          <div>
            <p class="text-sm text-slate-800 font-medium">
              <span class="font-bold">{{ log.user_name || log.user_id }}</span> đã
              {{ log.action === 'create' ? 'thêm mới' : log.action === 'update' ? 'cập nhật' : 'xóa' }}
              {{ getEntityName(log.entity) }}
            </p>
            <p class="text-xs text-slate-500 mt-1">{{ formatDateTime(log.created_at) }}</p>
          </div>
        </div>
      </div>
      <div v-else class="text-sm text-slate-500 flex flex-col items-center justify-center py-6">
          <i class="pi pi-inbox text-3xl mb-2 text-slate-300"></i>
          Chưa có hoạt động nào trong hệ thống
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const { user: currentUser } = useAuth()
const isAdmin = computed(() => currentUser.value?.role === 'Admin')

const { data: dashboardData } = await useFetch('/api/dashboard', {
    default: () => ({ projects: 0, totalReceived: 0, totalSpent: 0, tasks: {}, recentLogs: [], overdueTasks: [] })
});

const { data: myPerformance } = await useFetch('/api/performance/me', {
    default: () => null,
    query: computed(() => ({ from: undefined, to: undefined })),
    transform: (data) => data,
    watch: false
})

const quickMetrics = computed(() => {
    if (!myPerformance.value?.metrics) return {}
    const m = myPerformance.value.metrics
    if (currentUser.value?.role === 'Sale') {
        return {
            'Leads': m.leads_created || 0,
            'Converted': m.leads_converted || 0,
            'Conv Rate': (m.conversion_rate || 0).toFixed(0) + '%'
        }
    }
    if (currentUser.value?.role === 'Design' || currentUser.value?.role === 'Construction') {
        return {
            'Tasks': m.tasks_completed || 0,
            'On-time': (m.on_time_rate || 0).toFixed(0) + '%',
            'Overdue': m.overdue_tasks || 0
        }
    }
    return {}
})

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDateTime = (value) => {
    return value ? new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(value)) : '';
};

const formatDate = (value) => {
    return value ? new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(value)) : '';
};

const getEntityName = (entity) => {
    switch (entity) {
        case 'project': return 'công trình';
        case 'receipt': return 'phiếu thu';
        case 'expense': return 'phiếu chi';
        case 'user': return 'nhân sự';
        case 'customer_lead': return 'phiếu thu thập';
        case 'project_task': return 'công việc';
        default: return 'dữ liệu';
    }
};

const stats = computed(() => {
    const d = dashboardData.value;
    const profit = d.totalReceived - d.totalSpent;
    
    if (isAdmin.value) {
        return [
            { title: 'Tổng công trình', value: d.projects, icon: 'pi pi-briefcase', colorClass: 'bg-blue-100 text-blue-600' },
            { title: 'Tổng đã thu', value: formatCurrency(d.totalReceived), icon: 'pi pi-arrow-down', colorClass: 'bg-emerald-100 text-emerald-600' },
            { title: 'Tổng đã chi', value: formatCurrency(d.totalSpent), icon: 'pi pi-arrow-up', colorClass: 'bg-red-100 text-red-600' },
            { title: 'Lợi nhuận tạm tính', value: formatCurrency(profit), icon: 'pi pi-chart-line', colorClass: profit >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600' }
        ]
    }
    
    // Non-admin: show their relevant stats
    return [
        { title: 'Công trình liên quan', value: d.projects, icon: 'pi pi-briefcase', colorClass: 'bg-blue-100 text-blue-600' },
        { title: 'Công việc', value: d.tasks?.total || 0, icon: 'pi pi-list-check', colorClass: 'bg-purple-100 text-purple-600' },
        { title: 'Đang làm', value: d.tasks?.inProgress || 0, icon: 'pi pi-spinner', colorClass: 'bg-amber-100 text-amber-600' },
        { title: 'Hoàn thành', value: d.tasks?.completed || 0, icon: 'pi pi-check-circle', colorClass: 'bg-emerald-100 text-emerald-600' }
    ]
})
</script>
