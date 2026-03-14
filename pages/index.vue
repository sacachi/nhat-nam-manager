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

    <!-- Recent Activity -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-slate-800">Hoạt động gần đây</h3>
          <NuxtLink to="/logs" class="text-primary-600 text-sm hover:underline font-medium">Xem tất cả</NuxtLink>
      </div>

      <div class="space-y-4" v-if="dashboardData?.recentLogs?.length > 0">
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

const { data: dashboardData } = await useFetch('/api/dashboard', {
    default: () => ({ projects: 0, totalReceived: 0, totalSpent: 0, recentLogs: [] })
});

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDateTime = (value) => {
    return value ? new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(value)) : '';
};

const getEntityName = (entity) => {
    switch (entity) {
        case 'project': return 'công trình';
        case 'receipt': return 'phiếu thu';
        case 'expense': return 'phiếu chi';
        case 'user': return 'nhân sự';
        default: return 'dữ liệu';
    }
};

const stats = computed(() => {
    const d = dashboardData.value;
    const profit = d.totalReceived - d.totalSpent;
    return [
        { title: 'Tổng công trình', value: d.projects, icon: 'pi pi-briefcase', colorClass: 'bg-blue-100 text-blue-600' },
        { title: 'Tổng đã thu', value: formatCurrency(d.totalReceived), icon: 'pi pi-arrow-down', colorClass: 'bg-emerald-100 text-emerald-600' },
        { title: 'Tổng đã chi', value: formatCurrency(d.totalSpent), icon: 'pi pi-arrow-up', colorClass: 'bg-red-100 text-red-600' },
        { title: 'Lợi nhuận tạm tính', value: formatCurrency(profit), icon: 'pi pi-chart-line', colorClass: profit >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600' }
    ]
})
</script>
