// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Activation ACS ');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.ibmiRunSqlFromAcs', (p1) => {

		// Run the ACS plugin for SQL
		const config = vscode.workspace.getConfiguration("ibm-i-run-sql-from-acs")
		const host:string    = config.get('host')   || '' 
		const schema:string  = config.get('schema') || ''
		const acsjar:string  = config.get('acsjar') || ''
		
		if ( (host <= '') ||  (schema <= '')) {
			vscode.window.showInformationMessage('You need to set the host and schema in "IBM i open SQL with ACS" workspace')
			return
		}

		// const rc = cp.exec(`java -jar /usr/local/ibmiaccess/acsbundle.jar /plugin=rss /autorun=0 /database=${schema} /system=${host} /file="${p1.path}"`, (err: string, stdout: string, stderr: string) => {
		
		const rc = cp.exec(`java -jar ${acsjar} /plugin=rss /autorun=0 /database=${schema} /system=${host} /file="${p1.path}"`, (err: any , stdout: string, stderr: string) => {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (err) {
				console.log('error: ' + err);
			}
		});
	});
	
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
