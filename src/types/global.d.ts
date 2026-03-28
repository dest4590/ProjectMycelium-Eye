export interface NodeDataRaw {
    username: string;
    nickname?: string;
    scanned: boolean;
    isHidden?: boolean;
    lastScanned?: string | null;
}

export interface EdgeDataRaw {
    source: string;
    target: string;
    active: boolean;
}

export type VisNodeColor =
    | string
    | {
        border?: string;
        background?: string;
        highlight?: string | { border?: string; background?: string };
        hover?: string | { border?: string; background?: string };
    };

export interface VisNode {
    id: string;
    label: string;
    color: VisNodeColor;
    scanned: boolean;
    isHidden?: boolean;
    size?: number;
    shadow?: boolean | { enabled?: boolean; color?: string; size?: number };
    lastScanned?: string | null;
}

export interface VisEdge {
    id: string;
    from: string;
    to: string;
    arrows: string;
    color: { color: string; opacity?: number };
    dashes?: boolean;
}

export interface Task {
    startUser: string;
    status: string;
}

export interface StatusMapItem {
    text: string;
    class: string;
}

export interface DropdownItem {
    label: string;
    value: string;
    isDanger?: boolean;
}

export interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    nodeId: string | null;
    connectedNodes: string[];
}

export interface HoverTooltipState {
    visible: boolean;
    x: number;
    y: number;
    nodeId: string | null;
    isScanned: boolean;
    label: string | null;
    lastScanned?: string | null;
}