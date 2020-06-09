import * as vscode from 'vscode';

export class DataAccess {

    private globalData: vscode.Memento;

    constructor(context: vscode.ExtensionContext) {
        this.globalData = context.globalState;
    
    }

    public getData(key: string): any {
        return this.globalData.get(key);
    }

    public setData(key: string, value: any): Thenable<void> {
        return this.globalData.update(key, value);
    }

}