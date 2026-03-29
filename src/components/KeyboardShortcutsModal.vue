<template>
    <transition name="modal-fade">
        <div v-if="isVisible" class="modal-overlay" @click="close">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h2>⌨️ Hotkeys</h2>
                    <button class="modal-close" @click="close">×</button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-section">
                        <h3>Navigation</h3>
                        <div class="shortcut-row">
                            <kbd>Alt + 1</kbd>
                            <span>Switch to "Scanner" tab</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Alt + 2</kbd>
                            <span>Switch to "Analysis" tab</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Alt + 3</kbd>
                            <span>Switch to "Settings" tab</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>/</kbd>
                            <span>Focus on search/filter</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Esc</kbd>
                            <span>Reset selection / Close modals</span>
                        </div>
                    </div>

                    <div class="shortcuts-section">
                        <h3>Graph</h3>
                        <div class="shortcut-row">
                            <kbd>Space</kbd>
                            <span>Toggle graph physics</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Double Click</kbd>
                            <span>Expand node</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Right Click</kbd>
                            <span>Node context menu</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Click</kbd>
                            <span>Select start node for path</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Shift + Click</kbd>
                            <span>Select end node for path</span>
                        </div>
                    </div>

                    <div class="shortcuts-section">
                        <h3>Additional</h3>
                        <div class="shortcut-row">
                            <kbd>Shift + Click</kbd>
                            <span>on scan button: more options</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Shift + Click</kbd>
                            <span>on project selector: more options</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>?</kbd>
                            <span>Open this help</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isVisible = ref(false);

const open = () => {
    isVisible.value = true;
};

const close = () => {
    isVisible.value = false;
};

defineExpose({ open, close });
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background-color: #242424;
    border: 1px solid #555;
    border-radius: 8px;
    width: 90%;
    max-width: 700px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #444;
}

.modal-header h2 {
    margin: 0;
    color: #7be141;
    font-size: 24px;
}

.modal-close {
    width: 36px;
    height: 36px;
    padding: 0;
    background: none;
    border: none;
    color: #999;
    font-size: 32px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.modal-close:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.1);
}

.modal-body {
    padding: 24px;
    overflow-y: auto;
}

.modal-body::-webkit-scrollbar {
    width: 8px;
}

.modal-body::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
    background: #7be141;
}

.shortcuts-section {
    margin-bottom: 30px;
}

.shortcuts-section:last-child {
    margin-bottom: 0;
}

.shortcuts-section h3 {
    margin: 0 0 16px 0;
    color: #f0a30a;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.shortcut-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid #333;
}

.shortcut-row:last-child {
    border-bottom: none;
}

kbd {
    display: inline-block;
    min-width: 120px;
    padding: 6px 12px;
    background: linear-gradient(180deg, #444 0%, #333 100%);
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    font-family: 'Consolas', 'Menlo', monospace;
    font-size: 13px;
    text-align: center;
    font-weight: bold;
}

.shortcut-row span {
    flex: 1;
    color: #aaa;
    font-size: 14px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
    transition: transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-fade-enter-from .modal-content {
    transform: scale(0.9) translateY(-20px);
}

.modal-fade-leave-to .modal-content {
    transform: scale(0.9) translateY(20px);
}
</style>
