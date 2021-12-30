import {BaseEntity} from "../../../domain/entities/base/BaseEntity";

export enum RepositoryEvent {
    UPDATE = 'UPDATE'
}

export interface DiskRepository<T extends BaseEntity> {

    save(entity: T): Promise<T>;
    findById(id: string): Promise<T | null>;
    findAllByAttributes(attributes: { [k in keyof Partial<T>]: any }): Promise<T[]>;
    findByAttributes(attributes: { [k in keyof Partial<T>]: any }): Promise<T | null>;
    remove(entity: T): Promise<number>;
    on(event: RepositoryEvent, callback: (event: {entity:T, changedProperties: string[]}) => void);
}