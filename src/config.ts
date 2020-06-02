'use strict';

import * as sfcore from '@salesforce/core';
import * as vscode from 'vscode';
import * as util from 'util';
import * as child_process from 'child_process';

export class Config {

    public static readonly promisifiedExec = util.promisify(child_process.exec);
    
    public static async getOrgsInfo(): Promise<any> {
        const { stdout } = await this.promisifiedExec('SFDX_JSON_TO_STDOUT=true sfdx force:org:list --json');
        const jsonOutput = JSON.parse(stdout);
        if(jsonOutput.status === 0) {
            const nonScratchOrgs = jsonOutput.result.nonScratchOrgs || [];
            const scratchOrgs = jsonOutput.result.scratchOrgs || [];
            const orgs = [...nonScratchOrgs, ...scratchOrgs];
            return orgs;
        } else {
            let message = jsonOutput;
            vscode.window.showErrorMessage(jsonOutput);
        }
    }

    public static async getConnection(username: string) {
        const connection = await sfcore.Connection.create({
            authInfo: await sfcore.AuthInfo.create({ username:  username})
        });
        return connection; 
    }

    public static async getObjects(conn : sfcore.Connection) {
        const types = [{type: 'CustomObject'}];
        const metadata = await conn.metadata.list(types, '48.0');
        return metadata;
    }

    public static async fetchFields(conn : any, sObjectName: string) {
        const types = [{type: 'CustomField', folder: sObjectName}];
        const metadata = await conn.metadata.list(types, '48.0');
        let fieldsInfo : any[] = [];
        if(typeof metadata === 'object' && Array.isArray(metadata)) {
            fieldsInfo = [...metadata];
        } else if(typeof metadata === 'object') {
            fieldsInfo.push(metadata);
        }
        return fieldsInfo;
    }
}