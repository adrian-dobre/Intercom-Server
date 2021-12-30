import {BaseEntity} from "../../../../domain/entities/base/BaseEntity";
import {DiskRepository, RepositoryEvent} from "../../base/DiskRepository";


const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');


export class DiskRepositoryImpl<T extends BaseEntity> implements DiskRepository<T> {
    private loaded: boolean = false;
    private readonly saveLocation = path.join(__dirname, '../../../../../__storage', `${this.constructor.name}.json`);
    private entries: T[] = [];
    private index: { [k: string]: number } = {};
    private entityBuilder: { from: (json: T) => T };
    private emitter: NodeJS.EventEmitter;

    constructor(entityBuilder: { from: (json: T) => T }) {
        this.entityBuilder = entityBuilder;
        this.emitter = new EventEmitter();
        this.load();
        const self = this;
        (function persistInterval() {
            setTimeout(() => {
                self.persist()
                    .catch(console.error)
                    .then(persistInterval)
            }, 10000);
        })();

    }

    save(entity: T): Promise<T> {
        return new Promise<T>(resolve => {
            if (this.loaded) {
                const index = this.index[entity.id];
                if (index != undefined) {
                    const previousEntity = this.entries[index];
                    const changedProperties = [];
                    Object.keys(entity)
                        .forEach(property => {
                            if (previousEntity[property] != entity[property]) {
                                changedProperties.push(property);
                            }
                        });
                    this.entries[index] = this.entityBuilder.from({
                        ...previousEntity, ...entity,
                        id: previousEntity.id
                    });
                    if (changedProperties.length) {
                        setTimeout(() => {
                            this.emitter.emit(RepositoryEvent.UPDATE, {entity: this.entries[index], changedProperties});
                        });
                    }
                } else {
                    this.entries.push(entity);
                    this.reIndex();
                }
                return resolve(entity);
            } else {
                setTimeout(() => {
                    this.save(entity).then(() => {
                        resolve(entity);
                    });
                });
            }
        });
    }

    findById = (id: string): Promise<T | null> => {
        return new Promise<null | T>((resolve => {
            if (this.loaded) {
                const index = this.index[id];
                if (index != undefined) {
                    return resolve(this.entityBuilder.from(this.entries[index]));
                }
                return resolve(null);
            }
            setTimeout(() => {
                this.findById(id).then(resolve);
            });
        }))
    }

    findAllByAttributes = (attributes: { [k in keyof Partial<T>]: any }): Promise<T[]> => {
        return new Promise<T[]>(resolve => {
            if (this.loaded) {
                return this.findCandidates(attributes)
                    .then(candidates => {
                        const props = Object.keys(attributes);
                        let searchProp = props.shift();
                        while (candidates.length && searchProp) {
                            candidates = candidates.filter(candidate => candidate[searchProp] === attributes[searchProp]);
                            searchProp = props.shift();
                        }
                        if (searchProp) {
                            candidates = [];
                        }
                        return resolve(candidates);
                    });
            }
            setTimeout(() => {
                this.findAllByAttributes(attributes).then(resolve);
            });
        });
    }

    findByAttributes = (attributes: { [k in keyof Partial<T>]: any }): Promise<T | null> => {
        return this
            .findAllByAttributes(attributes)
            .then(results => results[0] || null)
    }

    remove = (entity: T): Promise<number> => {
        const prevEntriesNo = this.entries.length;
        this.entries = this.entries.filter(entry => entry.id != entity.id);
        this.reIndex();
        return Promise.resolve(prevEntriesNo - this.entries.length);
    }

    on(event: RepositoryEvent, callback: (event: { entity: T, changedProperties: string[] }) => void) {
        this.emitter.on(event, callback);
    }

    private persist = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (this.loaded) {
                fs.writeFile(this.saveLocation, JSON.stringify(this.entries, null, 2), (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            } else {
                setTimeout(() => {
                    this.persist().then(resolve).catch(reject);
                });
            }
        })
    }

    private reIndex = () => {
        this.entries
            .forEach((entry, index) => {
                this.index[entry.id] = index;
            });
    }

    private load = () => {
        if (!this.loaded) {
            fs.readFile(this.saveLocation, (error, file) => {
                if (!error) {
                    try {
                        this.entries = (JSON.parse(file.toString()) as Array<T>).map(entry => this.entityBuilder.from(entry));
                        this.reIndex();
                    } catch (e) {
                        //log err
                    }
                }
                this.loaded = true;
            });
        }
    }

    private findCandidates(attributes: { [k in keyof Partial<T>]: any }): Promise<T[]> {
        return new Promise(resolve => {
            if (attributes.id != undefined) {
                this.findById(attributes.id)
                    .then(result => {
                        let candidates = [];
                        if (result) {
                            candidates.push(result);
                        }
                        resolve(candidates);
                    });
            } else {
                resolve([...this.entries].map(entry => this.entityBuilder.from(entry)));
            }
        });
    }
}