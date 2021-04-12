'use strict';

import * as vscode from 'vscode';
import { IbmiFS } from './fileSystemProvider';


export function activate(context: vscode.ExtensionContext) {


    const ibmiFs = new IbmiFS();

   
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('ibmifs', ibmiFs, { isCaseSensitive: false }));
    let initialized = false;

    context.subscriptions.push(vscode.commands.registerCommand('ibmifs.reset', _ => {

        /* 
        for (const [name] of ibmiFs.readDirectory(vscode.Uri.parse('ibmifs:/'))) {
            ibmiFs.delete(vscode.Uri.parse(`ibmifs:/${name}`));
        }
        */
        initialized = false;
    }));

    context.subscriptions.push(vscode.commands.registerCommand('ibmifs.addFile', _ => {
        // TEST BEGIN;
        function showDialog () {
            return async function() {
                return await vscode.window.showQuickPick(
                [
                    { label: 'User', description: 'User Settings', target: vscode.ConfigurationTarget.Global },
                    { label: 'Workspace', description: 'Workspace Settings', target: vscode.ConfigurationTarget.Workspace }
                ],
                { placeHolder: 'Select the view to show when opening a window.' });
            }
        }

        showDialog()
        // TEST END;


        if (initialized) {
            ibmiFs.writeFile(vscode.Uri.parse(`ibmifs:/file.txt`), Buffer.from('foo'), { create: true, overwrite: true });
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('ibmifs.deleteFile', _ => {
        if (initialized) {
            ibmiFs.delete(vscode.Uri.parse('ibmifs:/file.txt'));
        }
    }));
    
    /*
    context.subscriptions.push(vscode.commands.registerCommand('ibmifs.newConnection', _ => {

        console.log("Nwe connection")

        function showDialog () {
            return async function() {
                return await vscode.window.showQuickPick(
                [
                    { label: 'User', description: 'User Settings', target: vscode.ConfigurationTarget.Global },
                    { label: 'Workspace', description: 'Workspace Settings', target: vscode.ConfigurationTarget.Workspace }
                ],
                { placeHolder: 'Select the view to show when opening a window.' });
            }
        }

        showDialog()
    }));
    */

    //vscode.commands.registerCommand('config.commands.configureViewOnWindowOpen', async () => {
    context.subscriptions.push(vscode.commands.registerCommand('ibmifs.newConnection', async () => {

        const result = await vscode.window.showInputBox({
            //value: '',
            //valueSelection: [2, 4],
            placeHolder: 'Enter name of your IBM i',
            /* validateInput: text => {
                vscode.window.showInformationMessage(`Validating: ${text}`);
                return text === '123' ? 'Not 123!' : null;
            }*/
        });
        vscode.window.showInformationMessage(`Got: ${result}`);
        vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('ibmifs:/'), name: result });

    }))

/*
		// 1) Getting the value
		const value = await vscode.window.showQuickPick(
            ['explorer', 'search', 'scm', 'debug', 'extensions'],
             { placeHolder: 'Select the view to show when opening a window.' });

		if (vscode.workspace.workspaceFolders) {

			// 2) Getting the Configuration target
			const target = await vscode.window.showQuickPick(
				[
					{ label: 'User', description: 'User Settings', target: vscode.ConfigurationTarget.Global },
					{ label: 'Workspace', description: 'Workspace Settings', target: vscode.ConfigurationTarget.Workspace }
				],
				{ placeHolder: 'Select the view to show when opening a window.' });

			if (value && target) {

				// 3) Update the configuration value in the target
				await vscode.workspace.getConfiguration().update('conf.view.showOnWindowOpen', value, target.target);

				/*
				// Default is to update in Workspace
				await vscode.workspace.getConfiguration().update('conf.view.showOnWindowOpen', value);
				* /
			}
		} else {

			// 2) Update the configuration value in User Setting in case of no workspace folders
			await vscode.workspace.getConfiguration().update('conf.view.showOnWindowOpen', value, vscode.ConfigurationTarget.Global);
		}


	});

    */

    context.subscriptions.push(vscode.commands.registerCommand('ibmifs.init', _ => {

    
        console.dir("ibmifs.init...");
        if (initialized) {
            return;
        }
        initialized = true;

    }));

    context.subscriptions.push(vscode.commands.registerCommand('ibmifs.workspaceInit', async _ => {

        // TEST END;

        const result = await vscode.window.showInputBox({
            //value: '',
            //valueSelection: [2, 4],
            placeHolder: 'Enter name of your IBM i',
            validateInput: text => {
                vscode.window.showInformationMessage(`Validating: ${text}`);
                return text === '123' ? 'Not 123!' : null;
            }
        });
        vscode.window.showInformationMessage(`Got: ${result}`);
    

        //vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('ibmifs:/'), name: "IbmiFS - Sample" });
        vscode.workspace.updateWorkspaceFolders(0, 0, { 
            uri: vscode.Uri.parse('ibmifs:/'), 
            name: ibmiFs.sysconfig.host
            //user: ibmiFs.sysconfig.user,
            //password: ibmiFs.sysconfig.password,

        });
        console.dir("ibmifs.workspaceInit...");
    }));
}
