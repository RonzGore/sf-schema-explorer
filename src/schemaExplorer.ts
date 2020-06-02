import * as vscode from 'vscode';
import * as path from 'path';
import * as sfcore from '@salesforce/core';
import { sortBy } from 'lodash';

import { Config } from './config';

export class SFSchemaProvider implements vscode.TreeDataProvider<SFTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<SFTreeItem | undefined> = new vscode.EventEmitter<SFTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<SFTreeItem | undefined> = this._onDidChangeTreeData.event;

	readonly CONNECTION_CONTEXT: string = 'connection';
	readonly OBJECT_CONTEXT: string = 'object';
	readonly FIELD_CONTEXT: string = 'field';


	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	refreshNodeAndChildren(node: SFTreeItem): void {
		this._onDidChangeTreeData.fire(node);
	}

	getTreeItem(element: SFTreeItem): SFTreeItem {
		return element;
	}

	getChildren(element?: SFTreeItem): Thenable<SFTreeItem[]> {
		if (element) {
			if(element.contextValue === this.OBJECT_CONTEXT) {
				return Promise.resolve(this.getFields(element.connection, element.label));
			} else if(element.contextValue === this.CONNECTION_CONTEXT) {
				return Promise.resolve(this.getSObjects(element.username));
			}  else {
				return Promise.resolve([]);
			}
		} else {
			return Promise.resolve(this.getConnections());
		}

	}

	private async getConnections(): Promise<SFTreeItem[]> {
		const connections: any[] | PromiseLike<any[]> = [];
		try { 
			const orgs: any[] = await Config.getOrgsInfo();
			const sortedOrgs = sortBy(orgs, 'alias');
			for(let count = 0; count< sortedOrgs.length; count++) {
				const  description = sortedOrgs[count].connectedStatus === 'Connected'?
					`${sortedOrgs[count].username}-Connected`: `${sortedOrgs[count].username}-Disconnected`;
				
				const connection = new SFTreeItem(sortedOrgs[count].alias, description, vscode.TreeItemCollapsibleState.Collapsed);
				if(sortedOrgs[count].connectedStatus !== 'Connected' && 
					sortedOrgs[count].connectedStatus !== 'Unknown') {
					connection.setIconPath(path.join(__filename, '..', '..', 'resources', 'dark',
					'disconnected.svg'), path.join(__filename, '..', '..', 'resources', 'dark',
					'disconnected.svg'));
				}
				if(sortedOrgs[count].connectedStatus === 'Unknown' && 
					sortedOrgs[count].status !== 'Active') {
					connection.setIconPath(path.join(__filename, '..', '..', 'resources', 'dark',
					'disconnected.svg'), path.join(__filename, '..', '..', 'resources', 'dark',
					'disconnected.svg'));
				}

				connection.username = sortedOrgs[count].username;
				connection.accessToken = sortedOrgs[count].accessToken;
				connection.setContext(this.CONNECTION_CONTEXT);
				connections.push(connection);
			}
			return connections;
		} catch(error) {
			let message = error.message;
            console.log(message);
            if(message.includes('Command failed: SFDX_JSON_TO_STDOUT=true sfdx force:org:list')) {
				message = 'Something is not right, please make sure you have at least one authenticated org.'
				if(message.includes('command not found')) {
					message = 'It seems SFDX CLI is not found. Please install it from https://developer.salesforce.com/tools/sfdxcli.'
					vscode.window.showErrorMessage(message, {modal: true});
					return connections;
				}
				vscode.window.showInformationMessage(message);
				return connections;
			}
			vscode.window.showErrorMessage(message);
			return connections;
        }
	}

	private async getSObjects(username: string) : Promise<SFTreeItem[]> {
		const conn = await Config.getConnection(username);
		console.log('connection accessToken', conn.accessToken);
		const metadata = await Config.getObjects(conn);
		const sortedMetadata = sortBy(metadata, 'fullName');
		const sObjects: SFTreeItem[] = [];
		for(let count=0; count < sortedMetadata.length; count++ ) {
			const sObject = new SFTreeItem(sortedMetadata[count].fullName, sortedMetadata[count].fullName, 
				vscode.TreeItemCollapsibleState.Collapsed);
			sObject.setIconPath( path.join(__filename, '..', '..', 'resources', 'dark','objects.svg'), 
			path.join(__filename, '..', '..', 'resources', 'dark','objects.svg'));
			sObject.setContext(this.OBJECT_CONTEXT);
			sObject.connection = conn;
			sObjects.push(sObject);
		}
		return sObjects;
	}

	private async getFields(conn: sfcore.Connection, sObjectName: string) : Promise<SFTreeItem[]> {
		const metadata = await Config.fetchFields(conn, sObjectName);
		const sortedMetadata = sortBy(metadata, 'fullName');
		const sObjectFields: SFTreeItem[] = [];
		for(let count=0; count < sortedMetadata.length; count++ ) {
		const metadata = await Config.fetchFields(conn, sObjectName);
			const sObjectField = new SFTreeItem(sortedMetadata[count].fullName.replace(`${sObjectName}.`, ''), 
				sortedMetadata[count].fullName, vscode.TreeItemCollapsibleState.None);
			sObjectField.setCommand({
					command: 'extension.insertField',
					title: '',
					arguments: [sObjectField]});
			sObjectField.parentNode = sObjectName;
			sObjectField.setIconPath( path.join(__filename, '..', '..', 'resources', 'dark', 'fields.svg'), 
			path.join(__filename, '..', '..', 'resources', 'dark', 'fields.svg'));
			sObjectField.setContext(this.FIELD_CONTEXT);
			sObjectFields.push(sObjectField);
		}
		return sObjectFields;
	}

	public checkConnection(node: SFTreeItem) {
		node.setDescription(`${node.description}-Inactive`);
	}
}

export class SFTreeItem extends vscode.TreeItem {
	
	public username: string = '';
	public accessToken: string = '';
	connection: any;
	public parentNode: string = '';

	constructor(
		public readonly label: string,
		public description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command,
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `${this.label}-${this.description}`;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'connection.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'connection.svg')
	};

	public setIconPath(light: string, dark: string): void {
		this.iconPath.light = light || dark;
		this.iconPath.dark = dark || light;
	}

	public setContext(context: string): void {
		this.contextValue = context;
	}
	
	public setCommand(command: vscode.Command) {
		this.command = command;
	}

	public setDescription(description: string) {
		this.description = description;
	}
}