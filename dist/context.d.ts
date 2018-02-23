export interface ContextData {
    models: Object;
    user: Object;
}
export declare const createExpressContext: (data: any, res: any) => Context;
export declare class Context {
    models: Object;
    user: Object;
    constructor(data: ContextData);
    dispose(): void;
}
