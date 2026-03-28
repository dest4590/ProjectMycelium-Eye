import { ref } from 'vue';

export function useLog() {
    const logs = ref<string[]>([]);

    const addLog = (message: string): void => {
        logs.value.push(message);
    };

    const addErrorLog = (error: Error): void => {
        logs.value.push(`<span class="log-error">${error.message}</span>`);
    };

    return {
        logs,
        addLog,
        addErrorLog,
    };
}
