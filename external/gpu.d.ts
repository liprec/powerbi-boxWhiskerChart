// Simple interface definition for gpu.js

declare class GPU {
    public createKernel(f: any, opt?: any): any;
    public addFunction(f: any);
}