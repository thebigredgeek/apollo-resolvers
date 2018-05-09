export declare const combineResolvers: (resolvers?: any[]) => any;
export declare const and: (...conditions: any[]) => (resolver: any) => any;
export declare const or: (...conditions: any[]) => (resolver: any) => (...query: any[]) => Promise<{}>;
