<template>
    <div v-if="isLoading" class="preloader">
        <EyeOfRa
            class="preloader-logo"
            :class="{ 'preloader-logo-error': startupError }"
        />
        <div v-if="!startupError">
            <p>initializing system...</p>
        </div>
        <div v-else class="preloader-error">
            <h2>critical error</h2>
            <p>{{ startupError }}</p>
        </div>
    </div>

    <div id="app" v-if="!startupError">
        <div class="main-panel">
            <div class="logo-container">
                <EyeOfRa
                    class="logo"
                    :class="{ 'logo-error': wsStatus === 'error' }"
                />
                <h2>PROJECT MYCELIUM</h2>
                <span>{{ tagline }}</span>
            </div>

            <span
                v-if="!activeProject"
                style="margin-bottom: 1rem; text-align: center"
                >create a project to continue</span
            >

            <ProjectSelector
                :projects="projects"
                v-model:activeProject="activeProject"
                @create="createProject"
                @delete="deleteProject"
            />

            <div class="tabs" v-if="activeProject">
                <button
                    @click="activeTab = 'scan'"
                    :class="{ active: activeTab === 'scan' }"
                    class="button-active-feedback"
                    title="scanner (alt+1)"
                >
                    scanner
                </button>
                <button
                    @click="activeTab = 'analyze'"
                    :class="{ active: activeTab === 'analyze' }"
                    class="button-active-feedback"
                    title="analysis (alt+2)"
                >
                    analysis
                </button>
                <button
                    @click="activeTab = 'settings'"
                    :class="{ active: activeTab === 'settings' }"
                    class="button-active-feedback"
                    title="settings (alt+3)"
                >
                    settings
                </button>
            </div>

            <ScannerPanel
                v-if="activeTab === 'scan' && activeProject"
                ref="scannerPanelRef"
                v-model:startUser="startUser"
                v-model:scanDepth="scanDepth"
                :tasks="tasks"
                :statusMap="statusMap"
                :isScanningLimitReached="isScanningLimitReached"
                :scanButtonLabel="scanButtonLabel"
                :startUserSuggestions="startUserSuggestions"
                @initiateScan="initiateScan"
                @updateSuggestions="updateStartUserSuggestions"
                @selectSuggestion="selectStartUserSuggestion"
            />

            <AnalysisPanel
                v-if="activeTab === 'analyze' && activeProject"
                ref="analysisPanelRef"
                v-model:searchQuery="searchQuery"
                v-model:pathStart="pathStart"
                v-model:pathEnd="pathEnd"
                :searchSuggestions="searchSuggestions"
                :pathStartSuggestions="pathStartSuggestions"
                :pathEndSuggestions="pathEndSuggestions"
                :activeProject="activeProject"
                @updateSearchSuggestions="updateSearchSuggestions"
                @updatePathStartSuggestions="updatePathStartSuggestions"
                @updatePathEndSuggestions="updatePathEndSuggestions"
                @selectSearchSuggestion="selectSearchSuggestion"
                @selectPathStartSuggestion="selectPathStartSuggestion"
                @selectPathEndSuggestion="selectPathEndSuggestion"
                @searchNode="searchNode"
                @findPath="findPath"
                @resetSearch="resetSearch"
                @resetPath="resetPath"
            />

            <SettingsPanel
                v-if="activeTab === 'settings' && activeProject"
                v-model:hideSingleConnections="hideSingleConnections"
                v-model:maxFollowersLimit="maxFollowersLimit"
                v-model:maxFollowingLimit="maxFollowingLimit"
                :isScanning="isScanning"
                :activeProject="activeProject"
                @setLimit="setLimit"
                @expandAllNodes="expandAllNodes"
            />

            <StatsPanel
                v-if="activeProject"
                :activeProject="activeProject"
                :selectedNode="selectedNode"
                :stats="stats"
                :wsStatus="wsStatus"
            />
            <LogConsole :logs="logs" />
        </div>

        <GraphPanel
            v-if="activeProject"
            ref="graphPanelRef"
            v-model:filterQuery="filterQuery"
            :physicsEnabled="physicsEnabled"
            :contextMenu="contextMenu"
            :hoverTooltip="hoverTooltip"
            :isNodeHidden="
                (nodeId) => nodesDataSet.get(nodeId)?.isHidden ?? false
            "
            @applyFilter="applyFilter"
            @resetFilter="resetFilter"
            @zoomIn="zoomIn"
            @zoomOut="zoomOut"
            @fitGraph="fitGraph"
            @togglePhysics="togglePhysics"
            @resetGraphView="resetGraphView"
            @executeContextMenuAction="executeContextMenuAction"
            @focusOnNode="focusOnNode"
        />
    </div>

    <ToastNotification ref="toastRef" />
    <KeyboardShortcutsModal ref="keyboardShortcutsModalRef" />
</template>

<script setup lang="ts">
import {
    ref,
    onMounted,
    reactive,
    onUnmounted,
    markRaw,
    shallowRef,
    computed,
    watch,
    nextTick,
    defineAsyncComponent,
    type Ref,
} from 'vue';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network.js';
import { Client } from '@stomp/stompjs';
import type { Options } from 'vis-network';
import EyeOfRa from '@/components/EyeOfRa.vue';
import ToastNotification from '@/components/ToastNotification.vue';

const LogConsole = defineAsyncComponent(
    () => import('@/components/LogConsole.vue'),
);
const KeyboardShortcutsModal = defineAsyncComponent(
    () => import('@/components/KeyboardShortcutsModal.vue'),
);
const ProjectSelector = defineAsyncComponent(
    () => import('@/components/ProjectSelector.vue'),
);
const ScannerPanel = defineAsyncComponent(
    () => import('@/components/ScannerPanel.vue'),
);
const AnalysisPanel = defineAsyncComponent(
    () => import('@/components/AnalysisPanel.vue'),
);
const SettingsPanel = defineAsyncComponent(
    () => import('@/components/SettingsPanel.vue'),
);
const StatsPanel = defineAsyncComponent(
    () => import('@/components/StatsPanel.vue'),
);
const GraphPanel = defineAsyncComponent(
    () => import('@/components/GraphPanel.vue'),
);

import { useLog } from '@/composables/useLog';
import { useToast } from '@/composables/useToast';
import { apiService } from '@/services/ApiService';
import { FilterService, type NodeContext } from '@/services/FilterService';
import type {
    NodeDataRaw,
    EdgeDataRaw,
    VisNode,
    VisEdge,
    Task,
    StatusMapItem,
    ContextMenuState,
    HoverTooltipState,
} from '@/types/global.d';

const { logs, addLog } = useLog();
const toast = useToast();

const nodesDataSet = markRaw(new DataSet<VisNode, 'id'>());
const edgesDataSet = markRaw(new DataSet<VisEdge, 'id'>());
const allNodesBackup = markRaw(new DataSet<VisNode, 'id'>());

const expandedNodes = ref<Set<string>>(new Set());
const graphContainer = ref<HTMLElement | null>(null);
const network = shallowRef<Network | null>(null);
const physicsEnabled = ref<boolean>(false);

const projects = ref<string[]>([]);
const activeProject = ref<string | null>(null);
const newProjectName = ref<string>('');
const activeTab = ref<string>('scan');
const isScanning = ref<boolean>(false);
const tasks: Record<string, Task> = reactive({});
const scanType = ref<'followers' | 'following' | 'force' | 'default'>(
    'default',
);

const MAX_CONCURRENT_SCANS: number = 3;
const maxFollowersLimit = ref<number | null>(null);
const maxFollowingLimit = ref<number | null>(null);

const statusMap: Record<string, StatusMapItem> = {
    queued: { text: 'queued', class: 'queued' },
    'scanning...': { text: 'scanning...', class: 'scanning' },
    completed: { text: 'completed', class: 'completed' },
    error: { text: 'error', class: 'failed' },
};

const isLoading = ref<boolean>(true);
const graphInitInProgress = ref<boolean>(false);
const isDraggingNode = ref<boolean>(false);
const startUser = ref<string>('exampleuser');
const scanDepth = ref<number>(0);
const stats = reactive({ nodes: 0, edges: 0, nodesOnGraph: 0 });
const wsStatus = ref<string>('connecting');
const searchQuery = ref<string>('');
const pathStart = ref<string>('');
const pathEnd = ref<string>('');
const selectedNode = ref<string | null>(null);
const hideSingleConnections = ref<boolean>(false);
const filterQuery = ref<string>('');

const searchSuggestions = ref<string[]>([]);
const showSuggestions = ref<boolean>(false);
const pathStartSuggestions = ref<string[]>([]);
const showPathStartSuggestions = ref<boolean>(false);
const pathEndSuggestions = ref<string[]>([]);
const showPathEndSuggestions = ref<boolean>(false);
const startUserSuggestions = ref<string[]>([]);
const showStartUserSuggestions = ref<boolean>(false);

const contextMenu: ContextMenuState = reactive({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    connectedNodes: [],
});
const hoverTooltip: HoverTooltipState = reactive({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    isScanned: false,
    label: null,
});

const showScanTypeDropdown = ref<boolean>(false);
const scanTypeDropdownX = ref<number>(0);
const scanTypeDropdownY = ref<number>(0);

const scannerPanelRef = ref<InstanceType<typeof ScannerPanel> | null>(null);
const analysisPanelRef = ref<InstanceType<typeof AnalysisPanel> | null>(null);
const graphPanelRef = ref<InstanceType<typeof GraphPanel> | null>(null);
const toastRef = ref<InstanceType<typeof ToastNotification> | null>(null);
const keyboardShortcutsModalRef = ref<InstanceType<
    typeof KeyboardShortcutsModal
> | null>(null);

const contextMenuRef = ref<HTMLElement | null>(null);

const handleContextMenuClickOutside = (event: MouseEvent) => {
    if (!contextMenu.visible) return;
    const target = event.target as Node;
    const menuEl = contextMenuRef.value;
    if (menuEl && menuEl.contains(target)) return;
    contextMenu.visible = false;
};

watch(
    () => contextMenu.visible,
    (newVal: boolean) => {
        if (newVal) {
            window.addEventListener('mousedown', handleContextMenuClickOutside);
        } else {
            window.removeEventListener(
                'mousedown',
                handleContextMenuClickOutside,
            );
        }
    },
    { immediate: true },
);

const isScanningLimitReached = computed<boolean>(
    () => Object.keys(tasks || {}).length >= MAX_CONCURRENT_SCANS,
);

const runningTasksCount = computed<number>(
    () => Object.keys(tasks || {}).length,
);

const scanButtonLabel = computed<string>(() => {
    if (isScanningLimitReached.value) return 'tasks limit';
    const map: Record<string, string> = {
        followers: 'followers',
        following: 'following',
        force: 'force',
        default: '',
    };
    const typeLabel = map[scanType.value] ?? String(scanType.value);
    const count = runningTasksCount.value;
    return `scan ${typeLabel}${count > 0 ? ' (' + count + ')' : ''}`;
});

const startupError = ref<string | null>(null);

const HOVER_DELAY: number = 500;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const randomTagLines: string[] = [
    'unraveling the digital web',
    'seeing through the web',
    'who, with whom, when',
    'analyzing the network of connections',
    'visualizing the invisible',
];
const tagline = computed<string>(
    () => randomTagLines[Math.floor(Math.random() * randomTagLines.length)],
);

const resetAnalysisState = () => {
    searchQuery.value = '';
    pathStart.value = '';
    pathEnd.value = '';
    if (network.value) {
        network.value.unselectAll();
    }
    resetHighlight();
};

watch(activeProject, (newProject: string | null, oldProject: string | null) => {
    if (newProject && newProject !== oldProject) {
        addLog(`> switching to project: "${newProject}"`);
        selectedNode.value = null;
        resetAnalysisState();
        filterQuery.value = '';
        nextTick(() => {
            initGraph();
        });
        fetchLimits();
    }
});

watch(activeTab, (newTab: string) => {
    nextTick(() => {
        if (newTab === 'scan') {
            scannerPanelRef.value?.focus();
        } else if (newTab === 'analyze') {
            analysisPanelRef.value?.focus();
        }
    });
});

async function fetchProjects(): Promise<void> {
    try {
        addLog('> requesting project list...');
        projects.value = await apiService.get<string[]>('/projects');
        if (projects.value.length > 0) {
            if (!activeProject.value) {
                activeProject.value = projects.value[0];
            }
            addLog(
                `> projects loaded. active project: "${activeProject.value}"`,
            );
        } else {
            addLog('> no projects yet. create the first one');
        }
    } catch (error: any) {
        addLog(
            `<span class="log-error">failed to load projects: ${error.message}</span>`,
        );
    }
}

async function createProject(): Promise<void> {
    if (!newProjectName.value) {
        addLog('> project name cannot be empty');
        toast.warning('Enter project name');
        return;
    }
    if (projects.value.includes(newProjectName.value)) {
        addLog('> project already exists');
        toast.warning('Project with this name already exists');
        return;
    }
    try {
        await apiService.post(`/projects?name=${newProjectName.value}`);
        projects.value.push(newProjectName.value);
        activeProject.value = newProjectName.value;
        addLog(`> project created and selected: "${activeProject.value}"`);
        toast.success(`Project "${newProjectName.value}" created`);
        newProjectName.value = '';
    } catch (error: any) {
        addLog(
            `<span class="log-error">error creating project: ${error.message}</span>`,
        );
    }
}

async function deleteProject(): Promise<void> {
    if (!activeProject.value) {
        addLog('> select project to delete');
        return;
    }
    if (
        !confirm(
            `are you sure you want to delete project "${activeProject.value}" and all its data?`,
        )
    ) {
        return;
    }

    try {
        const projectToDelete = activeProject.value;
        await apiService.delete(`/projects/${projectToDelete}`);
        projects.value = projects.value.filter(
            (p: string) => p !== projectToDelete,
        );
        if (projects.value.length > 0) {
            activeProject.value = projects.value[0];
        } else {
            activeProject.value = null;
        }
        addLog(`> project "${projectToDelete}" successfully deleted`);
        toast.success(`Project "${projectToDelete}" deleted`);
    } catch (error: any) {
        addLog(
            `<span class="log-error">error deleting project: ${error.message}</span>`,
        );
    }
}

async function fetchLimits(): Promise<void> {
    try {
        const response = await apiService.get<{
            maxFollowers: number | null;
            maxFollowing: number | null;
        }>('/settings/limits');
        const { maxFollowers, maxFollowing } = response;

        maxFollowersLimit.value = maxFollowers ?? null;
        maxFollowingLimit.value = maxFollowing ?? null;
    } catch (error: any) {
        addLog(
            `<span class="log-error">failed to load limits: ${error.message}</span>`,
        );
    }
}

async function setLimit(type: string, value: number) {
    if (value === null || value < 0) {
        addLog(`> limit ${type} cannot be negative`);
        return;
    }
    try {
        await apiService.post(`/settings/limits/${type}?value=${value}`);
        addLog(`> set limit ${type}: ${value}`);
    } catch (error: any) {
        addLog(
            `<span class="log-error">error setting limit ${type}: ${error.message}</span>`,
        );
    }
}

function hideContextMenu(): void {
    contextMenu.visible = false;
}

function formatNode(n: NodeDataRaw): VisNode {
    return {
        id: n.username,
        label: n.nickname || n.username,
        color: n.scanned ? '#7BE141' : '#F0A30A',
        scanned: n.scanned,
        isHidden: n.isHidden,
    };
}

function formatEdge(e: EdgeDataRaw): VisEdge {
    return {
        id: `${e.source}-${e.target}`,
        from: e.source,
        to: e.target,
        arrows: 'to',
        color: { color: e.active ? '#FFFFFF' : '#444444' },
        dashes: !e.active,
    };
}

function updateFilteredNodes(): void {
    if (!network.value) return;

    if (!hideSingleConnections.value) {
        const nodesToAdd = allNodesBackup.get({
            filter: (node: VisNode) => !nodesDataSet.get(node.id),
        });
        if (nodesToAdd.length > 0) {
            nodesDataSet.add(nodesToAdd);
        }
    } else {
        const edgeCounts = new Map<string, number>();
        edgesDataSet.forEach((edge: VisEdge) => {
            edgeCounts.set(edge.from, (edgeCounts.get(edge.from) || 0) + 1);
            edgeCounts.set(edge.to, (edgeCounts.get(edge.to) || 0) + 1);
        });

        const nodesToRemove = nodesDataSet.get({
            filter: (node: VisNode) => (edgeCounts.get(node.id) || 0) < 2,
        });

        if (nodesToRemove.length > 0) {
            nodesDataSet.remove(nodesToRemove.map((n: VisNode) => n.id));
        }
    }
    stats.nodesOnGraph = nodesDataSet.length;
}

watch(hideSingleConnections, updateFilteredNodes);

nodesDataSet.on('*', () => {
    stats.nodes = allNodesBackup.length;
    updateFilteredNodes();
});
edgesDataSet.on('*', () => {
    stats.edges = edgesDataSet.length;
    updateFilteredNodes();
});

const stompClient = new Client({
    brokerURL: 'ws://localhost:8080/ws-mycelium',
    onConnect: () => {
        wsStatus.value = 'connected';
        addLog('> WS: connection established');
        stompClient.subscribe('/topic/logs', (message) => {
            const update = JSON.parse(message.body);
            addLog(`> [${update.taskId.slice(0, 8)}] ${update.message}`);
        });
        stompClient.subscribe('/topic/updates', (message) => {
            const update = JSON.parse(message.body);
            if (update.type === 'USER_NODE_UPDATE') {
                const nodeData = formatNode({
                    username: update.username,
                    nickname: update.nickname,
                    scanned: update.isScanned,
                });
                nodesDataSet.update(nodeData);
                allNodesBackup.update(nodeData);
            } else if (update.type === 'NEW_EDGE') {
                const srcNode = formatNode({
                    username: update.source,
                    scanned: false,
                });
                const tgtNode = formatNode({
                    username: update.target,
                    scanned: false,
                });
                try {
                    nodesDataSet.update(srcNode);
                    allNodesBackup.update(srcNode);
                } catch (e) {
                    try {
                        nodesDataSet.add(srcNode);
                    } catch (ee) {}
                }
                try {
                    nodesDataSet.update(tgtNode);
                    allNodesBackup.update(tgtNode);
                } catch (e) {
                    try {
                        nodesDataSet.add(tgtNode);
                    } catch (ee) {}
                }
                const edgeObj = formatEdge({
                    source: update.source,
                    target: update.target,
                    active: true,
                });
                try {
                    edgesDataSet.update(edgeObj);
                } catch (e) {
                    try {
                        edgesDataSet.add(edgeObj);
                    } catch (ee) {}
                }
            } else if (update.type === 'NODE_DELETION') {
                nodesDataSet.remove(update.username);
                allNodesBackup.remove(update.username);
                const connectedEdges = network.value
                    ? network.value.getConnectedEdges(update.username)
                    : [];
                if (connectedEdges.length > 0)
                    edgesDataSet.remove(connectedEdges);
            }
        });
        stompClient.subscribe('/topic/status', (message) => {
            const update = JSON.parse(message.body);
            const task = tasks[update.taskId];
            if (!task) return;

            const status = update.type;
            if (status === 'SCAN_STARTED') {
                task.status = 'scanning...';
            } else if (status === 'SCAN_COMPLETED') {
                task.status = 'completed';
                setTimeout(() => {
                    delete tasks[update.taskId];
                }, 5000);
            } else if (status === 'SCAN_FAILED') {
                task.status = 'error';
                setTimeout(() => {
                    delete tasks[update.taskId];
                }, 10000);
            }
        });
    },
    onStompError: (error) => {
        wsStatus.value = 'error';
        addLog(
            `<span class="log-error">WS error: ${error.headers.message}</span>`,
        );
    },
    onWebSocketError: (error) => {
        wsStatus.value = 'error';
    },
});

async function initiateScan(
    type: 'followers' | 'following' | 'force' | 'default',
): Promise<void> {
    if (!activeProject.value || !startUser.value) {
        addLog('<span class="log-error">select project and enter user</span>');
        toast.warning('Select project and enter username');
        return;
    }

    addLog(
        `> [Project: ${activeProject.value}] Sending scan task for ${startUser.value} (type: ${type})...`,
    );
    try {
        const response = await apiService.post<{ taskId: string }>(
            `/scan/start?username=${startUser.value}&depth=${scanDepth.value}&projectName=${activeProject.value}&type=${type}`,
        );

        const { taskId } = response;

        tasks[taskId] = {
            startUser: startUser.value,
            status: 'queued',
        };

        addLog(`> task created with id: ${taskId}`);
        toast.success(`Scan for ${startUser.value} started`);
    } catch (err: any) {
        addLog(`> error creating task: ${err.message}`);
    }
}

function handleScanButtonMousedown(event: MouseEvent): void {
    if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        showScanTypeDropdown.value = true;
        const buttonRect = (
            event.currentTarget as HTMLElement
        ).getBoundingClientRect();
        scanTypeDropdownX.value = buttonRect.left;
        scanTypeDropdownY.value = buttonRect.bottom + 5;
    } else {
        showScanTypeDropdown.value = false;
        initiateScan(scanType.value);
    }
}

function selectScanTypeFromDropdown(type: string): void {
    showScanTypeDropdown.value = false;
    initiateScan(type as 'followers' | 'following' | 'force' | 'default');
}

function setGraphContainerRef() {
    if (graphPanelRef.value) {
        const exposed: any = (graphPanelRef.value as any).graphContainer;
        const el: HTMLElement | null = exposed?.value ?? exposed ?? null;
        graphContainer.value = el;
    }
}

async function initGraph(): Promise<void> {
    if (!activeProject.value) {
        nodesDataSet.clear();
        edgesDataSet.clear();
        expandedNodes.value.clear();
        if (network.value) {
            network.value.setData({ nodes: nodesDataSet, edges: edgesDataSet });
        }
        addLog('> select project to load graph');
        return;
    }
    if (graphInitInProgress.value) {
        return;
    }
    isLoading.value = true;
    graphInitInProgress.value = true;
    addLog(`> loading graph for project: "${activeProject.value}"`);
    nodesDataSet.clear();
    edgesDataSet.clear();
    allNodesBackup.clear();
    expandedNodes.value.clear();

    setGraphContainerRef();

    try {
        const response = await apiService.get<{
            nodes: NodeDataRaw[];
            edges: EdgeDataRaw[];
        }>(`/graph/initial?projectName=${activeProject.value}`);
        const rawData = response;

        const initialNodes = rawData.nodes
            .filter((n: NodeDataRaw) => !n.isHidden)
            .map(formatNode);

        const normalizeId = (id: any) => {
            if (id === null || id === undefined) return String(id);
            try {
                return String(id).normalize('NFC').trim();
            } catch (e) {
                return String(id).trim();
            }
        };

        const normalizedNodes = initialNodes.map((n) => ({
            ...n,
            id: normalizeId(n.id),
        }));
        const nodeIdCounts = new Map<string, number>();
        normalizedNodes.forEach((n) =>
            nodeIdCounts.set(n.id, (nodeIdCounts.get(n.id) || 0) + 1),
        );
        const duplicateNodeEntries = Array.from(nodeIdCounts.entries()).filter(
            ([_, c]) => c > 1,
        );

        const initialEdges = rawData.edges.map(formatEdge);
        const normalizedEdges = initialEdges.map((e) => ({
            ...e,
            id: normalizeId(e.id),
        }));
        const edgeIdCounts = new Map<string, number>();
        normalizedEdges.forEach((e) =>
            edgeIdCounts.set(e.id, (edgeIdCounts.get(e.id) || 0) + 1),
        );
        const duplicateEdgeEntries = Array.from(edgeIdCounts.entries()).filter(
            ([_, c]) => c > 1,
        );

        const seenNodeIds = new Set<string>();
        const dedupedNodes: typeof normalizedNodes = [];
        for (const n of normalizedNodes) {
            if (!seenNodeIds.has(n.id)) {
                seenNodeIds.add(n.id);
                dedupedNodes.push(n);
            }
        }

        const seenEdgeIds = new Set<string>();
        const dedupedEdges: typeof normalizedEdges = [];
        for (const e of normalizedEdges) {
            if (!seenEdgeIds.has(e.id)) {
                seenEdgeIds.add(e.id);
                dedupedEdges.push(e);
            }
        }

        try {
            for (const nodeItem of dedupedNodes) {
                const exists = nodesDataSet.get(nodeItem.id as any);
                if (exists) nodesDataSet.update(nodeItem);
                else nodesDataSet.add(nodeItem);
            }

            try {
                allNodesBackup.add(dedupedNodes);
            } catch (err) {
                for (const nodeItem of dedupedNodes) {
                    const exists = allNodesBackup.get(nodeItem.id as any);
                    if (exists) allNodesBackup.update(nodeItem);
                    else allNodesBackup.add(nodeItem);
                }
            }

            for (const edgeItem of dedupedEdges) {
                const exists = edgesDataSet.get(edgeItem.id as any);
                if (exists) edgesDataSet.update(edgeItem);
                else edgesDataSet.add(edgeItem);
            }
        } catch (err) {
            throw err;
        }

        stats.nodes = allNodesBackup.length;
        stats.edges = edgesDataSet.length;

        const options: Options = {
            nodes: {
                shape: 'dot',
                size: 12,
                font: {
                    color: '#fff',
                    size: 10,
                    face: 'Consolas',
                    strokeWidth: 2,
                    strokeColor: '#242424',
                },
                borderWidth: 2,
            },
            edges: {
                width: 1,
                color: { color: '#FFFFFF', opacity: 1 },
            },
            physics: {
                enabled: false,
                barnesHut: {
                    gravitationalConstant: -10000,
                    centralGravity: 0.01,
                    springLength: 50,
                    springConstant: 0.008,
                    damping: 0.1,
                    avoidOverlap: 1,
                },
                stabilization: {
                    enabled: true,
                    iterations: 1000,
                    updateInterval: 25,
                },
                solver: 'barnesHut',
            },
            interaction: { hover: true },
        };

        physicsEnabled.value = options.physics?.enabled ?? false;

        setGraphContainerRef();

        if (network.value) {
            network.value.setData({ nodes: nodesDataSet, edges: edgesDataSet });
            network.value.setOptions(options);
            network.value.fit();
        } else if (graphContainer.value) {
            try {
                network.value = markRaw(
                    new Network(
                        graphContainer.value,
                        { nodes: nodesDataSet, edges: edgesDataSet },
                        options,
                    ),
                );
                setupNetworkEvents();
            } catch (err) {
                throw err;
            }
        }
        updateFilteredNodes();
        addLog(`> initial graph for "${activeProject.value}" loaded`);
    } catch (error: any) {
        addLog(
            `<span class="log-error">error loading graph: ${error.message}</span>`,
        );
    } finally {
        isLoading.value = false;
        graphInitInProgress.value = false;
    }
}

function setupNetworkEvents(): void {
    if (!network.value) return;

    network.value.once('afterDrawing', () => {
        addLog('> initial drawing completed, enabling physics...');

        if (network.value) {
            network.value.setOptions({ physics: { enabled: true } });
            physicsEnabled.value = true;
        }
    });

    network.value.on(
        'selectNode',
        (params: { nodes: string[]; event: { srcEvent: MouseEvent } }) => {
            const nodeId = params.nodes[0];
            selectedNode.value = nodeId;

            if (nodeId) {
                startUser.value = nodeId;
            }

            if (params.event.srcEvent.shiftKey) {
                pathEnd.value = nodeId;
            } else {
                pathStart.value = nodeId;
                pathEnd.value = nodeId;
            }
        },
    );

    network.value.on(
        'hoverNode',
        (params: {
            node: string;
            pointer: { DOM: { x: number; y: number } };
        }) => {
            if (isDraggingNode.value) return;
            const nodeId = params.node;
            if (nodeId) {
                if (hoverTimer) clearTimeout(hoverTimer);
                const nodeData = nodesDataSet.get(nodeId);
                if (nodeData) {
                    hoverTimer = setTimeout(() => {
                        hoverTooltip.nodeId = nodeData.id;
                        hoverTooltip.label = nodeData.label;
                        hoverTooltip.isScanned = nodeData.scanned;
                        hoverTooltip.x = params.pointer.DOM.x;
                        hoverTooltip.y = params.pointer.DOM.y;
                        hoverTooltip.visible = true;
                    }, HOVER_DELAY);
                }
            }
        },
    );
    network.value.on('blurNode', () => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        hoverTooltip.visible = false;
        hoverTooltip.nodeId = null;
        hoverTooltip.label = null;
    });
    network.value.on('dragStart', (params: { nodes: string[] }) => {
        if (params.nodes.length > 0) {
            isDraggingNode.value = true;
            if (hoverTimer) clearTimeout(hoverTimer);
            hoverTooltip.visible = false;
        }
    });
    network.value.on('dragEnd', () => {
        isDraggingNode.value = false;
    });
    network.value.on('deselectNode', () => {
        selectedNode.value = null;
    });
    network.value.on('doubleClick', async (params: { nodes: string[] }) => {
        if (params.nodes.length > 0) {
            await expandNode(params.nodes[0]);
        }
    });
    network.value.on(
        'oncontext',
        (params: {
            event: MouseEvent;
            nodes: string[];
            pointer: { DOM: { x: number; y: number } };
        }) => {
            params.event.preventDefault();
            if (hoverTimer) clearTimeout(hoverTimer);
            hoverTooltip.visible = false;
            const nodeId = params.nodes[0];
            if (nodeId) {
                const connectedIdsRaw =
                    network.value?.getConnectedNodes(nodeId) || [];
                const connectedIds = Array.isArray(connectedIdsRaw)
                    ? connectedIdsRaw.filter((id) => typeof id === 'string')
                    : typeof connectedIdsRaw === 'string'
                      ? [connectedIdsRaw]
                      : [];
                const connectedNodeObjects = nodesDataSet.get(connectedIds);
                contextMenu.nodeId = nodeId;
                contextMenu.connectedNodes = connectedNodeObjects.map(
                    (n: VisNode) => n.label,
                );
                contextMenu.x = params.pointer.DOM.x;
                contextMenu.y = params.pointer.DOM.y;
                contextMenu.visible = true;
            } else {
                hideContextMenu();
            }
        },
    );
}

async function expandNode(username: string): Promise<void> {
    if (!activeProject.value) return;
    if (expandedNodes.value.has(username)) {
        addLog(`> node ${username} has already been expanded`);
        network.value?.focus(username);
        return;
    }
    addLog(`> expanding node ${username}...`);
    try {
        const response = await apiService.get<{
            nodes: NodeDataRaw[];
            edges: EdgeDataRaw[];
        }>(
            `/graph/expand?username=${username}&projectName=${activeProject.value}`,
        );
        const { nodes: nodesToAddRaw, edges: edgesToAddRaw } = response;
        const nodesToAdd = nodesToAddRaw
            .filter(
                (n: NodeDataRaw) =>
                    !nodesDataSet.get(n.username) && !n.isHidden,
            )
            .map(formatNode);
        const edgesToAdd = edgesToAddRaw
            .filter(
                (e: EdgeDataRaw) =>
                    !edgesDataSet.get(`${e.source}-${e.target}`),
            )
            .map(formatEdge);
        if (nodesToAdd.length > 0) nodesDataSet.add(nodesToAdd);
        if (edgesToAdd.length > 0) edgesDataSet.add(edgesToAdd);
        expandedNodes.value.add(username);
        addLog(
            `> node ${username} expanded. Added: ${nodesToAdd.length} nodes, ${edgesToAdd.length} edges.`,
        );
    } catch (err: any) {
        addLog(
            `<span class="log-error">error expanding node: ${err.message}</span>`,
        );
    }
}

async function deleteNode(username: string): Promise<void> {
    if (
        !confirm(
            `are you sure you want to permanently delete node "${username}" and all its connections?`,
        )
    ) {
        return;
    }
    addLog(`> deleting node ${username}...`);
    try {
        await apiService.delete(`/graph/${username}`);
        addLog(`> node ${username} successfully deleted`);
    } catch (err: any) {
        addLog(
            `<span class="log-error">error deleting node: ${err.message}</span>`,
        );
    }
}

function getFullNodeList(): VisNode[] {
    return nodesDataSet.get({ returnType: 'Array' });
}

function updateSuggestions(
    query: string | number,
    suggestionsRef: Ref<string[]>,
): void {
    const queryString = String(query);
    if (queryString.length > 0) {
        suggestionsRef.value = getFullNodeList()
            .map((n: VisNode) => n.id)
            .filter((id: string) =>
                id.toLowerCase().includes(queryString.toLowerCase()),
            )
            .sort((a, b) => a.localeCompare(b));
    } else {
        suggestionsRef.value = [];
    }
}

const updateSearchSuggestions = (value: string | number) =>
    updateSuggestions(value, searchSuggestions);
const selectSearchSuggestion = (suggestion: string) => {
    searchQuery.value = suggestion;
    showSuggestions.value = false;
    searchNode();
};

const updatePathStartSuggestions = (value: string | number) =>
    updateSuggestions(value, pathStartSuggestions);
const selectPathStartSuggestion = (suggestion: string) => {
    pathStart.value = suggestion;
    showPathStartSuggestions.value = false;
};

const updatePathEndSuggestions = (value: string | number) =>
    updateSuggestions(value, pathEndSuggestions);
const selectPathEndSuggestion = (suggestion: string) => {
    pathEnd.value = suggestion;
    showPathEndSuggestions.value = false;
};

const updateStartUserSuggestions = (value: string | number) =>
    updateSuggestions(value, startUserSuggestions);
const selectStartUserSuggestion = (suggestion: string) => {
    startUser.value = suggestion;
    showStartUserSuggestions.value = false;
};

function searchNode(): void {
    if (searchQuery.value && network.value) {
        const nodeId = searchQuery.value;
        const nodeData = nodesDataSet.get(nodeId);
        if (nodeData) {
            network.value.focus(nodeId, {
                scale: 1.5,
                animation: { duration: 1000, easingFunction: 'easeInOutQuad' },
            });
            network.value.selectNodes([nodeId]);
            selectedNode.value = nodeId;

            const originalColor =
                typeof nodeData.color === 'object'
                    ? JSON.parse(JSON.stringify(nodeData.color))
                    : nodeData.color;
            const pingNode = {
                id: nodeId,
                size: 25,
                color: { border: '#FF5555', background: '#FF5555' },
                shadow: { enabled: true, color: '#FF5555', size: 30 },
            };
            const normalNode = {
                id: nodeId,
                size: 12,
                color: originalColor,
                shadow: false,
            };
            nodesDataSet.update(pingNode);
            setTimeout(() => nodesDataSet.update(normalNode), 1500);
            toast.success(`Node "${nodeId}" found`);
        } else {
            addLog(`> node "${searchQuery.value}" not found`);
            toast.warning(`Node "${searchQuery.value}" not found`);
        }
    }
}

const resetSearch = () => {
    searchQuery.value = '';
    network.value?.unselectAll();
    resetHighlight();
};

const resetPath = () => {
    pathStart.value = '';
    pathEnd.value = '';
    resetHighlight();
};

async function findPath(): Promise<void> {
    if (!activeProject.value) return;
    if (!pathStart.value || !pathEnd.value) {
        addLog(`> start and end nodes not specified`);
        return;
    }
    addLog(`> searching for path from ${pathStart.value} to ${pathEnd.value}`);
    try {
        const response = await apiService.get<string[]>(
            `/graph/shortest-path?start=${pathStart.value}&end=${pathEnd.value}&projectName=${activeProject.value}`,
        );
        const pathUsernames = response;
        if (pathUsernames.length > 0) {
            highlightPath(pathUsernames);
            addLog(
                `> path found: <span class="log-success">${pathUsernames.join(
                    ' → ',
                )}</span>`,
            );
        } else {
            addLog('> path not found');
        }
    } catch (err: any) {
        addLog(`> error searching for path: ${err.message}`);
    }
}

function highlightPath(path: string[]): void {
    resetHighlight();
    const pathEdgesIds: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
        const edgeId1 = `${path[i]}-${path[i + 1]}`;
        if (edgesDataSet.get(edgeId1)) pathEdgesIds.push(edgeId1);
        else {
            const edgeId2 = `${path[i + 1]}-${path[i]}`;
            if (edgesDataSet.get(edgeId2)) pathEdgesIds.push(edgeId2);
        }
    }
    nodesDataSet.update(
        nodesDataSet.map((n: VisNode) => ({
            id: n.id,
            color: path.includes(n.id) ? '#FF5555' : '#444',
        })),
    );
    edgesDataSet.update(
        edgesDataSet.map((e: VisEdge) => ({
            id: e.id,
            color: { color: pathEdgesIds.includes(e.id) ? '#FF5555' : '#222' },
        })),
    );
}

function highlightNeighbors(): void {
    if (!selectedNode.value || !network.value) return;
    resetHighlight();
    let neighborNodesIdsRaw = network.value.getConnectedNodes(
        selectedNode.value,
    );

    const neighborNodesIds: string[] = Array.isArray(neighborNodesIdsRaw)
        ? neighborNodesIdsRaw
              .filter((id) => typeof id === 'string')
              .map((id) => id as string)
        : typeof neighborNodesIdsRaw === 'string'
          ? [neighborNodesIdsRaw]
          : [];
    const updates = nodesDataSet.map((n: VisNode) => ({
        id: n.id,
        color:
            n.id === selectedNode.value
                ? '#FF5555'
                : neighborNodesIds.includes(n.id)
                  ? '#F0A30A'
                  : '#444',
    }));
    nodesDataSet.update(updates);
    const connectedEdgesIds = network.value.getConnectedEdges(
        selectedNode.value,
    );
    edgesDataSet.update(
        edgesDataSet.map((e: VisEdge) => ({
            id: e.id,
            color: {
                color: connectedEdgesIds.includes(e.id) ? '#FFFFFF' : '#222',
            },
        })),
    );
}

function resetHighlight(): void {
    const originalNodes = nodesDataSet.map((n: VisNode) => ({
        id: n.id,
        color: n.scanned ? '#7BE141' : '#F0A30A',
    }));
    nodesDataSet.update(originalNodes);
    const originalEdges = edgesDataSet.map((e: VisEdge) => ({
        id: e.id,
        color: { color: e.dashes ? '#444444' : '#FFFFFF' },
    }));
    edgesDataSet.update(originalEdges);
}

async function expandAllNodes(): Promise<void> {
    if (!activeProject.value) return;
    isLoading.value = true;
    addLog('> requesting full graph from database...');
    try {
        const response = await apiService.get<{
            nodes: NodeDataRaw[];
            edges: EdgeDataRaw[];
        }>(`/graph/all?projectName=${activeProject.value}`);
        const { nodes: allNodesRaw, edges: allEdgesRaw } = response;
        addLog(
            `> full graph received. nodes: ${allNodesRaw.length}, edges: ${allEdgesRaw.length}`,
        );
        nodesDataSet.clear();
        edgesDataSet.clear();
        expandedNodes.value.clear();
        const allNodes = allNodesRaw
            .filter((n: NodeDataRaw) => !n.isHidden)
            .map(formatNode);
        const allEdges = allEdgesRaw.map(formatEdge);
        nodesDataSet.add(allNodes);
        edgesDataSet.add(allEdges);
        allNodes.forEach((node: VisNode) => expandedNodes.value.add(node.id));
        updateFilteredNodes();
        addLog('> graph fully updated');
    } catch (err: any) {
        addLog(
            `<span class="log-error">error loading full graph: ${err.message}</span>`,
        );
    } finally {
        isLoading.value = false;
    }
}

function markAsNotScanned(nodeId: string): void {
    if (!nodeId || !nodesDataSet.get(nodeId)) return;
    nodesDataSet.update({
        id: nodeId,
        scanned: false,
        color: '#F0A30A',
    });
    try {
        apiService.patch(`/user/${nodeId}/scanned?scanned=false`);
        addLog(`> node ${nodeId} marked as unscanned`);
    } catch (err: any) {
        addLog(
            `<span class="log-error">error marking node as unscanned: ${err.message}</span>`,
        );
    }
}

async function toggleHideNode(nodeId: string): Promise<void> {
    const node = nodesDataSet.get(nodeId);
    if (!node) return;

    const newHiddenStatus = !node.isHidden;
    addLog(`> ${newHiddenStatus ? 'hiding' : 'showing'} node ${nodeId}...`);

    try {
        await apiService.setUserHidden(nodeId, newHiddenStatus);
        if (newHiddenStatus) {
            nodesDataSet.remove(nodeId);
            allNodesBackup.remove(nodeId);
        } else {
            nodesDataSet.update({ id: nodeId, isHidden: false });
        }
        addLog(
            `> node ${nodeId} is now ${newHiddenStatus ? 'hidden' : 'visible'}`,
        );
    } catch (err: any) {
        addLog(
            `<span class="log-error">error toggling hide status for node: ${err.message}</span>`,
        );
    }
}

function resetFilter(): void {
    filterQuery.value = '';
    resetHighlight();
}

function applyFilter(): void {
    if (!filterQuery.value) {
        addLog('> filter field is empty, resetting highlight');
        resetHighlight();
        return;
    }
    addLog(`> applying filter: "${filterQuery.value}"`);

    try {
        const filterFn = FilterService.parse(filterQuery.value);
        const allNodes = nodesDataSet.get();
        const allEdges = edgesDataSet.get();

        const inDegreeMap = new Map<string, number>();
        const outDegreeMap = new Map<string, number>();
        allNodes.forEach((node: VisNode) => {
            inDegreeMap.set(node.id, 0);
            outDegreeMap.set(node.id, 0);
        });
        allEdges.forEach((edge: VisEdge) => {
            outDegreeMap.set(edge.from, (outDegreeMap.get(edge.from) || 0) + 1);
            inDegreeMap.set(edge.to, (inDegreeMap.get(edge.to) || 0) + 1);
        });

        const highlightedNodeIds = new Set<string>();
        allNodes.forEach((node: VisNode) => {
            const inDegree = inDegreeMap.get(node.id) || 0;
            const outDegree = outDegreeMap.get(node.id) || 0;
            const context: NodeContext = {
                id: node.id,
                label: node.label,
                scanned: node.scanned,
                inDegree,
                outDegree,
                degree: inDegree + outDegree,
            };

            if (filterFn(context)) {
                highlightedNodeIds.add(node.id);
            }
        });

        if (highlightedNodeIds.size === 0) {
            addLog('> filter applied, no matches found');
        } else {
            addLog(`> filter applied, nodes found: ${highlightedNodeIds.size}`);
        }

        const nodeUpdates = allNodes.map((node: VisNode) => ({
            id: node.id,
            color: highlightedNodeIds.has(node.id) ? '#FF00FF' : '#444',
        }));
        const edgeUpdates = allEdges.map((edge: VisEdge) => ({
            id: edge.id,
            color: { color: '#222' },
        }));

        nodesDataSet.update(nodeUpdates);
        edgesDataSet.update(edgeUpdates);
    } catch (error) {
        addLog(
            `<span class="log-error">error: ${
                error instanceof Error ? error.message : 'invalid filter syntax'
            }</span>`,
        );
    }
}

function focusOnNode(nodeId: string): void {
    if (network.value) {
        network.value.focus(nodeId, {
            scale: 1.5,
            animation: { duration: 500, easingFunction: 'easeInOutQuad' },
        });
    }
}

function executeContextMenuAction(action: string): void {
    if (!contextMenu.nodeId) return;
    const nodeId = contextMenu.nodeId;
    switch (action) {
        case 'copy':
            navigator.clipboard.writeText(nodeId).then(() => {
                addLog(`> copied node ID: ${nodeId}`);
            });
            break;
        case 'expand':
            expandNode(nodeId);
            break;
        case 'highlight':
            selectedNode.value = nodeId;
            highlightNeighbors();
            break;
        case 'setAsPathStart':
            pathStart.value = nodeId;
            addLog(`> node ${nodeId} set as start`);
            activeTab.value = 'analyze';
            break;
        case 'setAsPathEnd':
            pathEnd.value = nodeId;
            addLog(`> node ${nodeId} set as end`);
            activeTab.value = 'analyze';
            break;
        case 'markAsNotScanned':
            markAsNotScanned(nodeId);
            break;
        case 'toggleHide':
            toggleHideNode(nodeId);
            break;
        case 'delete':
            deleteNode(nodeId);
            break;
        case 'open':
            window.open(`https://www.instagram.com/${nodeId}`, '_blank');
            break;
    }
    hideContextMenu();
}

const zoomIn = () => {
    if (network.value) {
        const scale = network.value.getScale();
        network.value.moveTo({ scale: scale * 1.2 });
    }
};

const zoomOut = () => {
    if (network.value) {
        const scale = network.value.getScale();
        network.value.moveTo({ scale: scale * 0.8 });
    }
};

const fitGraph = () => {
    if (network.value) {
        network.value.fit({
            animation: { duration: 500, easingFunction: 'easeInOutQuad' },
        });
    }
};

const togglePhysics = () => {
    if (network.value) {
        const currentState = physicsEnabled.value;
        network.value.setOptions({ physics: { enabled: !currentState } });
        physicsEnabled.value = !currentState;
        toast.info(`graph physics ${!currentState ? 'enabled' : 'disabled'}`);
    }
};

const resetGraphView = () => {
    if (network.value) {
        network.value.fit();
        network.value.unselectAll();
        resetHighlight();
        toast.info('graph view reset');
    }
};

const handleKeydown = (event: KeyboardEvent) => {
    if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
    ) {
        if (event.key === 'Escape') {
            (event.target as HTMLElement).blur();
        }
        return;
    }

    if (event.altKey) {
        event.preventDefault();
        if (event.key === '1') activeTab.value = 'scan';
        if (event.key === '2') activeTab.value = 'analyze';
        if (event.key === '3') activeTab.value = 'settings';
    }

    if (event.key === '/') {
        event.preventDefault();
        if (activeTab.value === 'analyze') {
            analysisPanelRef.value?.focus();
        } else if (graphPanelRef.value?.filterPanelRef) {
            graphPanelRef.value.filterPanelRef.focus();
        }
    }

    if (event.key === '?') {
        event.preventDefault();
        keyboardShortcutsModalRef.value?.open();
    }

    if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        fitGraph();
    }

    if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        resetGraphView();
    }

    if (event.key.toLowerCase() === ' ') {
        event.preventDefault();
        togglePhysics();
    }

    if (event.key === 'Escape') {
        if (contextMenu.visible) {
            hideContextMenu();
        } else if (selectedNode.value) {
            resetAnalysisState();
        }
    }

    if (event.ctrlKey || event.metaKey) {
        if (event.key === '=' || event.key === '+') {
            event.preventDefault();
            zoomIn();
        } else if (event.key === '-') {
            event.preventDefault();
            zoomOut();
        }
    }
};

onMounted(async () => {
    addLog('> system is starting...');

    await new Promise((resolve) => setTimeout(resolve, 2500));

    if (toastRef.value) {
        toast.setToastRef(toastRef.value);
    }

    try {
        addLog('> checking connection to backend...');
        await apiService.get('/actuator/health');
        addLog('> connection to backend established');
        toast.success('Connection to server established');

        stompClient.activate();
        await fetchProjects();

        window.addEventListener('keydown', handleKeydown);

        if (!activeProject.value) {
            isLoading.value = false;
            addLog('> to start, create your first project');
        } else {
            fetchLimits();
            nextTick(() => {
                initGraph();
            });
        }
    } catch (error: any) {
        const errorMessage = `failed to connect to backend. is it running? (${error.message})`;
        addLog(`<span class="log-error">${errorMessage}</span>`);
        startupError.value = errorMessage;
        toast.error('Failed to connect to server');
    }
});

onUnmounted(() => {
    if (stompClient.active) stompClient.deactivate();
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('mousedown', handleContextMenuClickOutside);
});
</script>

<style scoped></style>
