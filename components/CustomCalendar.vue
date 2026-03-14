<template>
  <Calendar
    ref="calRef"
    v-bind="$attrs"
    :modelValue="modelValue"
    :selectionMode="selectionMode"
    @update:modelValue="$emit('update:modelValue', $event)"
    @clear-click="$emit('clear-click', $event)"
  >
    <template #footer>
      <div class="flex flex-wrap gap-1 p-2 pt-2 border-t border-slate-100">
        <button
          v-for="preset in computedPresets"
          :key="preset.label"
          type="button"
          class="px-2 py-1 text-xs rounded-md cursor-pointer border transition-colors font-medium"
          :class="isActive(preset)
            ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
            : 'bg-slate-50 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 text-slate-600 border-slate-200'"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </template>
  </Calendar>
</template>

<script setup>
import { ref, computed } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { default: null },
  selectionMode: { type: String, default: 'single' },
});

const emit = defineEmits(['update:modelValue', 'clear-click']);

const calRef = ref(null);

const startOfDay = (d) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

const today = () => startOfDay(new Date());

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
};

const getMonday = (offset = 0) => {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + 1 + offset * 7);
  return startOfDay(mon);
};

const rangePresets = [
  {
    label: 'Hôm nay',
    getValue: () => { const d = today(); return [d, new Date(d)]; },
    isActive: (v) => v?.length === 2 && isSameDay(v[0], today()) && isSameDay(v[1], today()),
  },
  {
    label: 'Tuần này',
    getValue: () => {
      const mon = getMonday(0);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return [mon, sun];
    },
    isActive: (v) => {
      if (!v?.length) return false;
      const mon = getMonday(0);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return isSameDay(v[0], mon) && isSameDay(v[1], sun);
    },
  },
  {
    label: 'Tuần trước',
    getValue: () => {
      const mon = getMonday(-1);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return [mon, sun];
    },
    isActive: (v) => {
      if (!v?.length) return false;
      const mon = getMonday(-1);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return isSameDay(v[0], mon) && isSameDay(v[1], sun);
    },
  },
  {
    label: 'Tháng này',
    getValue: () => {
      const now = new Date();
      return [
        new Date(now.getFullYear(), now.getMonth(), 1),
        new Date(now.getFullYear(), now.getMonth() + 1, 0),
      ];
    },
    isActive: (v) => {
      if (!v?.length) return false;
      const now = new Date();
      return isSameDay(v[0], new Date(now.getFullYear(), now.getMonth(), 1)) &&
        isSameDay(v[1], new Date(now.getFullYear(), now.getMonth() + 1, 0));
    },
  },
  {
    label: 'Tháng trước',
    getValue: () => {
      const now = new Date();
      return [
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
        new Date(now.getFullYear(), now.getMonth(), 0),
      ];
    },
    isActive: (v) => {
      if (!v?.length) return false;
      const now = new Date();
      return isSameDay(v[0], new Date(now.getFullYear(), now.getMonth() - 1, 1)) &&
        isSameDay(v[1], new Date(now.getFullYear(), now.getMonth(), 0));
    },
  },
  {
    label: 'Năm nay',
    getValue: () => {
      const y = new Date().getFullYear();
      return [new Date(y, 0, 1), new Date(y, 11, 31)];
    },
    isActive: (v) => {
      if (!v?.length) return false;
      const y = new Date().getFullYear();
      return isSameDay(v[0], new Date(y, 0, 1)) && isSameDay(v[1], new Date(y, 11, 31));
    },
  },
  {
    label: 'Năm trước',
    getValue: () => {
      const y = new Date().getFullYear() - 1;
      return [new Date(y, 0, 1), new Date(y, 11, 31)];
    },
    isActive: (v) => {
      if (!v?.length) return false;
      const y = new Date().getFullYear() - 1;
      return isSameDay(v[0], new Date(y, 0, 1)) && isSameDay(v[1], new Date(y, 11, 31));
    },
  },
];

const singlePresets = [
  {
    label: 'Hôm nay',
    getValue: () => today(),
    isActive: (v) => v && isSameDay(v, today()),
  },
  {
    label: 'Đầu tuần',
    getValue: () => getMonday(0),
    isActive: (v) => v && isSameDay(v, getMonday(0)),
  },
  {
    label: 'Đầu tháng',
    getValue: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    },
    isActive: (v) => {
      if (!v) return false;
      const now = new Date();
      return isSameDay(v, new Date(now.getFullYear(), now.getMonth(), 1));
    },
  },
  {
    label: 'Cuối tháng',
    getValue: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    },
    isActive: (v) => {
      if (!v) return false;
      const now = new Date();
      return isSameDay(v, new Date(now.getFullYear(), now.getMonth() + 1, 0));
    },
  },
];

const computedPresets = computed(() =>
  props.selectionMode === 'range' ? rangePresets : singlePresets
);

const isActive = (preset) => {
  const v = props.modelValue;
  if (!v || !preset.isActive) return false;
  return preset.isActive(Array.isArray(v) ? v : v);
};

const applyPreset = (preset) => {
  emit('update:modelValue', preset.getValue());
  if (props.selectionMode !== 'range') {
    calRef.value?.hide?.();
  }
};
</script>
