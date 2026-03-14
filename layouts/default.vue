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
        <NuxtLink v-for="item in menuItems" :key="item.route" :to="item.route"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-slate-900 hover:text-white"
          active-class="bg-primary-600 text-white font-medium hover:bg-primary-600 shadow-md shadow-primary-900/20">
          <i :class="item.icon"></i>
          {{ item.label }}
        </NuxtLink>
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
        <div class="flex items-center gap-4" v-if="user">
          <span class="text-sm text-slate-500">Xin chào, <b>{{ user.name }}</b></span>
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
            {{ user.name.charAt(0) }}
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
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const menuItems = [
  { label: 'Tổng quan', icon: 'pi pi-home', route: '/' },
  { label: 'Công trình', icon: 'pi pi-briefcase', route: '/projects' },
  { label: 'Khách hàng', icon: 'pi pi-id-card', route: '/customers' },
  { label: 'Thu tiền', icon: 'pi pi-wallet', route: '/receipts' },
  { label: 'Chi phí', icon: 'pi pi-credit-card', route: '/expenses' },
  { label: 'Báo cáo tài chính', icon: 'pi pi-chart-pie', route: '/reports' },
  { label: 'Nhân viên', icon: 'pi pi-users', route: '/users' },
  { label: 'Lịch sử', icon: 'pi pi-history', route: '/logs' }
]

const pageTitle = computed(() => {
  const item = menuItems.find(i => i.route === route.path);
  return item ? item.label : 'Quản lý';
})

const { user, logout } = useAuth();
</script>
