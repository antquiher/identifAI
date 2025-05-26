const vscode = require('vscode');
let previousLineLengths = {};
const { getChildrenForProvider1, getChildrenForProvider2, handleApplySelection, getNavigationTreeItemsGrouped } = require('./graphic');
const { showDecorationsType, deleteDecorations, hideDecorationsType } = require('./commands');
const { deleteFunctionOfIADecoration, modifyFunctionOfIAMap } = require('./auxiliarFunctions');

function activate(context) {
    console.log('Congratulations, your extension "identifAI" is now active!');

    let decorationTypeWithSpace;
    let decorationTypeWithoutSpace;
    let decorationTypePasted;

    // Crear tipos de decoración con estilos específicos
    let colorWithSpace = context.globalState.get('colorWithSpace', 'rgba(255,0,0,0.3)');
    decorationTypeWithSpace = vscode.window.createTextEditorDecorationType({
        backgroundColor: colorWithSpace // Color de fondo rojo con transparencia
    })

    let colorWithoutSpace = context.globalState.get('colorWithoutSpace',  'rgba(0,255,0,0.3)' );
    console.log(typeof colorWithoutSpace);
    console.log(colorWithoutSpace);
    decorationTypeWithoutSpace = vscode.window.createTextEditorDecorationType({
        backgroundColor: colorWithoutSpace // Color de fondo verde con transparencia
    });

    const decorationTypeHidden = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0,0,0,0)' // Color de fondo transparente
    });

    let colorPasted = context.globalState.get('colorPasted', 'rgba(255, 255, 0, 0.3)');
    decorationTypePasted =vscode.window.createTextEditorDecorationType({
        backgroundColor: colorPasted // Color de fondo amarillo con transparencia para que quede horrible
    })

    //Esto es para cambiar el color de fondo de las decoraciones
    const applySelectionCommand = vscode.commands.registerCommand('extension.applySelection', async (label) => {
        const result = await handleApplySelection(label, context, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted)();
        if (result) {
            const [updatedLabel, newColor] = result;
            if(updatedLabel === 'Change bg color with space') {
                decorationTypeWithSpace.dispose();
                decorationTypeWithSpace = vscode.window.createTextEditorDecorationType({
                    backgroundColor: newColor
                });
            }
            else if(updatedLabel === 'Change bg color without space') {
                decorationTypeWithoutSpace.dispose();
                decorationTypeWithoutSpace = vscode.window.createTextEditorDecorationType({
                    backgroundColor: newColor
                });
            } else if(updatedLabel === 'Change bg color for pasted text') {
                decorationTypePasted.dispose();
                decorationTypePasted = vscode.window.createTextEditorDecorationType({
                    backgroundColor: newColor
                });
            }
            console.log(`Updated ${updatedLabel} to color: ${newColor}`);
            
        }
        vscode.commands.executeCommand('identifAI.showDecorations');
    });

    class IdentifAIProvider1 {
        getTreeItem(element) {
            return element;
        }

        getChildren() {
            return getChildrenForProvider1();
        }
    }

    class IdentifAIProvider2 {
        constructor() {
            this._onDidChangeTreeData = new vscode.EventEmitter();
            this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        }

        refresh() {
            this._onDidChangeTreeData.fire();
        }

        getTreeItem(element) {
            return element;
        }

        getChildren() {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return [];
            }
            return getChildrenForProvider2(editor.document, decorationsMap);
        }
    }

    // Registrar identifAIProvider1
    const identifAIProviderBG = new IdentifAIProvider1();
    vscode.window.registerTreeDataProvider('IdentifAI-change-bg', identifAIProviderBG);

    // Registrar identifAIProvider2
    const identifAIProviderPercent = new IdentifAIProvider2();
    vscode.window.registerTreeDataProvider('IdentifAI-information', identifAIProviderPercent);

    context.subscriptions.push(applySelectionCommand);
    context.subscriptions.push(identifAIProviderBG);
    context.subscriptions.push(identifAIProviderPercent);

    class OptionItem extends vscode.TreeItem {
        constructor(label) {
            super(label);
            this.label = label;
            this.command = {
                command: 'extension.applySelection',
                title: 'Apply',
                arguments: [label]
            };
        }
    }

    // Comando para remarcar el texto pegado en el portapapeles
    const pasteCommand = vscode.commands.registerCommand('editor.action.clipboardPasteAction', async () => {

        isPasting = true;
        // Obtener el texto desde el portapapeles
        const clipboardText = await vscode.env.clipboard.readText();
      
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          // Insertar el texto del portapapeles manualmente
          editor.edit(editBuilder => {
            const position = editor.selection.active;
            editBuilder.insert(position, clipboardText);
          }).then(() => {
            
            
            // Lógica personalizada después de pegar
            vscode.window.showInformationMessage('Pegar personalizado ejecutado.');
          });
        }
    });
	  
	context.subscriptions.push(pasteCommand);
    
    //Esto es provisional. Me sigue dando fallo en el decorationsMap
    let decorationsMapRaw = context.workspaceState.get('decorationsMap', '{}');
    console.log(decorationsMapRaw);
    decorationsMapRaw = '{}';       //Esto hay q quitaralo. No se debe de eliminar algo que ya esté guardado
    let decorationsMap ={};
    if (decorationsMapRaw !== '{}') {
        decorationsMap = JSON.parse(decorationsMapRaw);
         // Forzar que decorationsMap tenga un prototipo de objeto
        decorationsMap = Object.assign({}, decorationsMap);
    }

    class IdentifAINavigationProvider {
        constructor(decorationsMap) {
            this.decorationsMap = decorationsMap;
            this._onDidChangeTreeData = new vscode.EventEmitter();
            this.onDidChangeTreeData = this._onDidChangeTreeData.event;
            this.treeData = getNavigationTreeItemsGrouped(this.decorationsMap);
        }

        refresh() {
            this.treeData = getNavigationTreeItemsGrouped(this.decorationsMap);
            this._onDidChangeTreeData.fire();
        }

        getTreeItem(element) {
            const treeItem = new vscode.TreeItem(
                element.label,
                element.collapsibleState
            );
            return treeItem;
        }

        getChildren(element) {
            if (!element) {
                // Nodo raíz: devolver los archivos
                return this.treeData;
            }

            // Devolver los hijos del elemento actual
            return element.children || [];
        }
    }

    const identifAINavigationProvider = new IdentifAINavigationProvider(decorationsMap);
    vscode.window.registerTreeDataProvider('IdentifAI-navigation', identifAINavigationProvider);

    context.subscriptions.push({
        dispose: () => identifAINavigationProvider.refresh()
    });

    context.subscriptions.push({
        dispose: () => identifAINavigationProvider.refresh()
    });

    // Reconstruir rangos
    for (let docUri in decorationsMap) {
        for (let key of ['withSpace', 'withoutSpace', 'pasted']) {
            if (decorationsMap[docUri][key]) {
                decorationsMap[docUri][key] = decorationsMap[docUri][key].map(decoration => {
                    let [start, end] = decoration.range; // Extrae el array de dos posiciones
                    return {
                        range: new vscode.Range(
                            new vscode.Position(start.line, start.character),
                            new vscode.Position(end.line, end.character)
                        )
                    };
                });
            }
        }
    }

    // Esta linea hay q quitarsela
    console.log(decorationsMap);
    let activateDecorations = context.workspaceState.get('activateDecorations', true);
    let decSpaced = context.workspaceState.get('decSpaced', true);
    let decNoSpaced = context.workspaceState.get('decNoSpaced', true);
    let decPasted = context.workspaceState.get('decPasted', true);
    console.log(`activateDecorations: ${activateDecorations}`);
    console.log(`decSpaced: ${decSpaced}`);
    console.log(`decNoSpaced: ${decNoSpaced}`);
    console.log(`decPasted: ${decPasted}`);
    let numLines =0
    let isPasting = false;

    // Obtener el número de líneas del documento activo al activar la extensión
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        numLines = document.lineCount;
        console.log(`Número de líneas: ${numLines}`);
        const fileName = document.fileName;
        console.log(`Nombre del fichero activo: ${fileName}`);
    }

    vscode.workspace.onDidOpenTextDocument((document) => {
        numLines = document.lineCount;
        console.log(`Número de líneas: ${numLines}`);
        const fileName = document.fileName;
        console.log(`Nombre del fichero activo: ${fileName}`);
    });

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            const document = editor.document;
            numLines = document.lineCount;
            console.log(`Número de líneas: ${numLines}`);
            const fileName = document.fileName;
            console.log(`Nombre del fichero activo: ${fileName}`);
        }
    });

// Main metodo para la extensión
    vscode.workspace.onDidChangeTextDocument((event) => {
        identifAIProviderPercent.refresh();
        const document = event.document;
        const changes = event.contentChanges;
        const docUri = document.uri.toString();
        const newNewLines = document.lineCount;
        const subLine= newNewLines - numLines;
        if (changes.length > 0) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === document) {
                let decorationsWithSpace = [];
                let decorationsWithoutSpace = [];
                let decorationsPasted = [];
                if (decorationsMap[docUri]) {
                    decorationsWithSpace = decorationsMap[docUri].withSpace || [];
                    decorationsWithoutSpace = decorationsMap[docUri].withoutSpace || [];
                    decorationsPasted = decorationsMap[docUri].pasted || [];
                }

                changes.forEach(change => {
                    const text = change.text;
                    const startPos = change.range.start;
                    const endPos = change.range.start.translate(0, text.split('\n')[0].trimEnd().length);

                    if (text.length === 0) { // Eliminación de texto
                        // Para el withSpace
                        decorationsWithSpace = decorationsWithSpace.map(decoration => {
                            return deleteFunctionOfIADecoration(decoration, startPos, endPos, subLine, change);
                        }).filter(Boolean);

                        //Para el paste
                        decorationsPasted = decorationsPasted.map(decoration => {
                            return deleteFunctionOfIADecoration(decoration, startPos, endPos, subLine, change);
                        }).filter(Boolean);

                        //Para el sin espacio
                        decorationsWithoutSpace = decorationsWithoutSpace.map(decoration => {
                            return deleteFunctionOfIADecoration(decoration, startPos, endPos, subLine, change);
                        }).filter(Boolean);
                        
                        decorationsMap[docUri] = {
                            withSpace: decorationsWithSpace,
                            withoutSpace: decorationsWithoutSpace,
                            pasted: decorationsPasted
                        };
                        
                    }
                    else{// Inserción de texto e inserción de líneas
                        //Con espacio
                        decorationsWithSpace = decorationsWithSpace.flatMap(decoration => {
                            return modifyFunctionOfIAMap(decoration, startPos, endPos, subLine, text);
                        });

                        //Sin espacio
                        decorationsWithoutSpace = decorationsWithoutSpace.flatMap(decoration => {
                            return modifyFunctionOfIAMap(decoration, startPos, endPos, subLine, text);
                        });

                        //Pegado
                        decorationsPasted = decorationsPasted.flatMap(decoration => {
                            return modifyFunctionOfIAMap(decoration, startPos, endPos, subLine, text);
                        });
                    }

                    if (text.length > 1 && text.trim() !== "") {
                        
                        
                        if(startPos.isBefore(endPos)){
                            console.log(text);
                            const range = new vscode.Range(startPos, endPos);
                            if (isPasting) {
                                decorationsPasted.push({ range: range });
                            }
                            else if (!range.isEmpty && text !== '\r\n') {
                                if(/\s/.test(text) && text !== '\n') {
                                    decorationsWithSpace.push({ range: range });
                                }
                                else {
                                    decorationsWithoutSpace.push({ range: range });
                                }
                                
                            } 
                        }
                    }

                    // Por si se mete más de una línea
                    const document = editor.document;
                    const newNewLines = document.lineCount;
                    if (newNewLines !== numLines) {
                        const subLine= newNewLines - numLines;
                        numLines = newNewLines;
                        if(subLine > 0){ 
                            const lineStart=startPos.line;
                            for (let i =1; i <= subLine; i++) {
                                let aux = text.split('\n')[i];
                                aux=aux.trimEnd();
                                if(!(/^\s+$/.test(aux))){
                                    const range = new vscode.Range(new vscode.Position(lineStart+i, 0), new vscode.Position(lineStart+i, aux.length));
                                    if (isPasting) {
                                        decorationsPasted.push({ range: range });
                                    }
                                    else{
                                        decorationsWithSpace.push({ range: range });
                                    }
                                }
                                
                            }
                        }
                        
                    }
                });

                

                // Almacenar las decoraciones en el objeto
                decorationsWithSpace = decorationsWithSpace.filter(decoration => 
                    !decoration.range.start.isEqual(decoration.range.end) // Solo guarda rangos que no sean un punto único
                    && decoration.range.end.character <= document.lineAt(decoration.range.start.line).text.length //Solo guardo los datos que estén contenidos en la línea 
                    && decoration.range.start.character <= document.lineAt(decoration.range.start.line).text.length //Solo guardo los datos que estén contenidos en la línea
                );
                decorationsWithoutSpace = decorationsWithoutSpace.filter(decoration => 
                    !decoration.range.start.isEqual(decoration.range.end) // Solo guarda rangos que no sean un punto único
                    && decoration.range.end.character <= document.lineAt(decoration.range.start.line).text.length //Solo guardo los datos que estén contenidos en la línea 
                    && decoration.range.start.character <= document.lineAt(decoration.range.start.line).text.length //Solo guardo los datos que estén contenidos en la línea 
                );
                decorationsPasted = decorationsPasted.filter(decoration =>
                    !decoration.range.start.isEqual(decoration.range.end) // Solo guarda rangos que no sean un punto único
                    && decoration.range.end.character <= document.lineAt(decoration.range.start.line).text.length //Solo guardo los datos que estén contenidos en la línea 
                    && decoration.range.start.character <= document.lineAt(decoration.range.start.line).text.length //Solo guardo los datos que estén contenidos en la línea
                );
                decorationsMap[docUri] = {
                    withSpace: decorationsWithSpace,
                    withoutSpace: decorationsWithoutSpace,
                    pasted: decorationsPasted
                };

                // Guardar las decoraciones en el estado del workspace
                context.workspaceState.update('decorationsMap', JSON.stringify(decorationsMap));
                console.log(decorationsMap);


                // Aplicar las decoraciones
                if(activateDecorations){
                    if (decSpaced) {
                        editor.setDecorations(decorationTypeWithSpace, decorationsWithSpace);
                    } 
                    if (decNoSpaced) {
                        editor.setDecorations(decorationTypeWithoutSpace, decorationsWithoutSpace);
                    }
                    if (decPasted) {
                        editor.setDecorations(decorationTypePasted, decorationsPasted);
                    }
                }

                // Actualizar la longitud de las líneas del documento
                previousLineLengths[docUri] = document.lineCount;
                isPasting = false;

                // Actualizar el árbol de vista
                identifAIProviderPercent.refresh();
                fileDecorationProvider.refresh();
                identifAINavigationProvider.refresh();
                
            }
        }
    });

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            const document = editor.document;
            const decorations = decorationsMap[document.uri.toString()];
            if (decorations) {
                editor.setDecorations(decorationTypeWithSpace, decorations.withSpace);
                editor.setDecorations(decorationTypeWithoutSpace, decorations.withoutSpace);
            }
            previousLineLengths[document.uri.toString()] = document.lineCount;
        }
    });

    //Comandos para escribir
    const deleteMap = vscode.commands.registerCommand('identifAI.deleteIAMap', () => {
        deleteDecorations(context);
        decorationsMap = {};
        activateDecorations = context.globalState.get('activateDecorations', true);
        decNoSpaced = context.globalState.get('decSpaced', true);
        decSpaced = context.globalState.get('decNoSpaced', true);
        decPasted = context.globalState.get('decPasted', true);
	});

    const showMap = vscode.commands.registerCommand('identifAI.showIAMap', function () {

		vscode.window.showInformationMessage('Información muestreada en el log');
        console.log(decorationsMap);
	});

    const showDecorationsCommand = vscode.commands.registerCommand('identifAI.showDecorations', () => {
        showDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, context, 'all');
        activateDecorations = true;
        decNoSpaced = true;
        decSpaced = true;
        decPasted = true;
    });

    const showDecorationsCommandSpaced = vscode.commands.registerCommand('identifAI.showDecorationsWithSpace', () => {
        showDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, context, 'withSpace');
        activateDecorations = true;
        decSpaced = true;
    });

    const showDecorationsCommandNoSpaced = vscode.commands.registerCommand('identifAI.showDecorationsWithoutSpace', () => {
        showDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, context, 'withoutSpace');
        activateDecorations = true;
        decNoSpaced = true;
    });

    const showDecorationsCommandPasted = vscode.commands.registerCommand('identifAI.showDecorationsPasted', () => {
        showDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, context, 'pasted');
        activateDecorations = true;
        decPasted = true;
    });

    const hideDecorationsCommand = vscode.commands.registerCommand('identifAI.hideDecorations', () => {
        hideDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, decorationTypeHidden, context, 'all');
        activateDecorations = false;
    });

    const hideDecorationsWithSpace = vscode.commands.registerCommand('identifAI.hideDecorationsWithSpace', () => {
        hideDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, decorationTypeHidden, context, 'withSpace');
        decSpaced = false;
    });
    const hideDecorationsWithoutSpace = vscode.commands.registerCommand('identifAI.hideDecorationsWithoutSpace', () => {
        hideDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, decorationTypeHidden, context, 'withoutSpace');
        decNoSpaced = false;
    });
    const hideDecorationsPasted = vscode.commands.registerCommand('identifAI.hideDecorationsPasted', () => {
        hideDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, decorationTypeHidden, context, 'pasted');
        decPasted = false;
    });

    context.subscriptions.push(deleteMap);
    context.subscriptions.push(showMap);
    context.subscriptions.push(showDecorationsCommand);
    context.subscriptions.push(showDecorationsCommandSpaced);
    context.subscriptions.push(showDecorationsCommandNoSpaced);
    context.subscriptions.push(showDecorationsCommandPasted);
    context.subscriptions.push(hideDecorationsCommand);
    context.subscriptions.push(hideDecorationsWithSpace);
    context.subscriptions.push(hideDecorationsWithoutSpace);
    context.subscriptions.push(hideDecorationsPasted);

    //Esto es para los números en el explorer
    class FileDecorationProvider {
        constructor() {
            this._onDidChangeFileDecorations = new vscode.EventEmitter();
            this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        }
    
        provideFileDecoration(uri) {
            const fileDecorations = decorationsMap[uri.toString()];
            if (fileDecorations) {
                const totalDecorations = fileDecorations.withSpace.length +
                                         fileDecorations.withoutSpace.length +
                                         fileDecorations.pasted.length;
    
                // Devuelve la decoración con badge y tooltip
                return {
                    badge: totalDecorations.toString(), // Número al lado del archivo
                    tooltip: `\nDecorations: ${totalDecorations}\n- With AI: ${fileDecorations.withSpace.length}\n- With VS: ${fileDecorations.withoutSpace.length}\n- Pasted: ${fileDecorations.pasted.length}`
                };
            }
            return {
                badge: null,
                tooltip: '\nNot using identifAI on this file.' 
            }; 
        }
    
        refresh() {
            this._onDidChangeFileDecorations.fire();
        }
    }
    const fileDecorationProvider = new FileDecorationProvider();
    vscode.window.registerFileDecorationProvider(fileDecorationProvider);
}

//function deactivate() {}

module.exports = {
    activate,
//    deactivate
};