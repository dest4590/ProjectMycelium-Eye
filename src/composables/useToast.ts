import { ref, type Ref } from 'vue';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

let toastId = 0;
const toastRef: Ref<any> = ref(null);

export function useToast() {
    const setToastRef = (ref: any) => {
        toastRef.value = ref;
    };

    const showToast = (
        message: string,
        type: Toast['type'] = 'info',
        duration = 5000
    ) => {
        if (toastRef.value && toastRef.value.addToast) {
            toastRef.value.addToast(message, type, duration);
        }
    };

    const success = (message: string, duration = 5000) => {
        showToast(message, 'success', duration);
    };

    const error = (message: string, duration = 7000) => {
        showToast(message, 'error', duration);
    };

    const warning = (message: string, duration = 6000) => {
        showToast(message, 'warning', duration);
    };

    const info = (message: string, duration = 5000) => {
        showToast(message, 'info', duration);
    };

    return {
        setToastRef,
        showToast,
        success,
        error,
        warning,
        info,
    };
}
