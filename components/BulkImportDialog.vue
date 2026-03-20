<template>
  <Dialog v-model:visible="visible" :style="{ width: '95vw', maxWidth: '1200px' }" :header="'Thêm hàng loạt: ' + entityLabel" :modal="true" :closable="!importing" class="p-fluid">
    <!-- Step 1: Upload Excel -->
    <div v-if="rows.length === 0" class="flex flex-col items-center gap-6 py-8">
      <div class="text-center">
        <i class="pi pi-file-excel text-5xl text-green-500 mb-3"></i>
        <p class="text-slate-600 text-lg mb-1">Tải lên file Excel (.xlsx, .xls)</p>
        <p class="text-slate-400 text-sm">Hàng đầu tiên trong file sẽ là tiêu đề cột</p>
      </div>

      <div class="flex flex-col items-center gap-3 w-full max-w-md">
        <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileSelected" />
        <Button icon="pi pi-upload" label="Chọn file Excel" class="w-full" severity="success" @click="$refs.fileInput.click()" />

        <div class="w-full border-t border-slate-200 my-2"></div>

        <Button icon="pi pi-download" label="Tải file mẫu" class="w-full" severity="secondary" outlined @click="downloadTemplate" />
      </div>

      <small v-if="uploadError" class="text-red-500">{{ uploadError }}</small>
    </div>

    <!-- Step 2: Edit Table -->
    <div v-else>
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2">
          <Tag severity="info" :value="`${rows.length} dòng`" />
          <Tag v-if="successCount > 0" severity="success" :value="`${successCount} thành công`" />
          <Tag v-if="errorCount > 0" severity="danger" :value="`${errorCount} lỗi`" />
        </div>
        <div class="flex items-center gap-2">
          <Button v-if="successCount > 0" icon="pi pi-check-circle" label="Xóa dòng thành công" severity="success" outlined size="small" @click="removeSuccessRows" />
          <Button icon="pi pi-plus" label="Thêm dòng" severity="secondary" outlined size="small" @click="addEmptyRow" :disabled="importing" />
          <Button icon="pi pi-trash" label="Xóa tất cả" severity="danger" outlined size="small" @click="clearAll" :disabled="importing" />
          <Button icon="pi pi-times" label="Đổi file" severity="secondary" text size="small" @click="resetFile" :disabled="importing" />
        </div>
      </div>

      <!-- Editable Table -->
      <div class="border border-slate-200 rounded-lg overflow-auto" style="max-height: 55vh">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th class="px-3 py-2 text-left text-slate-600 font-medium w-10">#</th>
              <th v-for="col in columns" :key="col.field" class="px-3 py-2 text-left text-slate-600 font-medium" :style="{ minWidth: col.width || '120px' }">
                {{ col.header }} <span v-if="col.required" class="text-red-500">*</span>
              </th>
              <th class="px-3 py-2 text-center text-slate-600 font-medium w-32">Trạng thái</th>
              <th class="px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in rows" :key="row._uid" class="border-t border-slate-100 hover:bg-slate-50/50" :class="getRowClass(row)">
              <td class="px-3 py-1.5 text-slate-400 text-xs">{{ idx + 1 }}</td>
              <td v-for="col in columns" :key="col.field" class="px-3 py-1.5">
                <!-- Dropdown type -->
                <select v-if="col.type === 'select'" v-model="row[col.field]" :disabled="row._status === 'success' || importing"
                  class="w-full border border-slate-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-500">
                  <option value="">-- Chọn --</option>
                  <option v-for="opt in col.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <!-- Number type -->
                <input v-else-if="col.type === 'number'" type="number" v-model.number="row[col.field]" :disabled="row._status === 'success' || importing"
                  class="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-500" />
                <!-- Text (default) -->
                <input v-else type="text" v-model.trim="row[col.field]" :disabled="row._status === 'success' || importing"
                  :placeholder="col.placeholder || ''"
                  class="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-500" />
              </td>
              <td class="px-3 py-1.5 text-center">
                <Tag v-if="row._status === 'success'" severity="success" value="OK" />
                <Tag v-else-if="row._status === 'error'" severity="danger" :value="'Lỗi'" v-tooltip.top="row._error" />
                <i v-else-if="row._status === 'importing'" class="pi pi-spin pi-spinner text-primary-500"></i>
                <span v-else class="text-slate-300 text-xs">Chờ</span>
              </td>
              <td class="px-3 py-1.5 text-center">
                <button @click="removeRow(idx)" :disabled="importing" class="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
                  <i class="pi pi-times text-xs"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Error details -->
      <div v-if="errorCount > 0 && !importing" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700 text-sm font-medium mb-1">Các dòng lỗi:</p>
        <ul class="text-red-600 text-xs space-y-0.5">
          <li v-for="row in errorRows" :key="row._uid">
            Dòng {{ rows.indexOf(row) + 1 }}: {{ row._error }}
          </li>
        </ul>
      </div>
    </div>

    <template #footer v-if="rows.length > 0">
      <div class="flex items-center justify-between w-full">
        <ProgressBar v-if="importing" :value="importProgress" :style="{ width: '200px', height: '8px' }" />
        <span v-else></span>
        <div class="flex items-center gap-2">
          <Button label="Đóng" icon="pi pi-times" text @click="closeDialog" :disabled="importing" class="text-slate-600" />
          <Button :label="importing ? `Đang import (${importedCount}/${totalToImport})...` : 'Import tất cả'" icon="pi pi-check" :loading="importing" @click="startImport" :disabled="importing || pendingRows.length === 0" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import * as XLSX from 'xlsx'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  entityLabel: { type: String, required: true },
  apiEndpoint: { type: String, required: true },
  columns: { type: Array, required: true },
  // columns: [{ field, header, required, type: 'text'|'number'|'select', options, width, placeholder, excelField }]
  buildPayload: { type: Function, default: null }
})

const emit = defineEmits(['update:modelValue', 'imported'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const fileInput = ref(null)
const uploadError = ref('')
const rows = ref([])
const importing = ref(false)
const importedCount = ref(0)
const totalToImport = ref(0)

let uidCounter = 0
const genUid = () => ++uidCounter

const successCount = computed(() => rows.value.filter(r => r._status === 'success').length)
const errorCount = computed(() => rows.value.filter(r => r._status === 'error').length)
const errorRows = computed(() => rows.value.filter(r => r._status === 'error'))
const pendingRows = computed(() => rows.value.filter(r => r._status !== 'success'))

const importProgress = computed(() => {
  if (totalToImport.value === 0) return 0
  return Math.round((importedCount.value / totalToImport.value) * 100)
})

const getRowClass = (row) => {
  if (row._status === 'success') return 'bg-green-50/50'
  if (row._status === 'error') return 'bg-red-50/50'
  if (row._status === 'importing') return 'bg-blue-50/50'
  return ''
}

const createEmptyRow = () => {
  const row = { _uid: genUid(), _status: null, _error: '' }
  for (const col of props.columns) {
    row[col.field] = col.type === 'number' ? 0 : ''
  }
  return row
}

const addEmptyRow = () => {
  rows.value.push(createEmptyRow())
}

const removeRow = (idx) => {
  rows.value.splice(idx, 1)
}

const removeSuccessRows = () => {
  rows.value = rows.value.filter(r => r._status !== 'success')
}

const clearAll = () => {
  rows.value = []
}

const resetFile = () => {
  rows.value = []
  uploadError.value = ''
}

const closeDialog = () => {
  if (importing.value) return
  if (successCount.value > 0) {
    emit('imported')
  }
  rows.value = []
  uploadError.value = ''
  visible.value = false
}

// Excel mapping: find matching column by excelField or header
const mapExcelHeader = (excelHeader) => {
  const normalized = excelHeader.trim().toLowerCase()
  for (const col of props.columns) {
    // Check excelField aliases
    if (col.excelFields) {
      for (const alias of col.excelFields) {
        if (alias.toLowerCase() === normalized) return col.field
      }
    }
    // Check header
    if (col.header.toLowerCase() === normalized) return col.field
    // Check field
    if (col.field.toLowerCase() === normalized) return col.field
  }
  return null
}

const onFileSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  uploadError.value = ''

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (jsonData.length === 0) {
      uploadError.value = 'File Excel không có dữ liệu.'
      return
    }

    // Map Excel headers to our column fields
    const excelHeaders = Object.keys(jsonData[0])
    const headerMap = {}
    for (const eh of excelHeaders) {
      const mapped = mapExcelHeader(eh)
      if (mapped) headerMap[eh] = mapped
    }

    rows.value = jsonData.map(excelRow => {
      const row = createEmptyRow()
      for (const [excelKey, field] of Object.entries(headerMap)) {
        const col = props.columns.find(c => c.field === field)
        const val = excelRow[excelKey]
        if (col?.type === 'number') {
          row[field] = Number(val) || 0
        } else {
          row[field] = val != null ? String(val).trim() : ''
        }
      }
      return row
    })
  } catch (e) {
    uploadError.value = 'Không thể đọc file. Vui lòng kiểm tra lại định dạng.'
  }

  // Reset file input
  event.target.value = ''
}

const downloadTemplate = () => {
  const headers = {}
  for (const col of props.columns) {
    headers[col.header] = col.type === 'number' ? 0 : ''
  }
  const ws = XLSX.utils.json_to_sheet([headers])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, `mau_${props.apiEndpoint.replace(/\//g, '_').replace(/^_api_/, '')}.xlsx`)
}

const startImport = async () => {
  const toImport = rows.value.filter(r => r._status !== 'success')
  if (toImport.length === 0) return

  importing.value = true
  importedCount.value = 0
  totalToImport.value = toImport.length

  // Reset error statuses
  for (const row of toImport) {
    row._status = null
    row._error = ''
  }

  for (const row of toImport) {
    row._status = 'importing'
    try {
      const payload = props.buildPayload ? props.buildPayload(row) : buildDefaultPayload(row)
      await $fetch(props.apiEndpoint, { method: 'POST', body: payload })
      row._status = 'success'
      row._error = ''
    } catch (e) {
      row._status = 'error'
      row._error = e?.data?.message || e?.data?.statusMessage || e?.message || 'Lỗi không xác định'
    }
    importedCount.value++
  }

  importing.value = false
}

const buildDefaultPayload = (row) => {
  const payload = {}
  for (const col of props.columns) {
    if (row[col.field] !== '' && row[col.field] !== null && row[col.field] !== undefined) {
      payload[col.field] = row[col.field]
    }
  }
  return payload
}
</script>
