import { ref } from 'vue';

const MAX_LOG = 500;

export function useLog() {
    const logs = ref<string[]>([]);

    const addLog = (message: string): void => {
        logs.value.push(message);
        if (logs.value.length > MAX_LOG) {
            logs.value.splice(0, logs.value.length - MAX_LOG);
        }
    };

    const addErrorLog = (error: Error): void => {
        addLog(`<span class="log-error">${error.message}</span>`);
    };

    return {
        logs,
        addLog,
        addErrorLog,
    };
}
