export interface ResultFunction<ResulType> {
    (root: any, args: any, context: any, info: any): Promise<ResulType> | ResulType | void;
}
export interface ErrorFunction<ErrorType> {
    (root: any, args: any, context: any, err: any): ErrorType | void;
}
export interface Resolver<ResulType> {
    (root: any, args: {}, context: {}, info: {}): Promise<ResulType>;
    createResolver?: <R, E>(resFn: ResultFunction<R>, errFn?: ErrorFunction<E>) => Resolver<R>;
}
export declare const createResolver: <R, E>(resFn: ResultFunction<R>, errFn: ErrorFunction<E>) => Resolver<R>;
