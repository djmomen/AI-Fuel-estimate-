export interface Equipment {
    name: string;
    category: string;
}

export interface SelectedItem extends Equipment {
    id: string;
    quantity: number;
    hours: number;
    idleHours: number;
    fuel?: number;
    rate?: number;
    idleRate?: number;
}

export interface Round {
    id: string;
    name: string;
    period: {
        from: string;
        to: string;
    };
    items: SelectedItem[];
    totalFuel: number;
    timestamp: string;
    aiJustification?: string;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'AI' | 'SUCCESS' | 'ERROR';
    message: string;
}