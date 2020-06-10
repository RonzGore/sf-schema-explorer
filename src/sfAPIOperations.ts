'use strict';

import * as sfcore from '@salesforce/core';
import * as vscode from 'vscode';
import * as util from 'util';
import * as child_process from 'child_process';

export class SFAPIOperations {

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
        const metadata = await (await conn.describeGlobal()).sobjects;
        return metadata;
    }

    public static async describeObject(conn : any, sObjectName: string) {
        console.log(sObjectName);
        const objectInfo = await conn.describe(sObjectName);
        return objectInfo;
    }

    public static async fetchFields(conn : any, sObjectName: string) {
        console.log(sObjectName);
        const fieldsInfo = await (await conn.describe(sObjectName)).fields;
        return fieldsInfo;
    }

    // function for opening connection based on username provided
    public static async openConnection(userName: string) {
        
        vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `Opening org with username: "${userName}" ......`,
			cancellable: false
		},async (progress: any, token: any) => {
			console.log(progress, token);
			try {
				const { stdout } = await this.promisifiedExec('SFDX_JSON_TO_STDOUT=true sfdx force:org:open -u '+ userName +' --json');
                const jsonOutput = JSON.parse(stdout);
                console.log(jsonOutput);
			} catch(error) {
				vscode.window.showErrorMessage(error.message, {modal: false});
			}
		});
    }

}