import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { SFAPIOperations } from './sfAPIOperations';
import { SFTreeItem } from './schemaExplorer';
import { Constants } from './constants';
import { FileUtil } from './fileUtil';

export class Info {
    
    public static context: vscode.ExtensionContext;
    public util: FileUtil = new FileUtil(Info.context);

    private async getMoreInfo(node: SFTreeItem) {
        let moreInfo = node.moreInfo;
        if(node.contextValue === Constants.OBJECT_CONTEXT) {
            const objectInfo = await SFAPIOperations.describeObject(node.connection, node.name);
            delete objectInfo.fields;
            moreInfo = objectInfo;
        }
        return moreInfo;
    }

    public async showMoreInfo(node: SFTreeItem) {
        const moreInfo = await this.getMoreInfo(node);
        this.util.displayContentInFile(JSON.stringify(moreInfo, null, 2), 'Info.json');
    }
}
