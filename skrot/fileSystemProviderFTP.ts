
// /*---------------------------------------------------------------------------------------------
//  *  Copyright (c) Microsoft Corporation. All rights reserved.
//  *  Licensed under the MIT License. See License.txt in the project root for license information.
//  *--------------------------------------------------------------------------------------------*/

// import * as fs from 'fs';
// import * as path from 'path';
// import * as vscode from 'vscode';
// import { createConnection } from 'net'
// import * as Client from 'ftp';
// import * as iconv from 'iconv-lite'
// import { unlink } from 'fs';
// import { networkInterfaces, endianness } from 'os';

// // Patched for the FTP module missing i.e. RCMD function
// Client.prototype.rawcmd = function(cmd:string , cb: any) {
//     this._send(cmd, cb);
// };

// export class File implements vscode.FileStat {

//     type: vscode.FileType;
//     ctime: number;
//     mtime: number;
//     size: number;

//     name: string;
//     data?: Uint8Array;

//     constructor(name: string) {
//         this.type = vscode.FileType.File;
//         this.ctime = Date.now();
//         this.mtime = Date.now();
//         this.size = 0;
//         this.name = name;
//     }
// }

// export class Directory implements vscode.FileStat {

//     type: vscode.FileType;
//     ctime: number;
//     mtime: number;
//     size: number;

//     name: string;
//     entries: Map<string, File | Directory>;

//     constructor(name: string) {
//         this.type = vscode.FileType.Directory;
//         this.ctime = Date.now();
//         this.mtime = Date.now();
//         this.size = 0;
//         this.name = name;
//         this.entries = new Map();
//     }
// }

// export type Entry = File | Directory;

// export class IbmiFS implements vscode.FileSystemProvider {

//     root = new Directory('');
//     client = new Client();
//     sysconfig: any;


//     constructor() {


//         let rootpath = __dirname + "/../../"; // !!!TODO !!
//         console.log(vscode.env.appRoot);

//         try {
//             // this.sysconfig = fs.readFileSync(rootpath +  "/sysconfig.json").toString().toJSON();
//             this.sysconfig = require(rootpath + "/sysconfig.json");
//         }
//         catch (error) {
//             console.error(error);
//         }

//         console.dir(this.sysconfig);


//         this.client.connect({
//             host: this.sysconfig.host,
//             user: this.sysconfig.user,
//             password: this.sysconfig.password,
//         });

//         this.client.on('ready', () => {
//             console.log("Connection ready")
//             this.buildProc()
//             this.client.rawcmd("TYPE C 1208", (error: Error, responseText: string) => {
//                 if (error) throw error
//                 console.log(responseText )
//             })
//                 /*
//             this.client.site("NAMEFMT '1'", (_error: Error, _responseText: string, _responseCode: number) => {
//                 console.log("Site : " + responseText)
//                 /*
//                 this.client.status((error: Error, responseText: string) => {
//                     console.log("Site : " + responseText)
//                 });
//                 * /
//                 /*
//                 this.client.cwd("QSYS.LIB" , (_error: Error, responseText: string | undefined) => {
//                 //this.client.cwd(this.cwd, (_error: Error, responseText: string | undefined) => {
//                     console.log("pwd : " + responseText)
//                 });
//                 * /
//                /* 
//                 this.client.ascii( (_error: Error) => {
//                     console.log("Error setting to ASCII: " + Error.toString())
//                 });
//                 * /
//             });
//             */

//         })
//     }

//     // --- manage file metadata
//     stat(uri: vscode.Uri): vscode.FileStat {
//         console.log('Stat:' + uri.fsPath);
//         return new  ibmiStat (uri.fsPath);
//     }

//     /*
//     stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
//         return this._stat(uri.fsPath);
//     }
//     */
//     /*
//     async _stat(path: string): Promise<vscode.FileStat> {
//         const res = await _.statLink(path);
//         return new FileStat(res.stat, res.isSymbolicLink);
//     }
//     */
//     readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
//         return this._readDirectory(uri);
//     }
// /*
// readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
//         console.log('Load: ' + uri.fsPath);
//         if (uri.fsPath == '/') {
//             const result: [string, vscode.FileType][] = [];
//             result.push(['/QSYS.LIB/', vscode.FileType.Directory]);
//             return this.log(result);
        
//         } else if (uri.fsPath == '/QSYS.LIB/') {
//             const result: [string, vscode.FileType][] = [];
//             result.push([ this.sysconfig.filter[0].library + '.LIB/' , vscode.FileType.Directory]);
//             //result.push([ uri.fsPath + '/' + this.sysconfig.filter[0].library + '.LIB' , vscode.FileType.Directory]);
//             return this.log(result);
            
//         } else if (uri.fsPath == '/QSYS.LIB/') {
//         //} else if (uri.fsPath == '/QSYS.LIB/' + this.sysconfig.filter[0].library+ '.LIB/') {
//             const result: [string, vscode.FileType][] = [];
//             for (let i = 0; i < this.sysconfig.filter.length; i++) {
//                 const child = this.sysconfig.filter[i];
//                 const dirent = uri.fsPath  + child.file + '.FILE';
//                 //const dirent = child.file + '.FILE';
//                 //console.log("My dirs" + dirent);
//                 result.push([dirent, vscode.FileType.Directory]);
//             }
//             return this.log(result);
//         } else {
//             console.log("Get list" + uri.fsPath);
//             return this._readDirectory(uri);
//         }
//     }
// */

//     lookupdirent(entry:string, dirent:[string,vscode.FileType][]): number {
//         for (let i:number=0; i<dirent.length; i++) {
//             if (dirent[i][0] == entry) {
//                 return i;
//             }
//         }
//         return -1
//     }  


//     async _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
//         console.log("Open of:" + uri.fsPath);
//         const result: [string, vscode.FileType][] = [];
//         const pathDepth = uri.fsPath == '/' ? 0 : uri.fsPath.split("/").length -1;


//         switch (pathDepth) {
//             // Root
//             case 0: { 
//                 const result: [string, vscode.FileType][] = [];
//                 result.push(['QSYS.LIB', vscode.FileType.Directory]);
//                 return Promise.resolve(result);
//             }
//             // Libraries 
//             case 1: {
//                 const result: [string, vscode.FileType][] = [];    
//                 for (let i = 0; i < this.sysconfig.filter.length; i++) {
//                     const child = this.sysconfig.filter[i];
//                     //const dirent = uri.fsPath  + child.file + '.FILE';
//                     const dirent = child.library;
//                     if (this.lookupdirent (dirent , result) == -1) {
//                         result.push([ dirent + '.LIB', vscode.FileType.Directory ]);
//                     } 
//                 }
//                 return Promise.resolve(result);
//             }
//             // Files
//             case 2: {
//                 const result: [string, vscode.FileType][] = [];
//                 const lib: string = uri.fsPath.split("/")[2];
//                 for (let i = 0; i < this.sysconfig.filter.length; i++) {
//                     const child = this.sysconfig.filter[i];
//                     if  (lib == child.library + '.LIB') {
//                         const dirent = child.file;
//                         //const dirent = uri.fsPath  + child.file + '.FILE';
//                         if (this.lookupdirent (dirent , result) == -1) {
//                             result.push([dirent + '.FILE', vscode.FileType.Directory ]);
//                         }
//                     }
//                 }
//                 return Promise.resolve(result);
//             }
//             case 3: {
//                 const children = await this.readdir(uri.fsPath); 
//                 for (let i = 0; i < children.length; i++) { 
//                     const child = children[i];
//                     //console.dir(child);
//                     //const stat = await this._stat(path.join(uri.fsPath, child));
//                     //result.push([ child.name, child.type == 'd' ? vscode.FileType.Directory : vscode.FileType.File]);
//                     result.push([ child.name, vscode.FileType.File]);
//                 }
//                 return Promise.resolve(result);
//             }
//         }
//     }

// /* 
// */ 
//     runSQL (sqlstmt:string , cb:(_err: any)=>void) {
        
//         const cmd = `RCMD runsql sql('${sqlstmt.replace(/\'/g,"''")}') COMMIT(*NONE)`
//         console.log (cmd)

//         // this.client.rcmd ("chgjob CHGJOB LOG(4 00 *MSG) LOGCLPGM(*YES)" , (_err: any) => {});
//         this.client.rawcmd ( cmd, (_err: any) => {
//             cb(_err) 
//         })
//     }

    

//     buildProc () {
//         return
//         const sql = `
//         create or replace procedure qusrsys.vscServ001 (
//             in action varchar(16),
//             in lib char(10) default null,
//             in fil char(10) default null,
//             in mbr char(10) default null,
//             in mbrtype char(10) default null
//         )   
//         set option commit=*none, datfmt=*iso
//         begin 
        
//             create or replace table qtemp.vscService (response char(256) ccsid 1208);
//             delete from qtemp.vscService;
        
//             if action = 'CATALOG' then 
//                 insert into qtemp.vscService ( values ( '[')); 
//                 insert into qtemp.vscService (
//                         Select '{"file":"'  
//                             concat trim (TABLE_PARTITION) 
//                             concat '.' concat trim(ifnull(source_type, 'UNKNOWN')) 
//                             concat  '","size":'  
//                             concat varchar(number_ROWS * avgrowsize)  
//                             concat  ',"ctime":"'  
//                             concat TO_CHAR(CREATE_TIMESTAMP, 'YYYY-MM-DD HH:MM:SS') 
//                             concat  '","mtime":"' 
//                             concat TO_CHAR(LAST_SOURCE_UPDATE_TIMESTAMP, 'YYYY-MM-DD HH:MM:SS') 
//                             concat  '"},' as rowdata
//                         from table(qsys2.partition_statistics(lib , fil )) a 
//                         where  (mbr is null or system_table_member like replace(trim(mbr) ,'*' , '%'))
//                         and   (mbrtype is null or source_type like replace(trim(mbrtype) ,'*' , '%')));
//                 insert into qtemp.vscService ( values ( 'null]'));
//             end if; 
//         end;
//         `

//         this.runSQL (sql, (_err:any)=>{
//             if (_err) throw _err;
//          });
    
//     }

//     readdir(path: string): Promise<Client.ListingElement[]> {
//         console.log(".. read dir .. " + path);
//         const patha = path.split('/');

//         const lib  = patha[2].split('.')[0];
//         const fil = patha[3].split('.')[0];

//         return new Promise<Client.ListingElement[]>((resolve, _reject) => {
//             this.runSQL(`call qusrsys.vscServ001 (action=>'CATALOG',lib=>'${lib}',fil=>'${fil}') ` ,(_err: any) => {
//                 if (_err) throw _err;
//                 this.client.binary( (_err:any) => {
//                     if (_err) throw _err;
//                     this.client.get ("/QSYS.LIB/QTEMP.LIB/VSCSERVICE.FILE/VSCSERVICE.MBR" , (_err:any, stream) => {
                        
//                         if (_err) throw _err;
                        
//                         let buf = '';
                        
//                         stream.on('error', (chunk:any) => {
//                             if (_err) throw _err;
//                         });

//                         stream.setEncoding('utf-8');

//                         stream.on('data', (chunk:any) => {
//                             buf += chunk.toString();
//                         });
//                         stream.on('end', ()=> {
//                             let resarr:Client.ListingElement[] = []; 
//                             let res = JSON.parse(buf);
//                             for (let row in  res) {
//                                 let currow = res[row]
//                                 if (currow) {
//                                     // const filename = "/QSYS.LIB/" + lib.trim() + ".LIB/" + currow.file.split(".")[0] + '.MBR'
//                                     let entity:Client.ListingElement = {
//                                         name : currow.file,
//                                     //    name : "/QSYS.LIB/" + lib.trim() + ".LIB/" + currow.file,
//                                         type : 'f',
//                                         size : currow.size,
//                                         date : currow.ctime
//                                     }
//                                     resarr.push(entity)
//                                 }
//                             }
//                             resolve(resarr);
//                         });
//                     })
//                 })
//             })
//         })
 
//         /* WORKS !!!  
//         return new Promise<Client.ListingElement[]>((resolve, _reject) => {
//             this.client.list(path, (_err, l) => {
//                 console.log(".... get data" )
//                 resolve(l);
//             });
//         })
//         */
//     }

//     /*
//             function) {
//                 if (err) throw err;
//                 console.dir(list);
//                 c.end();
//               });

//             fs.readdir(path, (error, children) => handleResult(resolve, reject, error, normalizeNFC(children)));
//         });
//     }
//     */


//     // --- manage file contents

//     readFile(uri: vscode.Uri): Buffer  | Thenable<Buffer> {
//         if (uri.fsPath == uri.fsPath.toLowerCase()) {
//             const fullName = "/Users/nli/workspace"  + uri.fsPath    // TODO !!!
//             console.log("Read" + fullName)
//             return fs.readFileSync(fullName);
//         }
//         return this._readfile(uri.fsPath);
//     }

//     async _readfile(path: string): Promise<Buffer > {
//         return Promise.resolve(await this.filereader(path)); 
//     }

//     convertName(path: string) {
//         const fa = path.split('/')
//         const fileName = '/' 
//             + fa[1].split('.')[0] + '.LIB/' 
//             + fa[2].split('.')[0] + '.LIB/' 
//             + fa[3].split('.')[0] + '.FILE/' 
//             + fa[4].split('.')[0] + '.MBR'
//         return fileName
//     }

//     filereader (path: string): Promise<Buffer > {
//         console.log(path);
//         return new Promise<Buffer >((resolve: (arg0: Buffer) => void, _reject: any) => {
//             this.client.ascii ((error: any) => {
//                 if (error) throw error;
//             //this.client.rawcmd("TYPE C 1208", (error: Error, responseText: string) => {
//             //  if (error) throw error;
            
//             //this.client.type (1208 , (_err: any) => {
//             //    if (_err) throw _err;
//                 ;

//                 // const b = Buffer.from(fileName,'utf8')
//                 // const t = iconv.decode(b, 'ISO-8859-1')
//                 this.client.get( this.convertName(path), (_err, stream) => {
                
//                     if (_err) throw _err;

//                     stream.on('error', (chunk:any) => {
//                         if (_err) throw _err;
//                     });

//                     stream.setEncoding('binary');

//                     let buf = '';
                    
//                     stream.on('data', (chunk:any) => {
//                         buf += chunk;
//                     });
//                     stream.on('end', ()=> {
//                         resolve(Buffer.from(buf,'utf8'));
//                     });
//                 })
//                 //})
//             })
//         })
//     }

//     /*
//     readFile(uri: vscode.Uri): Uint8Array {
//         console.log(".. read file .. " + uri.fsPath);

//         const data = this._lookupAsFile(uri, false).data;
//         if (data) {
//             return data;
//         }
//         throw vscode.FileSystemError.FileNotFound();
//     }
//     */

//     writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void {
//         console.log ("WRITE!!!!" + uri.path);
//         this.fileWriter(uri.path, content);
//         /*
//         let basename = path.posix.basename(uri.path);
//         let parent = this._lookupParentDirectory(uri);
//         let entry = parent.entries.get(basename);
//         if (entry instanceof Directory) {
//             throw vscode.FileSystemError.FileIsADirectory(uri);
//         }
//         if (!entry && !options.create) {
//             throw vscode.FileSystemError.FileNotFound(uri);
//         }
//         if (entry && options.create && !options.overwrite) {
//             throw vscode.FileSystemError.FileExists(uri);
//         }
//         if (!entry) {
//             entry = new File(basename);
//             parent.entries.set(basename, entry);
//             this._fireSoon({ type: vscode.FileChangeType.Created, uri });
//         }
//         entry.mtime = Date.now();
//         entry.size = content.byteLength;
//         entry.data = content;
//         */
//         this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
//     }

//     async fileWriter (path: string,content: Uint8Array): Promise<void> {
//         console.log(path);
//         return new Promise<void>((resolve: (arg0: void) => void, _reject: any) => {
//             this.client.ascii ((error: any) => {
//                 if (error) throw error;
//                 this.client.put(content.toString(), this.convertName(path), (_err) => {
//                     return Promise.resolve(true);
//                 })
//             })
//         })
//     }            

    

//     // --- manage files/folders

//     rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {

//         if (!options.overwrite && this._lookup(newUri, true)) {
//             throw vscode.FileSystemError.FileExists(newUri);
//         }

//         let entry = this._lookup(oldUri, false);
//         let oldParent = this._lookupParentDirectory(oldUri);

//         let newParent = this._lookupParentDirectory(newUri);
//         let newName = path.posix.basename(newUri.path);

//         oldParent.entries.delete(entry.name);
//         entry.name = newName;
//         newParent.entries.set(newName, entry);

//         this._fireSoon(
//             { type: vscode.FileChangeType.Deleted, uri: oldUri },
//             { type: vscode.FileChangeType.Created, uri: newUri }
//         );
//     }

//     delete(uri: vscode.Uri): void {
//         let dirname = uri.with({ path: path.posix.dirname(uri.path) });
//         let basename = path.posix.basename(uri.path);
//         let parent = this._lookupAsDirectory(dirname, false);
//         if (!parent.entries.has(basename)) {
//             throw vscode.FileSystemError.FileNotFound(uri);
//         }
//         parent.entries.delete(basename);
//         parent.mtime = Date.now();
//         parent.size -= 1;
//         this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { uri, type: vscode.FileChangeType.Deleted });
//     }



//     createDirectory(uri: vscode.Uri): void {
//         console.log("MKDIR " + uri.fsPath)
//         /* 
//         let basename = path.posix.basename(uri.path);
//         let dirname = uri.with({ path: path.posix.dirname(uri.path) });
//         let parent = this._lookupAsDirectory(dirname, false);

      
//         let entry = new Directory(basename);
//         parent.entries.set(entry.name, entry);
//         parent.mtime = Date.now();
//         parent.size += 1;
//         */
//         this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { type: vscode.FileChangeType.Created, uri });
//     }

//     // --- lookup

//     private _lookup(uri: vscode.Uri, silent: false): Entry;
//     private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined;
//     private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined {
//         let parts = uri.path.split('/');
//         let entry: Entry = this.root;
//         for (const part of parts) {
//             if (!part) {
//                 continue;
//             }
//             let child: Entry | undefined;
//             if (entry instanceof Directory) {
//                 child = entry.entries.get(part);
//             }
//             if (!child) {
//                 if (!silent) {
//                     throw vscode.FileSystemError.FileNotFound(uri);
//                 } else {
//                     return undefined;
//                 }
//             }
//             entry = child;
//         }
//         return entry;
//     }

//     private _lookupAsDirectory(uri: vscode.Uri, silent: boolean): Directory {
//         let entry = this._lookup(uri, silent);
//         if (entry instanceof Directory) {
//             return entry;
//         }
//         throw vscode.FileSystemError.FileNotADirectory(uri);
//     }

//     private _lookupAsFile(uri: vscode.Uri, silent: boolean): File {
//         let entry = this._lookup(uri, silent);
//         if (entry instanceof File) {
//             return entry;
//         }
//         throw vscode.FileSystemError.FileIsADirectory(uri);
//     }

//     private _lookupParentDirectory(uri: vscode.Uri): Directory {
//         const dirname = uri.with({ path: path.posix.dirname(uri.path) });
//         return this._lookupAsDirectory(dirname, false);
//     }

//     // --- manage file events

//     private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
//     private _bufferedEvents: vscode.FileChangeEvent[] = [];
//     private _fireSoonHandle?: NodeJS.Timer;

//     readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

//     watch(_resource: vscode.Uri): vscode.Disposable {
//         // ignore, fires for all changes...
//         return new vscode.Disposable(() => { });
//     }

//     private _fireSoon(...events: vscode.FileChangeEvent[]): void {
//         this._bufferedEvents.push(...events);

//         if (this._fireSoonHandle) {
//             clearTimeout(this._fireSoonHandle);
//         }

//         this._fireSoonHandle = setTimeout(() => {
//             this._emitter.fire(this._bufferedEvents);
//             this._bufferedEvents.length = 0;
//         }, 5);
//     }
// }
// export class ibmiStat implements vscode.FileStat {

//     type: vscode.FileType;
//     ctime: number;
//     mtime: number;
//     size: number;

//     name: string;

//     constructor(name: string) {

//         this.name = name;
//         if (name != '/' && name == name.toLowerCase()) {
//             const fullName = "/Users/nli/workspace"  + name    // TODO !!!
//             let f  :fs.Stats;
//             //try {
//                  f =  fs.statSync(fullName)
//             //} catch(e) {
//             //    console.log(e)
//             //}

//             this.type = f.isDirectory ? vscode.FileType.Directory :vscode.FileType.File 
//             this.ctime = f.ctime.getDate();
//             this.mtime = f.mtime.getDate();
//             this.size =  f.size;
//             return;
//         }
        
//         // QSYS.LIB - stuff
//         // this.type = name.endsWith("MBR") ?  vscode.FileType.File : vscode.FileType.Directory;
//         //this.type = name.split('/').length <= 4  ? vscode.FileType.Directory :vscode.FileType.File
//         this.type = name == '/' || name.endsWith("LIB") || name.endsWith("FILE") ? vscode.FileType.Directory :vscode.FileType.File
//         this.ctime = Date.now()
//         this.mtime = Date.now()
//         this.size = 0
//     }
// }

