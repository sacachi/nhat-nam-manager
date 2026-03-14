<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Báo cáo tài chính năm {{ data?.currentYear }}</h2>
        <p class="text-slate-500 mt-1">Tổng quan thu chi theo từng tháng và chi tiết theo công trình</p>
      </div>
      <div>
        <Button icon="pi pi-download" label="Xuất Excel" severity="secondary" outlined disabled />
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Monthly Chart -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center"><i class="pi pi-chart-bar mr-2 text-indigo-500"></i> Thu / Chi theo tháng</h3>
            <ClientOnly fallback="Đang tải biểu đồ...">
                <Chart type="bar" :data="monthlyChartData" :options="monthlyChartOptions" class="h-[300px]" />
            </ClientOnly>
        </div>

        <!-- Profit Chart -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center"><i class="pi pi-chart-line mr-2 text-emerald-500"></i> Lợi nhuận gộp theo tháng</h3>
            <ClientOnly fallback="Đang tải biểu đồ...">
                <Chart type="line" :data="profitChartData" :options="profitChartOptions" class="h-[300px]" />
            </ClientOnly>
        </div>
    </div>

    <!-- Project Breakdown Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center"><i class="pi pi-briefcase mr-2 text-orange-500"></i> Tình hình tài chính theo công trình</h3>
        <DataTable :value="data?.projectBreakdown" paginator :rows="10" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
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
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';

const { data } = await useFetch('/api/reports', {
    default: () => ({ currentYear: new Date().getFullYear(), monthlyData: [], projectBreakdown: [] })
});

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const textColor = ref('#334155');
const textColorSecondary = ref('#64748b');
const surfaceBorder = ref('#e2e8f0');

onMounted(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    // PrimeVue theme variables
    textColor.value = documentStyle.getPropertyValue('--p-text-color') || '#334155';
    textColorSecondary.value = documentStyle.getPropertyValue('--p-text-muted-color') || '#64748b';
    surfaceBorder.value = documentStyle.getPropertyValue('--p-content-border-color') || '#e2e8f0';
})

// Monthly Bar Chart (Received vs Spent)
const monthlyChartData = computed(() => {
    const months = data.value.monthlyData.map(d => `Tháng ${d.month}`);
    const received = data.value.monthlyData.map(d => d.received);
    const spent = data.value.monthlyData.map(d => d.spent);

    return {
        labels: months,
        datasets: [
            {
                label: 'Tổng Thu',
                backgroundColor: '#10b981', // emerald-500
                data: received
            },
            {
                label: 'Tổng Chi',
                backgroundColor: '#ef4444', // red-500
                data: spent
            }
        ]
    };
});

const monthlyChartOptions = computed(() => {
    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: { labels: { color: textColor.value } },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: textColorSecondary.value, font: { weight: 500 } },
                grid: { display: false, drawBorder: false }
            },
            y: {
                ticks: { color: textColorSecondary.value },
                grid: { color: surfaceBorder.value, drawBorder: false }
            }
        }
    }
});

// Profit Line Chart
const profitChartData = computed(() => {
    const months = data.value.monthlyData.map(d => `Tháng ${d.month}`);
    const profits = data.value.monthlyData.map(d => d.received - d.spent);

    return {
        labels: months,
        datasets: [
            {
                label: 'Lợi Nhuận Gộp',
                data: profits,
                fill: true,
                borderColor: '#6366f1', // indigo-500
                tension: 0.4,
                backgroundColor: 'rgba(99, 102, 241, 0.2)'
            }
        ]
    };
});

const profitChartOptions = computed(() => {
    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: { labels: { color: textColor.value } },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return formatCurrency(context.parsed.y);
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: textColorSecondary.value },
                grid: { display: false, drawBorder: false }
            },
            y: {
                ticks: { color: textColorSecondary.value },
                grid: { color: surfaceBorder.value, drawBorder: false }
            }
        }
    }
});
</script>
