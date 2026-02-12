<template>
    <transition name="context-menu-anim">
        <div
            v-if="visible"
            class="dropdown"
            :style="{ top: y + 'px', left: x + 'px' }"
            @click.stop
            ref="dropdownElement"
        >
            <div
                v-for="(item, index) in items"
                :key="index"
                class="dropdown-item"
                :class="{ danger: item.isDanger }"
                @click="selectItem(item.value)"
            >
                {{ item.label }}
            </div>
        </div>
    </transition>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';
import type { DropdownItem } from '@/types/global.d';

const props = defineProps<{
    visible: boolean;
    x: number;
    y: number;
    items: DropdownItem[];
    triggerRef?: HTMLElement | null;
}>();

const emit = defineEmits<{
    (e: 'select', value: string): void;
    (e: 'close'): void;
}>();

const dropdownElement = ref<HTMLElement | null>(null);

const selectItem = (value: string) => {
    emit('select', value);
    emit('close');
};

const handleClickOutside = (event: MouseEvent) => {
    if (props.visible) {
        const target = event.target as Node;

        const clickedOutsideDropdown =
            dropdownElement.value && !dropdownElement.value.contains(target);

        const clickedOutsideTrigger =
            props.triggerRef && !props.triggerRef.contains(target);

        if (clickedOutsideDropdown && clickedOutsideTrigger) {
            emit('close');
        }
    }
};

watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            window.addEventListener('mousedown', handleClickOutside);
        } else {
            window.removeEventListener('mousedown', handleClickOutside);
        }
    },
    { immediate: true }
);

onUnmounted(() => {
    window.removeEventListener('mousedown', handleClickOutside);
});
</script>

<style scoped>
.dropdown {
    position: fixed;
    background-color: #2c2c2c;
    border: 1px solid #555;
    border-radius: 5px;
    min-width: 180px;
    z-index: 10001;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    color: #e0e0e0;
    font-size: 14px;
    padding: 5px 0;
    transform-origin: top left;
}
.dropdown .dropdown-item {
    padding: 8px 12px;
    cursor: pointer;
}
.dropdown .dropdown-item:hover {
    background-color: #7be141;
    color: #1a1a1a;
}
.dropdown-item.danger {
    color: #ff5555;
}
.dropdown-item.danger:hover {
    background-color: #ff5555;
    color: #1a1a1a;
}

.context-menu-anim-enter-active,
.context-menu-anim-leave-active {
    transition: transform 0.15s ease, opacity 0.15s ease;
}
.context-menu-anim-enter-from,
.context-menu-anim-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>
