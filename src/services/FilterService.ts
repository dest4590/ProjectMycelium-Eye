export interface NodeContext {
    id: string;
    label: string;
    scanned: boolean;
    inDegree: number;
    outDegree: number;
    degree: number;
}

export type FilterFunction = (node: NodeContext) => boolean;

export class FilterService {
    /**
     * Parses a filter query string into a function that can be used to filter nodes.
     * Supports:
     * - Numerical comparisons: in-degree > 3, degree < 10, out-degree = 5
     * - Boolean flags: scanned, !scanned
     * - String contains: label contains "admin"
     * - Logical operators: & (AND), | (OR)
     * - Negation: !
     * - Parentheses for grouping: (in-degree > 3 & scanned) | label contains "root"
     */
    public static parse(query: string): FilterFunction {
        if (!query.trim()) return () => true;

        try {
            return this.parseExpression(query.trim());
        } catch (error) {
            console.error('Filter parsing error:', error);
            throw new Error(
                `Invalid filter syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    private static parseExpression(query: string): FilterFunction {
        const orParts = this.splitByOperator(query, '|');
        if (orParts.length > 1) {
            const fns = orParts.map((p) => this.parseExpression(p));
            return (node) => fns.some((fn) => fn(node));
        }

        const medicalParts = this.splitByOperator(query, '&');
        if (medicalParts.length > 1) {
            const fns = medicalParts.map((p) => this.parseExpression(p));
            return (node) => fns.every((fn) => fn(node));
        }

        let trimmed = query.trim();

        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            const inner = trimmed.slice(1, -1);
            if (this.isBalanced(inner)) {
                return this.parseExpression(inner);
            }
        }

        if (trimmed.startsWith('!')) {
            const inner = trimmed.slice(1).trim();
            const fn = this.parseExpression(inner);
            return (node) => !fn(node);
        }

        return this.parseCondition(trimmed);
    }

    private static splitByOperator(query: string, operator: string): string[] {
        const parts: string[] = [];
        let current = '';
        let depth = 0;

        for (let i = 0; i < query.length; i++) {
            const char = query[i];
            if (char === '(') depth++;
            else if (char === ')') depth--;

            if (depth === 0 && char === operator) {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current);
        return parts.map((p) => p.trim()).filter((p) => p.length > 0);
    }

    private static isBalanced(query: string): boolean {
        let depth = 0;
        for (const char of query) {
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (depth < 0) return false;
        }
        return depth === 0;
    }

    private static parseCondition(condition: string): FilterFunction {
        if (condition === 'scanned') {
            return (node) => node.scanned;
        }

        const comparisonMatch = condition.match(
            /^(in-degree|out-degree|degree|label)\s*([<>=]|contains)\s*(.+)$/,
        );
        if (comparisonMatch) {
            const [, metric, op, value] = comparisonMatch;
            const trimmedValue = value.trim().replace(/^["']|["']$/g, '');

            if (metric === 'label') {
                if (op === 'contains') {
                    return (node) =>
                        node.label
                            .toLowerCase()
                            .includes(trimmedValue.toLowerCase());
                }
                if (op === '=') {
                    return (node) =>
                        node.label.toLowerCase() === trimmedValue.toLowerCase();
                }
            } else {
                const numValue = parseFloat(trimmedValue);
                if (isNaN(numValue))
                    throw new Error(`Invalid numeric value: ${trimmedValue}`);

                return (node) => {
                    const nodeVal = (node as any)[
                        metric.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
                    ] as number;
                    if (op === '>') return nodeVal > numValue;
                    if (op === '<') return nodeVal < numValue;
                    if (op === '=') return nodeVal === numValue;
                    return false;
                };
            }
        }

        throw new Error(`Unknown condition: ${condition}`);
    }
}
