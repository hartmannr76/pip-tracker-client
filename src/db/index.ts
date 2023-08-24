import Dexie, { Table } from 'dexie';

export interface SnapshotRecord {
    id?: number,
    imageData?: string,
    boundingBoxProps: string,
    imageWidth: number,
    imageHeight: number,
    total: number,
}

export class SnapshotRecordStore extends Dexie {
    snapshotRecords!: Table<SnapshotRecord>;

    constructor() {
        super('pipTracker');
        this.version(1).stores({
            snapshotRecords: '++id,imageData,boundingBoxProps,imageWidth,imageHeight'
        });
    }
}

export const db = new SnapshotRecordStore();