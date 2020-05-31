'use strict';

import * as sfcore from '@salesforce/core';
import * as vscode from 'vscode';
import * as path from 'path';
import * as util from 'util';
import * as child_process from 'child_process';

export class Config {

    public static readonly promisifiedExec = util.promisify(child_process.exec);
    
    public static async getOrgsInfo() {
        const { stdout } = await this.promisifiedExec('SFDX_JSON_TO_STDOUT=true sfdx force:org:list --json');
        console.log('output: ', stdout);
        const jsonOutput = JSON.parse(stdout);
        if(jsonOutput.status === 0) {
            const nonScratchOrgs = jsonOutput.result.nonScratchOrgs || [];
            const scratchOrgs = jsonOutput.result.scratchOrgs || [];
            const orgs = [];
            orgs.push(nonScratchOrgs);
            orgs.push(scratchOrgs);
            return orgs;
        } else {
            vscode.window.showErrorMessage(jsonOutput);
        }
    }

    public static async getAllOrgs(): Promise<string[]> {
        const authFiles = await sfcore.AuthInfo.listAllAuthFiles();
        const orgs = authFiles.map(authfile => authfile.replace('.json', ''));
        return orgs;
    }

    public static async getAllAliases(): Promise<sfcore.Aliases> {
        const aliases = await sfcore.Aliases.create(sfcore.Aliases.getDefaultOptions());
        return aliases;
    }

    public static async getAllOrgAliases(): Promise<string[]> {
        const orgAlias = [];
        const orgs = await this.getAllOrgs();
        const aliases = await this.getAllAliases();
        // Map the aliases onto the orgs
        for (const org of orgs) {
            if(aliases.getKeysByValue(org)) {
                orgAlias.push( aliases.getKeysByValue(org) + ':' + org );
            }
        }
        return orgAlias;
    }

    public static async getDefaultConnection(): Promise<any> {
        let defaultusername = await Config.getDefaultUsername();
        const connection = await sfcore.Connection.create({
            authInfo: await sfcore.AuthInfo.create({ username:  defaultusername})
        });
        return connection;  
    }

    public static async getDefaultUsername() {
        if(vscode.workspace && vscode.workspace.workspaceFolders) {
            const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const myLocalConfig = await sfcore.ConfigFile.create({
                isGlobal: false,
                rootFolder: path.join(rootPath, '.sfdx'),
                filename: 'sfdx-config.json'
            });
            const localValue = myLocalConfig.get('defaultusername');
            let defaultusername = await sfcore.Aliases.fetch(JSON.stringify(localValue).replace(/\"/g, ''));
            return defaultusername;
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
        const meta = metadata[0];
        console.log('metadata count: ' + metadata.length);
        console.log('createdById: ' + meta.createdById);
        console.log('createdByName: ' + meta.createdByName);
        console.log('createdDate: ' + meta.createdDate);
        console.log('fileName: ' + meta.fileName);
        console.log('fullName: ' + meta.fullName);
        console.log('id: ' + meta.id);
        console.log('lastModifiedById: ' + meta.lastModifiedById);
        console.log('lastModifiedByName: ' + meta.lastModifiedByName);
        console.log('lastModifiedDate: ' + meta.lastModifiedDate);
        console.log('manageableState: ' + meta.manageableState);
        console.log('namespacePrefix: ' + meta.namespacePrefix);
        console.log('type: ' + meta.type);
        return metadata;
    }

    public static async fetchFields(conn : sfcore.Connection, sObjectName: string) {
        const types = [{type: 'CustomObject', folder: sObjectName}];
        const metadata = await conn.metadata.list(types, '48.0');
        const meta = metadata[0];
        console.log('metadata count: ' + metadata.length);
        console.log('createdById: ' + meta.createdById);
        console.log('createdByName: ' + meta.createdByName);
        console.log('createdDate: ' + meta.createdDate);
        console.log('fileName: ' + meta.fileName);
        console.log('fullName: ' + meta.fullName);
        console.log('id: ' + meta.id);
        console.log('lastModifiedById: ' + meta.lastModifiedById);
        console.log('lastModifiedByName: ' + meta.lastModifiedByName);
        console.log('lastModifiedDate: ' + meta.lastModifiedDate);
        console.log('manageableState: ' + meta.manageableState);
        console.log('namespacePrefix: ' + meta.namespacePrefix);
        console.log('type: ' + meta.type);
        return metadata;
    }
}