// src/composables/useLog.ts
import { ref } from 'vue';

export function useLog() {
    const logs = ref<string[]>([]);

    const addLog = (message: string): void => {
        logs.value.push(message);
    };

    return {
        logs,
        addLog,
    };
}