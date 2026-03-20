<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="relative w-full sm:w-64">
        <IconField iconPosition="left">
            <InputIcon class="pi pi-search"> </InputIcon>
            <InputText v-model="searchQuery" placeholder="Tìm kiếm khách hàng..." class="w-full pl-10" />
        </IconField>
      </div>
      <Button icon="pi pi-user-plus" label="Thêm Khách Hàng" class="w-full sm:w-auto p-button-primary shadow-sm" @click="openNew" />
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredCustomers" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" 
        responsiveLayout="scroll" class="p-datatable-sm" stripedRows emptyMessage="Không tìm thấy khách hàng nào.">
        
        <Column field="name" header="Tên khách hàng" sortable style="min-width: 14rem">
          <template #body="{ data }">
             <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                    {{ data.name.charAt(0).toUpperCase() }}
                </div>
                <span class="font-medium text-slate-800">{{ data.name }}</span>
             </div>
          </template>
        </Column>

        <Column field="phone" header="Số điện thoại" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <div v-if="isPhoneMasked(data.phone)" class="flex items-center gap-2 text-slate-400 italic">
              <i class="pi pi-lock"></i>
              <span>Không có quyền xem</span>
            </div>
            <span v-else class="text-slate-600">{{ data.phone || '—' }}</span>
          </template>
        </Column>

        <Column field="email" header="Email" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ data.email || '—' }}</span>
          </template>
        </Column>

        <Column field="address" header="Địa chỉ" style="min-width: 14rem">
          <template #body="{ data }">
            <span class="text-slate-500 text-sm">{{ data.address || '—' }}</span>
          </template>
        </Column>

        <Column header="Thao tác" :exportable="false" style="min-width: 8rem">
            <template #body="{ data }">
                <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2" @click="editCustomer(data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(data)" />
            </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="customerDialog" :style="{ width: '500px' }" :header="dialogTitle" :modal="true" class="p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
            <label for="name" class="font-medium text-slate-700">Tên khách hàng *</label>
            <InputText id="name" v-model.trim="customer.name" required="true" :invalid="submitted && !customer.name" />
            <small class="p-error text-red-500" v-if="submitted && !customer.name">Tên khách hàng là bắt buộc.</small>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
                <label for="phone" class="font-medium text-slate-700">Số điện thoại</label>
                <InputText id="phone" v-model.trim="customer.phone" />
            </div>
            <div class="flex flex-col gap-1">
                <label for="email" class="font-medium text-slate-700">Email</label>
                <InputText id="email" type="email" v-model.trim="customer.email" />
            </div>
        </div>

        <div class="flex flex-col gap-1">
            <label for="address" class="font-medium text-slate-700">Địa chỉ</label>
            <InputText id="address" v-model.trim="customer.address" />
        </div>

         <div class="flex flex-col gap-1">
             <label for="note" class="font-medium text-slate-700">Ghi chú</label>
             <Textarea id="note" v-model="customer.note" rows="2" />
         </div>
      </div>

      <template #footer>
          <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" class="text-slate-600" />
          <Button label="Lưu" icon="pi pi-check" :loading="loading" @click="saveCustomer" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const { user: currentUser } = useAuth()

const searchQuery = ref('');
const loading = ref(false);
const submitted = ref(false);
const customerDialog = ref(false);
const dialogTitle = ref('Khách hàng');

const isPhoneMasked = (phone) => {
  return phone && phone.includes('*')
}

const emptyCustomer = { id: null, name: '', phone: '', email: '', address: '', note: '' };
const customer = ref({ ...emptyCustomer });

// Fetch Data
const { data: customers, refresh } = await useFetch('/api/customers', { default: () => [] });

const filteredCustomers = computed(() => {
    if (!searchQuery.value) return customers.value;
    const q = searchQuery.value.toLowerCase();
    return customers.value.filter(c => 
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
});

const openNew = () => {
    customer.value = { ...emptyCustomer };
    submitted.value = false;
    dialogTitle.value = 'Thêm Khách Hàng Mới';
    customerDialog.value = true;
};

const hideDialog = () => {
    customerDialog.value = false;
    submitted.value = false;
};

const editCustomer = (data) => {
    customer.value = { ...data };
    dialogTitle.value = 'Sửa Thông Tin Khách Hàng';
    customerDialog.value = true;
};

const confirmDelete = async (data) => {
    if (confirm(`Bạn có chắc chắn muốn xóa khách hàng "${data.name}"?`)) {
        try {
            await $fetch(`/api/customers/${data.id}`, { method: 'DELETE' });
            await refresh();
        } catch (e) {
            console.error("Lỗi khi xóa:", e);
        }
    }
};

const saveCustomer = async () => {
    submitted.value = true;
    if (customer.value.name?.trim()) {
        loading.value = true;
        try {
            if (customer.value.id) {
                await $fetch(`/api/customers/${customer.value.id}`, { method: 'PUT', body: customer.value });
            } else {
                await $fetch('/api/customers', { method: 'POST', body: customer.value });
            }
            await refresh();
            customerDialog.value = false;
            customer.value = { ...emptyCustomer };
        } catch (e) {
            console.error("Lỗi khi lưu:", e);
        } finally {
            loading.value = false;
        }
    }
};
</script>
