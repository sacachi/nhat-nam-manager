<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold text-slate-800">Báo Cáo Hiệu Suất</h1>
      <div class="flex gap-2">
        <Calendar v-model="dateRange" selectionMode="range" :manualInput="false" dateFormat="dd/mm/yy" placeholder="Chọn khoảng thời gian" showClear />
        <Button icon="pi pi-file-excel" label="Xuất Excel" severity="success" @click="exportExcel" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-slate-400"></i>
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <p class="text-sm text-slate-500 mb-1">Tổng nhân viên</p>
          <h3 class="text-2xl font-bold text-slate-800">{{ data.summary.total_users }}</h3>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <p class="text-sm text-slate-500 mb-1">Điểm TB</p>
          <h3 class="text-2xl font-bold text-slate-800">{{ data.summary.avg_score }}</h3>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <p class="text-sm text-slate-500 mb-1">Xuất sắc (A+)</p>
          <h3 class="text-2xl font-bold text-green-600">{{ data.summary.grade_distribution['A+'] }}</h3>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <p class="text-sm text-slate-500 mb-1">Cần cải thiện (D)</p>
          <h3 class="text-2xl font-bold text-red-600">{{ data.summary.grade_distribution['D'] }}</h3>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 class="font-bold text-slate-800 mb-4">Xếp hạng</h3>
          <div class="flex gap-2 mb-4">
            <Button v-for="role in ['Sale', 'Design', 'Construction', 'All']" :key="role"
              :label="role" :severity="activeTab === role ? 'primary' : 'secondary'" 
              :outlined="activeTab !== role" size="small" @click="activeTab = role" />
          </div>
          
          <DataTable :value="currentLeaderboard" class="p-datatable-sm" stripedRows>
            <Column header="Hạng" style="width: 4rem">
              <template #body="{ data }">
                <span class="font-bold" :class="getRankClass(data.rank)">{{ data.rank }}</span>
              </template>
            </Column>
            <Column field="user_name" header="Nhân viên">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                    {{ data.user_name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-medium">{{ data.user_name }}</p>
                    <p class="text-xs text-slate-500">{{ data.role }}</p>
                  </div>
                </div>
              </template>
            </Column>
            <Column field="score" header="Điểm" style="width: 6rem">
              <template #body="{ data }">
                <span class="font-bold">{{ data.score }}</span>
              </template>
            </Column>
            <Column header="Grade" style="width: 5rem">
              <template #body="{ data }">
                <Tag :severity="getGradeSeverity(data.grade)" :value="data.grade" />
              </template>
            </Column>
            <Column header="Xu hướng" style="width: 6rem">
              <template #body="{ data }">
                <span v-if="data.trend === 'up'" class="text-green-600"><i class="pi pi-arrow-up"></i></span>
                <span v-else-if="data.trend === 'down'" class="text-red-600"><i class="pi pi-arrow-down"></i></span>
                <span v-else class="text-slate-400">—</span>
              </template>
            </Column>
            <Column header="" style="width: 4rem">
              <template #body="{ data }">
                <Button icon="pi pi-eye" text size="small" @click="viewDetail(data.user_id)" />
              </template>
            </Column>
          </DataTable>
        </div>

        <div class="space-y-4">
          <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 class="font-bold text-slate-800 mb-3">Top performers</h3>
            <div class="space-y-2">
              <div v-for="(user, idx) in data.top_performers" :key="user.user_id"
                   class="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <span class="font-bold text-green-600">#{{ idx + 1 }}</span>
                <div class="flex-1">
                  <p class="font-medium text-sm">{{ user.user_name }}</p>
                  <p class="text-xs text-slate-500">{{ user.role }}</p>
                </div>
                <Tag :severity="getGradeSeverity(user.grade)" :value="user.grade" />
              </div>
              <p v-if="data.top_performers.length === 0" class="text-slate-400 text-sm">Chưa có dữ liệu</p>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 class="font-bold text-slate-800 mb-3">Cần chú ý</h3>
            <div class="space-y-2">
              <div v-for="user in data.needs_attention" :key="user.user_id"
                   class="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <span class="text-red-600"><i class="pi pi-exclamation-triangle"></i></span>
                <div class="flex-1">
                  <p class="font-medium text-sm">{{ user.user_name }}</p>
                  <p class="text-xs text-slate-500">{{ user.role }}</p>
                </div>
                <Tag :severity="getGradeSeverity(user.grade)" :value="user.grade" />
              </div>
              <p v-if="data.needs_attention.length === 0" class="text-slate-400 text-sm">Không có</p>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 class="font-bold text-slate-800 mb-3">Phân bố điểm</h3>
            <div class="space-y-2">
              <div v-for="(count, grade) in data.summary.grade_distribution" :key="grade"
                   class="flex items-center gap-2">
                <span class="w-8 text-sm font-medium">{{ grade }}</span>
                <div class="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div class="h-full bg-primary-500 rounded-full" 
                       :style="{ width: (count / data.summary.total_users * 100) + '%' }"></div>
                </div>
                <span class="w-6 text-sm text-slate-500 text-right">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog v-model:visible="detailDialog" :style="{ width: '700px' }" header="Chi tiết hiệu suất" :modal="true">
        <div v-if="selectedUser" class="space-y-4">
          <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
              {{ selectedUser.user?.name?.charAt(0) }}
            </div>
            <div>
              <h3 class="text-xl font-bold">{{ selectedUser.user?.name }}</h3>
              <p class="text-slate-500">{{ selectedUser.user?.role }}</p>
            </div>
            <div class="ml-auto text-right">
              <div class="text-4xl font-bold text-primary-600">{{ selectedUser.score }}</div>
              <Tag :severity="getGradeSeverity(selectedUser.grade)" :value="selectedUser.grade" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div v-for="(value, key) in selectedUser.metrics" :key="key" class="p-3 bg-slate-50 rounded-lg">
              <p class="text-sm text-slate-500">{{ formatMetricKey(key) }}</p>
              <p class="text-xl font-bold">{{ formatMetricValue(key, value) }}</p>
            </div>
          </div>
        </div>
      </Dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const data = ref(null)
const activeTab = ref('All')
const dateRange = ref(null)
const detailDialog = ref(false)
const selectedUser = ref(null)

const { data: performanceData, refresh } = await useFetch('/api/performance', {
  default: () => null,
  query: computed(() => ({
    from: dateRange.value?.[0]?.toISOString(),
    to: dateRange.value?.[1]?.toISOString()
  }))
})

watch(performanceData, (newData) => {
  data.value = newData
}, { immediate: true })

const currentLeaderboard = computed(() => {
  if (!data.value) return []
  if (activeTab.value === 'All') return data.value.all
  return data.value.by_role[activeTab.value] || []
})

const getRankClass = (rank) => {
  if (rank === 1) return 'text-yellow-500'
  if (rank === 2) return 'text-slate-400'
  if (rank === 3) return 'text-amber-600'
  return 'text-slate-600'
}

const getGradeSeverity = (grade) => {
  if (grade === 'A+' || grade === 'A') return 'success'
  if (grade === 'B+' || grade === 'B') return 'info'
  if (grade === 'C') return 'warn'
  return 'danger'
}

const formatMetricKey = (key) => {
  const map = {
    leads_created: 'Leads đã tạo',
    leads_converted: 'Leads chuyển đổi',
    conversion_rate: 'Tỷ lệ chuyển đổi',
    total_contract_value: 'Giá trị HĐ',
    avg_days_to_convert: 'TB ngày chuyển đổi',
    tasks_assigned: 'Tasks được gán',
    tasks_completed: 'Tasks hoàn thành',
    tasks_on_time: 'Tasks đúng hạn',
    on_time_rate: 'Tỷ lệ đúng hạn',
    overdue_tasks: 'Tasks quá hạn',
    revision_count: 'Số lần sửa TK'
  }
  return map[key] || key
}

const formatMetricValue = (key, value) => {
  if (key === 'total_contract_value') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
  }
  if (typeof value === 'number') {
    if (key.includes('rate') || key.includes('rate')) return value.toFixed(1) + '%'
    return value
  }
  return value
}

const viewDetail = async (userId) => {
  try {
    selectedUser.value = await $fetch(`/api/performance/${userId}`)
    detailDialog.value = true
  } catch (e) {
    console.error(e)
  }
}

const exportExcel = async () => {
  if (!data.value) return
  
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  
  for (const role of ['Sale', 'Design', 'Construction']) {
    const roleData = data.value.by_role[role]
    if (!roleData || roleData.length === 0) continue
    
    const rows = roleData.map((p, i) => ({
      'Hạng': i + 1,
      'Họ tên': p.user_name,
      'Điểm': p.score,
      'Grade': p.grade,
      'Xu hướng': p.trend
    }))
    
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, role)
  }
  
  const filename = `hieu-suat-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, filename)
}
</script>
