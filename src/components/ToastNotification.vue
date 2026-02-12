<template>
    <transition-group name="toast-slide" tag="div" class="toast-container">
        <div
            v-for="toast in toasts"
            :key="toast.id"
            class="toast"
            :class="['toast-' + toast.type]"
            @click="removeToast(toast.id)"
        >
            <div class="toast-icon">
                <span v-if="toast.type === 'success'">✓</span>
                <span v-else-if="toast.type === 'error'">✕</span>
                <span v-else-if="toast.type === 'warning'">⚠</span>
                <span v-else>ℹ</span>
            </div>
            <div class="toast-message">{{ toast.message }}</div>
            <button class="toast-close" @click.stop="removeToast(toast.id)">
                ×
            </button>
        </div>
    </transition-group>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

const addToast = (
    message: string,
    type: Toast['type'] = 'info',
    duration = 5000
) => {
    const id = toastId++;
    const toast: Toast = { id, message, type, duration };
    toasts.value.push(toast);

    if (duration > 0) {
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }
};

const removeToast = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
        toasts.value.splice(index, 1);
    }
};

defineExpose({ addToast, removeToast });
</script>

<style scoped>
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
}

.toast {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 500px;
    padding: 12px 16px;
    background-color: #2c2c2c;
    border-left: 4px solid;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    pointer-events: all;
    transition: all 0.3s ease;
}

.toast:hover {
    transform: translateX(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.toast-success {
    border-left-color: #7be141;
}

.toast-error {
    border-left-color: #ff5555;
}

.toast-warning {
    border-left-color: #f0a30a;
}

.toast-info {
    border-left-color: #3498db;
}

.toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 16px;
    font-weight: bold;
    flex-shrink: 0;
}

.toast-success .toast-icon {
    background-color: rgba(123, 225, 65, 0.2);
    color: #7be141;
}

.toast-error .toast-icon {
    background-color: rgba(255, 85, 85, 0.2);
    color: #ff5555;
}

.toast-warning .toast-icon {
    background-color: rgba(240, 163, 10, 0.2);
    color: #f0a30a;
}

.toast-info .toast-icon {
    background-color: rgba(52, 152, 219, 0.2);
    color: #3498db;
}

.toast-message {
    flex: 1;
    color: #e0e0e0;
    font-size: 14px;
    word-break: break-word;
}

.toast-close {
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: none;
    color: #999;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toast-close:hover {
    color: #fff;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
    transition: all 0.3s ease;
}

.toast-slide-enter-from {
    opacity: 0;
    transform: translateX(100px);
}

.toast-slide-leave-to {
    opacity: 0;
    transform: translateX(100px) scale(0.8);
}
</style>
