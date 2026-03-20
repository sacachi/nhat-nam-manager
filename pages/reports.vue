<template>
  <div class="space-y-6">
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <h2 class="text-xl font-bold text-slate-800">Báo cáo & Phân tích</h2>
      <div class="flex gap-2">
        <Button icon="pi pi-refresh" severity="secondary" text @click="refreshData" :loading="loading" />
      </div>
    </div>

    <Tabs value="financial" class="reports-tabs">
      <TabList>
        <Tab value="financial"><i class="pi pi-chart-pie mr-2"></i>Tài chính</Tab>
        <Tab value="project"><i class="pi pi-briefcase mr-2"></i>Tiến độ dự án</Tab>
        <Tab value="team"><i class="pi pi-users mr-2"></i>Hiệu suất nhóm</Tab>
        <Tab value="funnel"><i class="pi pi-filter mr-2"></i>Lead Funnel</Tab>
      </TabList>

      <TabPanels>
        <!-- Financial Tab -->
        <TabPanel value="financial">
          <div class="space-y-6 pt-4">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 class="text-lg font-bold text-slate-800 mb-4">Báo cáo tài chính năm {{ financialData?.currentYear }}</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center"><i class="pi pi-chart-bar mr-2 text-indigo-500"></i> Thu / Chi theo tháng</h3>
                <ClientOnly fallback="Đang tải biểu đồ...">
                  <Chart type="bar" :data="monthlyChartData" :options="monthlyChartOptions" class="h-[300px]" />
                </ClientOnly>
              </div>

              <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center"><i class="pi pi-chart-line mr-2 text-emerald-500"></i> Lợi nhuận gộp theo tháng</h3>
                <ClientOnly fallback="Đang tải biểu đồ...">
                  <Chart type="line" :data="profitChartData" :options="profitChartOptions" class="h-[300px]" />
                </ClientOnly>
              </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center"><i class="pi pi-briefcase mr-2 text-orange-500"></i> Tình hình tài chính theo công trình</h3>
              <DataTable :value="financialData?.projectBreakdown" paginator :rows="10" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
                <Column field="name" header="Tên công trình" sortable></Column>
                <Column field="received" header="Tổng Thu (VNĐ)" sortable>
                  <template #body="{ data }">
                    <span class="text-emerald-600 font-medium">{{ formatCurrency(data.received) }}</span>
                  </template>
                </Column>
                <Column field="spent" header="Tổng Chi (VNĐ)" sortable>
                  <template #body="{ data }">
                    <span class="text-red-500 font-medium">{{ formatCurrency(data.spent) }}</span>
                  </template>
                </Column>
                <Column header="Lợi nhuận" sortable>
                  <template #body="{ data }">
                    <span class="font-bold border px-2 py-1 rounded" :class="data.received - data.spent >= 0 ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-orange-600 bg-orange-50 border-orange-200'">
                      {{ formatCurrency(data.received - data.spent) }}
                    </span>
                  </template>
                </Column>
                <Column header="Tỷ suất LN">
                  <template #body="{ data }">
                    <Tag :severity="(data.received - data.spent) >= 0 ? 'success' : 'danger'" 
                         :value="data.received > 0 ? (((data.received - data.spent) / data.received * 100).toFixed(1) + '%') : '0%'" />
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </TabPanel>

        <!-- Project Progress Tab -->
        <TabPanel value="project">
          <div class="space-y-6 pt-4">
            <div v-if="loading" class="flex justify-center py-12">
              <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
            </div>

            <div v-else-if="projectData?.length === 0" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <i class="pi pi-briefcase text-6xl text-slate-300 mb-4"></i>
              <p class="text-slate-500 text-lg">Chưa có dữ liệu dự án</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div v-for="project in projectData" :key="project.id" class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-slate-800 truncate flex-1">{{ project.name }}</h4>
                  <Tag :severity="getProjectStatusSeverity(project.status)" :value="getProjectStatusLabel(project.status)" class="text-xs" />
                </div>
                
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-slate-500">Tiến độ</span>
                      <span class="font-medium">{{ project.completionRate }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2">
                      <div class="h-2 rounded-full transition-all" 
                           :class="project.completionRate >= 80 ? 'bg-green-500' : project.completionRate >= 50 ? 'bg-blue-500' : 'bg-amber-500'"
                           :style="{ width: project.completionRate + '%' }"></div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-check-circle text-green-500"></i>
                      <span>{{ project.completedTasks }} hoàn thành</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="pi pi-clock text-blue-500"></i>
                      <span>{{ project.inProgressTasks }} đang làm</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="pi pi-exclamation-circle text-red-500"></i>
                      <span>{{ project.overdueTasks }} quá hạn</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="pi pi-list text-slate-500"></i>
                      <span>{{ project.totalTasks }} tổng</span>
                    </div>
                  </div>

                  <div class="pt-2 border-t">
                    <div class="flex justify-between text-sm">
                      <span class="text-slate-500">Chi phí</span>
                      <span class="font-medium text-red-600">{{ formatCurrency(project.totalExpense) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Team Performance Tab -->
        <TabPanel value="team">
          <div class="space-y-6 pt-4">
            <div v-if="loading" class="flex justify-center py-12">
              <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
            </div>

            <template v-else>
              <!-- Team Summary Cards -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                  <div class="flex items-center gap-3 mb-3">
                    <i class="pi pi-user-edit text-2xl"></i>
                    <div>
                      <p class="text-green-100 text-sm">Đội ngũ Sale</p>
                      <p class="text-2xl font-bold">{{ teamData?.teamSummary?.Sale?.total || 0 }} người</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-white/20 rounded-lg p-2">
                      <p class="text-green-100">Leads</p>
                      <p class="font-bold">{{ teamData?.teamSummary?.Sale?.totalLeads || 0 }}</p>
                    </div>
                    <div class="bg-white/20 rounded-lg p-2">
                      <p class="text-green-100">Chuyển đổi</p>
                      <p class="font-bold">{{ teamData?.teamSummary?.Sale?.totalConverted || 0 }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                  <div class="flex items-center gap-3 mb-3">
                    <i class="pi pi-palette text-2xl"></i>
                    <div>
                      <p class="text-blue-100 text-sm">Đội ngũ Design</p>
                      <p class="text-2xl font-bold">{{ teamData?.teamSummary?.Design?.total || 0 }} người</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-white/20 rounded-lg p-2">
                      <p class="text-blue-100">Tasks</p>
                      <p class="font-bold">{{ teamData?.teamSummary?.Design?.totalTasks || 0 }}</p>
                    </div>
                    <div class="bg-white/20 rounded-lg p-2">
                      <p class="text-blue-100">Quá hạn</p>
                      <p class="font-bold">{{ teamData?.teamSummary?.Design?.totalOverdue || 0 }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                  <div class="flex items-center gap-3 mb-3">
                    <i class="pi pi-wrench text-2xl"></i>
                    <div>
                      <p class="text-orange-100 text-sm">Đội ngũ Thi công</p>
                      <p class="text-2xl font-bold">{{ teamData?.teamSummary?.Construction?.total || 0 }} người</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-white/20 rounded-lg p-2">
                      <p class="text-orange-100">Tasks</p>
                      <p class="font-bold">{{ teamData?.teamSummary?.Construction?.totalTasks || 0 }}</p>
                    </div>
                    <div class="bg-white/20 rounded-lg p-2">
                      <p class="text-orange-100">Quá hạn</p>
                      <p class="font-bold">{{ teamData?.teamSummary?.Construction?.totalOverdue || 0 }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Team Member Performance -->
              <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-6">Chi tiết theo nhân viên</h3>
                <DataTable :value="teamData?.teamReport" paginator :rows="10" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
                  <Column field="name" header="Nhân viên" sortable>
                    <template #body="{ data }">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          {{ data.name?.charAt(0) }}
                        </div>
                        <div>
                          <p class="font-medium">{{ data.name }}</p>
                          <p class="text-xs text-slate-500">{{ data.role }}</p>
                        </div>
                      </div>
                    </template>
                  </Column>
                  <Column header="Công việc" style="min-width: 200px">
                    <template #body="{ data }">
                      <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1">
                          <span class="text-green-600 font-medium">{{ data.tasks?.completed || 0 }}</span>
                          <span class="text-slate-400 text-xs">/ {{ data.tasks?.total || 0 }}</span>
                        </div>
                        <Tag :severity="(data.tasks?.completionRate || 0) >= 80 ? 'success' : (data.tasks?.completionRate || 0) >= 50 ? 'warn' : 'danger'" 
                             :value="data.tasks?.completionRate + '%'" class="text-xs" />
                      </div>
                    </template>
                  </Column>
                  <Column header="Quá hạn">
                    <template #body="{ data }">
                      <span v-if="data.tasks?.overdue > 0" class="text-red-600 font-medium">
                        <i class="pi pi-exclamation-circle mr-1"></i>{{ data.tasks?.overdue }}
                      </span>
                      <span v-else class="text-slate-400">0</span>
                    </template>
                  </Column>
                  <Column v-if="data.role === 'Sale'" header="Leads xử lý">
                    <template #body="{ data }">
                      <span v-if="data.leads">{{ data.leads.handled }}</span>
                      <span v-else class="text-slate-400">-</span>
                    </template>
                  </Column>
                  <Column v-if="data.role === 'Sale'" header="Tỷ lệ chuyển đổi">
                    <template #body="{ data }">
                      <span v-if="data.leads" class="font-medium" :class="data.leads.conversionRate >= 30 ? 'text-green-600' : 'text-amber-600'">
                        {{ data.leads.conversionRate }}%
                      </span>
                      <span v-else class="text-slate-400">-</span>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </template>
          </div>
        </TabPanel>

        <!-- Lead Funnel Tab -->
        <TabPanel value="funnel">
          <div class="space-y-6 pt-4">
            <div v-if="loading" class="flex justify-center py-12">
              <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
            </div>

            <template v-else>
              <!-- Funnel Summary -->
              <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-6">Phễu Lead</h3>
                
                <div class="mb-6">
                  <div class="flex gap-4 justify-between max-w-4xl mx-auto">
                    <div v-for="stage in funnelStages" :key="stage.key" class="flex-1 text-center">
                      <div class="bg-slate-50 rounded-lg p-4 mb-2">
                        <p class="text-3xl font-bold text-slate-800">{{ funnelData?.funnel?.[stage.key] || 0 }}</p>
                        <p class="text-sm text-slate-500">{{ stage.label }}</p>
                      </div>
                      <div v-if="stage.key === 'total'" class="flex justify-center gap-4 mt-2 text-sm">
                        <span class="text-green-600">Chuyển đổi: {{ funnelData?.conversionRate }}%</span>
                        <span class="text-red-600">Từ chối: {{ funnelData?.rejectionRate }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Funnel visualization -->
                <div class="flex flex-col items-center gap-1 max-w-4xl mx-auto mt-8">
                  <div class="w-full bg-green-500 text-white rounded-lg py-3 text-center font-medium" 
                       :style="{ width: '100%' }">
                    Tổng: {{ funnelData?.funnel?.total || 0 }} leads
                  </div>
                  <div class="flex gap-2 w-full">
                    <div class="bg-amber-500 text-white rounded py-2 text-center text-sm font-medium" 
                         :style="{ width: funnelWidth(funnelData?.funnel?.pending || 0) }">
                      {{ funnelData?.funnel?.pending || 0 }}
                    </div>
                    <div class="bg-blue-500 text-white rounded py-2 text-center text-sm font-medium" 
                         :style="{ width: funnelWidth(funnelData?.funnel?.reviewed || 0) }">
                      {{ funnelData?.funnel?.reviewed || 0 }}
                    </div>
                    <div class="bg-purple-500 text-white rounded py-2 text-center text-sm font-medium" 
                         :style="{ width: funnelWidth(funnelData?.funnel?.assigned || 0) }">
                      {{ funnelData?.funnel?.assigned || 0 }}
                    </div>
                  </div>
                  <div class="flex gap-2 w-full">
                    <div class="bg-indigo-500 text-white rounded py-2 text-center text-sm font-medium" 
                         :style="{ width: funnelWidth(funnelData?.funnel?.approved || 0) }">
                      {{ funnelData?.funnel?.approved || 0 }}
                    </div>
                    <div class="bg-green-600 text-white rounded py-2 text-center text-sm font-medium" 
                         :style="{ width: funnelWidth(funnelData?.funnel?.converted || 0) }">
                      {{ funnelData?.funnel?.converted || 0 }}
                    </div>
                    <div class="bg-red-500 text-white rounded py-2 text-center text-sm font-medium" 
                         :style="{ width: funnelWidth(funnelData?.funnel?.rejected || 0) }">
                      {{ funnelData?.funnel?.rejected || 0 }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-amber-500 rounded"></div>
                    <span>Chờ duyệt</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Đã duyệt</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>Đã gán</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-indigo-500 rounded"></div>
                    <span>Đã duyệt TK</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-green-600 rounded"></div>
                    <span>Đã chuyển đổi</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Từ chối</span>
                  </div>
                </div>
              </div>

              <!-- Sale Performance -->
              <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-6">Hiệu suất Sale</h3>
                <DataTable :value="funnelData?.salePerformance" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
                  <Column field="name" header="Nhân viên" sortable></Column>
                  <Column field="total" header="Tổng Leads" sortable></Column>
                  <Column field="converted" header="Đã chuyển đổi" sortable>
                    <template #body="{ data }">
                      <span class="text-green-600 font-medium">{{ data.converted }}</span>
                    </template>
                  </Column>
                  <Column field="rejected" header="Từ chối" sortable>
                    <template #body="{ data }">
                      <span class="text-red-500">{{ data.rejected }}</span>
                    </template>
                  </Column>
                  <Column field="conversionRate" header="Tỷ lệ chuyển đổi" sortable>
                    <template #body="{ data }">
                      <Tag :severity="data.conversionRate >= 30 ? 'success' : data.conversionRate >= 15 ? 'warn' : 'danger'" 
                           :value="data.conversionRate + '%'" />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </template>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const loading = ref(false);

const { data: financialData } = await useFetch('/api/reports', {
  default: () => ({ currentYear: new Date().getFullYear(), monthlyData: [], projectBreakdown: [] })
});

const { data: projectData, refresh: refreshProject } = await useFetch('/api/reports/project-progress', {
  default: () => []
});

const { data: teamData, refresh: refreshTeam } = await useFetch('/api/reports/team-performance', {
  default: () => ({ teamReport: [], teamSummary: {} })
});

const { data: funnelData, refresh: refreshFunnel } = await useFetch('/api/reports/lead-funnel', {
  default: () => ({ funnel: {}, conversionRate: 0, rejectionRate: 0, salePerformance: [] })
});

const refreshData = async () => {
  loading.value = true;
  await Promise.all([refreshProject(), refreshTeam(), refreshFunnel()]);
  loading.value = false;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const textColor = ref('#334155');
const textColorSecondary = ref('#64748b');
const surfaceBorder = ref('#e2e8f0');

onMounted(() => {
  const documentStyle = getComputedStyle(document.documentElement);
  textColor.value = documentStyle.getPropertyValue('--p-text-color') || '#334155';
  textColorSecondary.value = documentStyle.getPropertyValue('--p-text-muted-color') || '#64748b';
  surfaceBorder.value = documentStyle.getPropertyValue('--p-content-border-color') || '#e2e8f0';
});

const monthlyChartData = computed(() => {
  const months = financialData.value?.monthlyData?.map(d => `Tháng ${d.month}`) || [];
  const received = financialData.value?.monthlyData?.map(d => d.received) || [];
  const spent = financialData.value?.monthlyData?.map(d => d.spent) || [];

  return {
    labels: months,
    datasets: [
      { label: 'Tổng Thu', backgroundColor: '#10b981', data: received },
      { label: 'Tổng Chi', backgroundColor: '#ef4444', data: spent }
    ]
  };
});

const monthlyChartOptions = computed(() => ({
  maintainAspectRatio: false,
  aspectRatio: 0.8,
  plugins: {
    legend: { labels: { color: textColor.value } },
    tooltip: {
      callbacks: {
        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
      }
    }
  },
  scales: {
    x: { ticks: { color: textColorSecondary.value, font: { weight: 500 } }, grid: { display: false } },
    y: { ticks: { color: textColorSecondary.value }, grid: { color: surfaceBorder.value } }
  }
}));

const profitChartData = computed(() => {
  const months = financialData.value?.monthlyData?.map(d => `Tháng ${d.month}`) || [];
  const profits = financialData.value?.monthlyData?.map(d => d.received - d.spent) || [];

  return {
    labels: months,
    datasets: [{
      label: 'Lợi Nhuận Gộp',
      data: profits,
      fill: true,
      borderColor: '#6366f1',
      tension: 0.4,
      backgroundColor: 'rgba(99, 102, 241, 0.2)'
    }]
  };
});

const profitChartOptions = computed(() => ({
  maintainAspectRatio: false,
  aspectRatio: 0.8,
  plugins: {
    legend: { labels: { color: textColor.value } },
    tooltip: {
      callbacks: { label: (context) => formatCurrency(context.parsed.y) }
    }
  },
  scales: {
    x: { ticks: { color: textColorSecondary.value }, grid: { display: false } },
    y: { ticks: { color: textColorSecondary.value }, grid: { color: surfaceBorder.value } }
  }
}));

const funnelStages = [
  { key: 'total', label: 'Tổng' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'reviewed', label: 'Đã duyệt' },
  { key: 'assigned', label: 'Đã gán' },
  { key: 'approved', label: 'Duyệt TK' },
  { key: 'converted', label: 'Chuyển đổi' },
  { key: 'rejected', label: 'Từ chối' }
];

const funnelWidth = (value) => {
  const total = funnelData.value?.funnel?.total || 1;
  const percent = Math.max((value / total) * 100, 5);
  return percent + '%';
};

const getProjectStatusSeverity = (status) => {
  const map = { 'đang thi công': 'info', 'tạm dừng': 'warn', 'đã hoàn thành': 'success' };
  return map[status] || 'secondary';
};

const getProjectStatusLabel = (status) => {
  const map = { 'đang thi công': 'Đang thi công', 'tạm dừng': 'Tạm dừng', 'đã hoàn thành': 'Hoàn thành' };
  return map[status] || status;
};
</script>

<style scoped>
.reports-tabs :deep(.p-tablist-tab-list) {
  background: white;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.reports-tabs :deep(.p-tab) {
  border-radius: 8px;
}
</style>
