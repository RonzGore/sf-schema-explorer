import * as vscode from 'vscode';
import * as path from 'path';
import * as sfcore from '@salesforce/core';
import { sortBy } from 'lodash';

import { SFMetadata } from './sfMetadata';
import { SOQL } from './soql';
import { Info } from './info';
import { DataAccess } from './localDataAccess';

export class SFSchemaProvider implements vscode.TreeDataProvider<SFTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<SFTreeItem | undefined> = new vscode.EventEmitter<SFTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<SFTreeItem | undefined> = this._onDidChangeTreeData.event;
    private ignoreCache: boolean = true;
	
	readonly CONNECTION_CONTEXT: string = 'connection';
	readonly OBJECT_CONTEXT: string = 'object';
	readonly FIELD_CONTEXT: string = 'field';
	
	private dataAccess: DataAccess;

	constructor(dataAccess: DataAccess) {
		this.dataAccess = dataAccess;
	}

	refresh(): void {
		this.ignoreCache = false;
		this._onDidChangeTreeData.fire(undefined);
	}

	refreshNodeAndChildren(node: SFTreeItem): void {
		console.log('refreshNodeAndChildren');
		node.description = node.description;
		this._onDidChangeTreeData.fire(node);
	}

	showMoreInfo(node: SFTreeItem): void {
		this._onDidChangeTreeData.fire(node);
		Info.showMoreInfo(node);
	}

	getTreeItem(element: SFTreeItem): SFTreeItem {
		return element;
	}

	getChildren(element?: SFTreeItem): Thenable<SFTreeItem[]> {
		if (element) {
			if(element.contextValue === this.OBJECT_CONTEXT) {
				return Promise.resolve(this.getFields(element));
			} else if(element.contextValue === this.CONNECTION_CONTEXT) {
				return Promise.resolve(this.getSObjects(element));
			}  else {
				return Promise.resolve([]);
			}
		} else {
			return Promise.resolve(this.getConnections());
		}

	}

	

	private async getConnections(): Promise<SFTreeItem[]> {
		let connections: any[] | PromiseLike<any[]> = [];
		let orgsInfo: any[];
		try { 
			console.log(this.dataAccess.getData('connections'));
			if(this.dataAccess.getData('connections') && this.ignoreCache) {
				orgsInfo = [...this.dataAccess.getData('connections')];
			} else {
				//const orgs: any[] = await SFMetadata.getOrgsInfo();
				orgsInfo = await SFMetadata.getOrgsInfo();
				this.dataAccess.setData('connections', orgsInfo);
			}
			const sortedOrgs = sortBy(orgsInfo, 'alias');
			for(let count = 0; count< sortedOrgs.length; count++) {
				const  connectionStatus = sortedOrgs[count].connectedStatus === 'Connected'?
					`Connected`: `Disconnected`;
				
				const connection = new SFTreeItem(sortedOrgs[count].alias, sortedOrgs[count].username, vscode.TreeItemCollapsibleState.Collapsed);
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
				connection.connectionStatus = connectionStatus;
				connection.accessToken = sortedOrgs[count].accessToken;
				connection.setContext(this.CONNECTION_CONTEXT);
				connection.moreInfo = sortedOrgs[count];
				connections.push(connection);
			}
			this.ignoreCache = true;
			return connections;
		} catch(error) {
			let message = error.message;
            console.log(message);
            if(message.includes('Command failed: SFDX_JSON_TO_STDOUT=true sfdx force:org:list')) {
				message = 'Something is not right, please make sure you have at least one authenticated org.';
				if(message.includes('command not found')) {
					message = 'It seems SFDX CLI is not found. Please install it from https://developer.salesforce.com/tools/sfdxcli.';
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

	private async getSObjects(element: SFTreeItem) : Promise<SFTreeItem[]> {
		const username = element.username;
		const conn = await SFMetadata.getConnection(username);
		console.log('connection accessToken', conn.accessToken);
		const metadata = await SFMetadata.getObjects(conn);
		const sortedMetadata = metadata;// sortBy(metadata, 'fullName');
		const sObjects: SFTreeItem[] = [];
		element.numberOfChildren = metadata.length || 0;
		if(element.numberOfChildren > 0) {
			element.description = `${element.description} | SObjects:${element.numberOfChildren}`;
		}
		for(let count=0; count < metadata.length; count++ ) {
			const sObject = new SFTreeItem(metadata[count].label, metadata[count].name, 
				vscode.TreeItemCollapsibleState.Collapsed);
			sObject.setIconPath( path.join(__filename, '..', '..', 'resources', 'dark','objects.svg'), 
			path.join(__filename, '..', '..', 'resources', 'dark','objects.svg'));
			sObject.setContext(this.OBJECT_CONTEXT);
			sObject.connection = conn;
			sObject.moreInfo = metadata[count];
			sObject.name = metadata[count].name;
			sObjects.push(sObject);
		}
		return sObjects;
	}

	private async getFields(element: SFTreeItem) : Promise<SFTreeItem[]> {
		const conn = element.connection;
		const sObjectName = element.name;
		const metadata = await SFMetadata.fetchFields(conn, sObjectName);
		const sObjectFields: SFTreeItem[] = [];
		element.numberOfChildren = metadata.length || 0;
		if(element.numberOfChildren > 0) {
			element.description = `${element.description} | Fields:${element.numberOfChildren}`;
		}
		for(let count=0; count < metadata.length; count++ ) {
			let fieldAPIName = metadata[count].name;
			if(metadata[count].relationshipName !== null) {
				fieldAPIName = `${metadata[count].relationshipName}.${fieldAPIName}`;
			}
			const sObjectField = new SFTreeItem(metadata[count].label, 
				fieldAPIName, vscode.TreeItemCollapsibleState.None);
			sObjectField.setCommand({
					command: 'extension.insertField',
					title: '',
					arguments: [sObjectField]});
			sObjectField.parentNode = sObjectName;
			sObjectField.moreInfo = metadata[count];
			sObjectField.setIconPath( path.join(__filename, '..', '..', 'resources', 'dark', 'fields.svg'), 
			path.join(__filename, '..', '..', 'resources', 'dark', 'fields.svg'));
			sObjectField.setContext(this.FIELD_CONTEXT);
			sObjectFields.push(sObjectField);
		}
		return sObjectFields;
	}

	public async checkConnectionStatus(element: SFTreeItem) {
		let message = 'This is a valid connection';
		
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Checking Connection Status......",
			cancellable: false
		},async (progress: any, token: any) => {
			console.log(progress, token);
			try {
				const conn = await SFMetadata.getConnection(element.username);
				await SFMetadata.getObjects(conn); // This line is just to check connection validity
				vscode.window.showInformationMessage(message, {modal: false});
			} catch(error) {
				message = 'This connection is no longer valid';
				vscode.window.showErrorMessage(message, {modal: false});
			}
		});
			
	}

	activateTreeViewEventHandlers = (treeView: vscode.TreeView<vscode.TreeItem>): void => {
		
	// 	treeView.onDidExpandElement(
	// 	  (event: any): Promise<any> => {
	// 		console.log('Tree item was expanded:', event.element.label);
	// 		console.log('Tree item was expanded:', event.element.context);
	// 		return new Promise((resolve, reject) => {
	// 		    if(event.element.contextValue === this.CONNECTION_CONTEXT) {
	// 				this.getSObjects(event.element).then(
	// 					() => {
						
	// 					this._onDidChangeTreeData.fire(event.element);;
			
	// 					resolve(true);
	// 					},
	// 					(err: Error) => {
	// 						reject(err);
	// 					});
	// 		    } else if(event.element.contextValue === this.OBJECT_CONTEXT) {
	// 				this.getFields(event.element).then(
	// 					() => {
						
			
	// 					this._onDidChangeTreeData.fire(event.element);;
			
	// 					resolve(true);
	// 					},
	// 					(err: Error) => {
	// 						reject(err);
	// 					});
	// 		   }
	// 		});
	// 	});

		treeView.onDidChangeSelection((event: any) => {
			console.log(event.selection.length);
			const CONFIG = vscode.workspace.getConfiguration('Explorer');
			if(CONFIG.get('Multiselect')) {
				SOQL.prepareSOQLForMultiSelect(event.selection);
			}
			// Else do nothing
		});
	};

	
};

export class SFTreeItem extends vscode.TreeItem {
	
	public username: string = '';
	public accessToken: string = '';
	connection: any;
	public parentNode: string = '';
	public moreInfo: object = {};
	public numberOfChildren: number = 0;
	public connectionStatus: string = '';
	public name: string = '';

	constructor(
		public readonly label: string,
		public description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command,
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		const status = this.connectionStatus === ''?'':`| Status:${this.connectionStatus}`;
		return `${this.label} | ${this.description} ${status}`;
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

export class SFSchemaExplorer {
	private sfSchemaViewer: vscode.TreeView<SFTreeItem>;
	private treeDataProvider: SFSchemaProvider;
	private dataAccess: DataAccess;

	constructor(context: vscode.ExtensionContext) {
		// Creating a tree view with the right data provider
		this.dataAccess = new DataAccess(context);
		this.treeDataProvider = new SFSchemaProvider(this.dataAccess);
		
		this.sfSchemaViewer = vscode.window.createTreeView('schemaExplorer', { treeDataProvider: this.treeDataProvider,
		canSelectMany: true });
		this.treeDataProvider.activateTreeViewEventHandlers(this.sfSchemaViewer);

		Info.context = context;
		
		// Registering commands
		vscode.commands.registerCommand('schemaExplorer.refreshEntry', () => this.treeDataProvider.refresh());
		vscode.commands.registerCommand('schemaExplorer.refreshNodeAndChildren', (node: SFTreeItem) => this.treeDataProvider.refreshNodeAndChildren(node));
		// Todo: Implement in next version - describe field info and object info in a web-view within VSCode
		vscode.commands.registerCommand('schemaExplorer.moreInfo', (node: SFTreeItem) => this.treeDataProvider.showMoreInfo(node));
		vscode.commands.registerCommand('schemaExplorer.checkStatus', (node: SFTreeItem) => this.treeDataProvider.checkConnectionStatus(node));
		vscode.commands.registerCommand('schemaExplorer.insertObject', (node: SFTreeItem, nodes: SFTreeItem[]) => SOQL.prepare(node, nodes));
		vscode.commands.registerCommand('extension.insertField', (node: SFTreeItem, nodes: SFTreeItem[]) => SOQL.prepare(node, nodes));
	}
}