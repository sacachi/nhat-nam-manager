<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div class="relative w-full sm:w-64">
            <IconField iconPosition="left">
                <InputIcon class="pi pi-search"> </InputIcon>
                <InputText v-model="searchQuery" placeholder="Tìm kiếm hành động..." class="w-full pl-10" />
            </IconField>
          </div>
          <Dropdown v-model="selectedAction" :options="actions" optionLabel="label" optionValue="value" placeholder="Lọc theo hành động" class="w-full sm:w-48" showClear />
          <CustomCalendar v-model="filterDate" selectionMode="range" :manualInput="false" placeholder="Lọc theo ngày tháng" dateFormat="dd/mm/yy" class="w-full sm:w-64" showClear />
      </div>

    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredLogs" paginator :rows="15" :rowsPerPageOptions="[15, 30, 50]" 
        responsiveLayout="scroll" class="p-datatable-sm" hoverRole stripedRows emptyMessage="Không tìm thấy lịch sử nào.">
        
        <Column field="created_at" header="Thời gian" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="text-slate-500 font-mono text-sm">{{ formatDateTime(data.created_at) }}</span>
          </template>
        </Column>

        <Column field="user_name" header="Người thực hiện" sortable style="min-width: 12rem">
          <template #body="{ data }">
             <div class="flex items-center gap-2">
                 <i class="pi pi-user text-slate-400"></i>
                 <span class="font-medium text-slate-700">{{ data.user_name || data.user_id }}</span>
             </div>
          </template>
        </Column>

        <Column field="action" header="Hành động" sortable style="min-width: 10rem">
          <template #body="{ data }">
             <Tag :severity="getActionSeverity(data.action)" :value="data.action.toUpperCase()"></Tag>
          </template>
        </Column>

        <Column field="entity" header="Thực thể (Bảng)" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600 font-medium">{{ data.entity }}</span>
          </template>
        </Column>

        <Column header="Chi tiết" :exportable="false" style="min-width: 8rem">
            <template #body="{ data }">
                <Button icon="pi pi-eye" outlined rounded severity="secondary" size="small" @click="viewLogDetails(data)" />
            </template>
        </Column>
      </DataTable>
    </div>

    <!-- Detail Dialog -->
    <Dialog v-model:visible="logDialog" :style="{ width: '550px' }" header="Chi Tiết Biến Động" :modal="true" class="p-fluid">
       <div class="flex flex-col gap-4 mt-4" v-if="selectedLog">
           <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <p><strong>Thời gian:</strong> {{ formatDateTime(selectedLog.created_at) }}</p>
             <p><strong>Bởi:</strong> {{ selectedLog.user_name || selectedLog.user_id }}</p>
                <p><strong>Hành động:</strong> <Tag :severity="getActionSeverity(selectedLog.action)" :value="selectedLog.action"></Tag> trên <b>{{ selectedLog.entity }}</b> (ID: {{ selectedLog.entity_id }})</p>
           </div>
           
           <div v-if="selectedLog.old_data" class="flex flex-col gap-2">
               <span class="font-bold text-red-600 text-sm"><i class="pi pi-minus-circle mr-1"></i>Dữ liệu TỪ (Cũ):</span>
               <pre class="bg-surface-800 text-green-400 p-3 rounded overflow-x-auto text-xs font-mono">{{ formatJson(selectedLog.old_data) }}</pre>
           </div>

           <div v-if="selectedLog.new_data" class="flex flex-col gap-2">
               <span class="font-bold text-green-600 text-sm"><i class="pi pi-plus-circle mr-1"></i>Dữ liệu THÀNH (Mới):</span>
               <pre class="bg-surface-800 text-green-400 p-3 rounded overflow-x-auto text-xs font-mono">{{ formatJson(selectedLog.new_data) }}</pre>
           </div>
       </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const selectedAction = ref(null);
const filterDate = ref(null);
const logDialog = ref(false);
const selectedLog = ref(null);

const actions = ref([
    { label: 'Thêm mới (CREATE)', value: 'create' },
    { label: 'Cập nhật (UPDATE)', value: 'update' },
    { label: 'Xóa (DELETE)', value: 'delete' }
]);

// Fetch Data from Server
const { data: logs, refresh } = await useFetch('/api/logs', { default: () => [] });

const filteredLogs = computed(() => {
    let result = logs.value;
    
    if (selectedAction.value) {
        result = result.filter(r => r.action === selectedAction.value);
    }
    
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(r => 
            r.entity.toLowerCase().includes(query) || 
        (r.user_name || r.user_id).toLowerCase().includes(query)
        );
    }

    // Filter by Date Range
    if (filterDate.value && filterDate.value.length === 2 && filterDate.value[0]) {
        const start = new Date(filterDate.value[0]);
        start.setHours(0, 0, 0, 0);
        
        let end = filterDate.value[1] ? new Date(filterDate.value[1]) : new Date(filterDate.value[0]);
        end.setHours(23, 59, 59, 999);

        result = result.filter(r => {
            const rDate = new Date(r.created_at);
            return rDate >= start && rDate <= end;
        });
    }

    // Sort by Date DESC
    return result.sort((a,b) => b.created_at - a.created_at);
});

const getActionSeverity = (action) => {
    switch(action) {
        case 'create': return 'success';
        case 'update': return 'info';
        case 'delete': return 'danger';
        default: return 'secondary';
    }
}

const formatDateTime = (value) => {
    return value ? new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(value)) : '';
};

const formatJson = (jsonString) => {
    try {
        return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch (e) {
        return jsonString; // Fallback to raw string if invalid JSON
    }
}

const viewLogDetails = (data) => {
    selectedLog.value = data;
    logDialog.value = true;
}
</script>
