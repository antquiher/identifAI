const vscode = require('vscode');
let previousLineLengths = {};

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
    let applySelectionCommand = vscode.commands.registerCommand('extension.applySelection', async (label) => {
        let r, g, b;

        while (true) {
            r = await vscode.window.showInputBox({ prompt: 'Enter red color (0-255)' });
            r = Number(r);
            if (!isNaN(r) && r >= 0 && r <= 255) {
                break;
            }
            vscode.window.showErrorMessage('Invalid input for red color. Please enter a number between 0 and 255.');
        }

        while (true) {
            g = await vscode.window.showInputBox({ prompt: 'Enter green color (0-255)' });
            g = Number(g);
            if (!isNaN(g) && g >= 0 && g <= 255) {
                break;
            }
            vscode.window.showErrorMessage('Invalid input for green color. Please enter a number between 0 and 255.');
        }

        while (true) {
            b = await vscode.window.showInputBox({ prompt: 'Enter blue color (0-255)' });
            b = Number(b);
            if (!isNaN(b) && b >= 0 && b <= 255) {
                break;
            }
            vscode.window.showErrorMessage('Invalid input for blue color. Please enter a number between 0 and 255.');
        }

        vscode.commands.executeCommand('identifAI.hideDecorations');

        if (label === 'Change bg color with space') {
            vscode.window.showInformationMessage(`Color cambiado a ${r}, ${g}, ${b}`);
            decorationTypeWithSpace = vscode.window.createTextEditorDecorationType({
                backgroundColor: `rgba(${r}, ${g}, ${b},0.3)` // Color de fondo rojo con transparencia
            });
            context.globalState.update('colorWithSpace', `rgba(${r}, ${g}, ${b},0.3)`);
        } 
        else if (label === 'Change bg color without space') {
            vscode.window.showInformationMessage(`Color cambiado a ${r}, ${g}, ${b}`);
            decorationTypeWithoutSpace = vscode.window.createTextEditorDecorationType({
                backgroundColor: `rgba(${r}, ${g}, ${b},0.3)` // Color de fondo rojo con transparencia
            });
            context.globalState.update('colorWithoutSpace', `rgba(${r}, ${g}, ${b},0.3)`);
        }
        else if (label === 'Change bg color for pasted text') {
            vscode.window.showInformationMessage(`Color cambiado a ${r}, ${g}, ${b}`);
            decorationTypePasted = vscode.window.createTextEditorDecorationType({
                backgroundColor: `rgba(${r}, ${g}, ${b},0.3)` // Color de fondo rojo con transparencia
            });
            context.globalState.update('colorPasted', `rgba(${r}, ${g}, ${b},0.3)`);
        }
        else {
            vscode.window.showInformationMessage('No selection made');
        }
        vscode.commands.executeCommand('identifAI.showDecorations');

    });

    class IdentifAIProvider1 {
        getTreeItem(element) {
            return element;
        }

        getChildren() {
            const items = [
                new OptionItem('Change bg color with space'),
                new OptionItem('Change bg color without space'),
                new OptionItem('Change bg color for pasted text')
            ];

            
            return items;
        }
    }

    class IdentifAIProvider2 {
        constructor(){
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

            const document = editor.document;
            const docUri = document.uri.toString();
            const decorations = decorationsMap[docUri];

            if (!decorations) {
                return [];
            }
            const totalChars = document.getText().length;
            const withSpaceChars = decorations.withSpace.reduce((acc, decoration) => acc + decoration.range.end.character - decoration.range.start.character, 0);
            const withoutSpaceChars = decorations.withoutSpace.reduce((acc, decoration) => acc + decoration.range.end.character - decoration.range.start.character, 0);
            const pastedChars = decorations.pasted.reduce((acc, decoration) => acc + decoration.range.end.character - decoration.range.start.character, 0);
            const defaultChars = totalChars - (withSpaceChars + withoutSpaceChars + pastedChars);

            const withSpacePercentage = ((withSpaceChars / totalChars) * 100).toFixed(2);
            const withoutSpacePercentage = ((withoutSpaceChars / totalChars) * 100).toFixed(2);
            const pastedPercentage = ((pastedChars / totalChars) * 100).toFixed(2);
            const defaultPercentage = ((defaultChars / totalChars) * 100).toFixed(2);

            const items = [
                new vscode.TreeItem(`Text with space: ${withSpacePercentage}%`, vscode.TreeItemCollapsibleState.None),
                new vscode.TreeItem(`Text without space: ${withoutSpacePercentage}%`, vscode.TreeItemCollapsibleState.None),
                new vscode.TreeItem(`Pasted text: ${pastedPercentage}%`, vscode.TreeItemCollapsibleState.None),
                new vscode.TreeItem(`Default text: ${defaultPercentage}%`, vscode.TreeItemCollapsibleState.None)
            ];

            items[0].iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('editorError.foreground'));
            items[1].iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('editorWarning.foreground'));
            items[2].iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('editorInfo.foreground'));
            items[3].iconPath = new vscode.ThemeIcon('circle-filled');

            return items;
        }
    }

    // Registrar el proveedor de vista
    const identifAIProviderBG = new IdentifAIProvider1();
    vscode.window.registerTreeDataProvider('IdentifAI-change-bg', identifAIProviderBG);

    context.subscriptions.push(applySelectionCommand);
    context.subscriptions.push(identifAIProviderBG);

    const identifAIProviderPercent = new IdentifAIProvider2();
    vscode.window.registerTreeDataProvider('IdentifAI-information', identifAIProviderPercent);
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

    // Cargar las decoraciones desde el estado del workspace
    //let decorationsMap = context.workspaceState.get('decorationsMap', {});
    
    //Esto es provisional. Me sigue dando fallo en el decorationsMap
    let decorationsMapRaw = context.workspaceState.get('decorationsMap', '{}');
    console.log(decorationsMapRaw);
    decorationsMapRaw = '{}';
    let decorationsMap ={};
    if (decorationsMapRaw !== '{}') {
        decorationsMap = JSON.parse(decorationsMapRaw);
         // Forzar que decorationsMap tenga un prototipo de objeto
        decorationsMap = Object.assign({}, decorationsMap);
    }

   

    console.log(Object.keys(decorationsMap)); // Ahora debería mostrar las claves correctamente


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
    

    //Hasta aqui es provisional
    // Esta linea hay q quitarsela
    //decorationsMap = {};
    console.log(decorationsMap);
    let activateDecorations = context.workspaceState.get('activateDecorations', true);
    console.log(activateDecorations);
    let numLines =0
    let isPasting = false;

    // Verificar y limpiar el decorationsMap
    /*
    vscode.workspace.textDocuments.forEach(document => {
        const docUri = document.uri.toString();
        if (decorationsMap[docUri]) {
            decorationsMap[docUri].withSpace = decorationsMap[docUri].withSpace.filter(decoration => {
                return document.validateRange(decoration.range).isEqual(decoration.range);
            });
            decorationsMap[docUri].withoutSpace = decorationsMap[docUri].withoutSpace.filter(decoration => {
                return document.validateRange(decoration.range).isEqual(decoration.range);
            });
        }
    });

    // Guardar el decorationsMap limpio en el estado del workspace
    context.workspaceState.update('decorationsMap', decorationsMap);
*/

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



    function deleteFunctionOfIADecoration(decoration, startPos, endPos, subLine, change) { 
        const finDelBorrado= change.range.end;

        if (decoration.range.start.line === startPos.line && subLine === 0) {
            const aux = change.rangeLength;
            if ((decoration.range.start.isBefore(startPos) && decoration.range.end.isAfter(endPos)) || 
            (finDelBorrado.isAfter(decoration.range.start) && finDelBorrado.isBefore(decoration.range.end)) ) {
                return {
                    range: new vscode.Range(decoration.range.start, decoration.range.end.translate(0, -aux))
                };
            } else if (decoration.range.start.isAfter(startPos)) {
                return {
                    range: new vscode.Range(decoration.range.start.translate(0, -aux), decoration.range.end.translate(0, -aux))
                };
                
            } 
            else{
                return decoration;
            }
        }
        
        else if ((decoration.range.start.line > startPos.line - subLine ) && subLine !== 0) {
            return {
                range: new vscode.Range(
                    decoration.range.start.translate(subLine, 0),
                    decoration.range.end.translate(subLine, 0)
                )
            };
        }
        
        else if ((decoration.range.start.line >= startPos.line ) && subLine !== 0) {

            if (decoration.range.start.line > startPos.line && decoration.range.end.line < startPos.line - subLine) { 
                return null;
            }
            else if (decoration.range.start.line === startPos.line && decoration.range.end.line < startPos.line - subLine && decoration.range.end.character > startPos.character) {
                return {
                    range: new vscode.Range(decoration.range.start, startPos)
                };
            }
            else if (decoration.range.start.line > startPos.line && decoration.range.end.line === startPos.line - subLine ) {
                const endChar = finDelBorrado.character;
                const aux = startPos.character - endChar;
                if (decoration.range.start.character >= endChar) {
                    return {
                        range: new vscode.Range(
                            decoration.range.start.translate(subLine, aux),
                            decoration.range.end.translate(subLine, aux)
                        )
                    };
                }
                else if (decoration.range.end.character > endChar && decoration.range.start.character < endChar) {
                    return {
                        range: new vscode.Range(startPos, decoration.range.end.translate(subLine, aux))
                    };
                }
                return null;
            }
        }
        return decoration;
    
    }

    //Esta la tengo que revisar para si inserto línea justo antes de la decoración. Mirar eliminado para referencia
    function modifyFunctionOfIAMap(decoration, startPos, endPos, subLine, text) {
        if (decoration.range.contains(startPos)) {
            const beforeRange = new vscode.Range(decoration.range.start, startPos);
            const afterRange = new vscode.Range(startPos.translate(0, text.length), decoration.range.end.translate(0, text.length));
            return [
                { range: beforeRange },
                { range: afterRange }
            ];
        } else if (decoration.range.start.isAfter(startPos) && decoration.range.start.line === startPos.line && subLine === 0) {
            if(decoration.range.start.line === startPos.line){
                return [{
                    range: new vscode.Range(decoration.range.start.translate(0, text.length), decoration.range.end.translate(0, text.length))
                }];
            }
        }
        else if ((decoration.range.start.isAfter(startPos)  || decoration.range.start.isAfter(endPos)) && subLine !== 0){ //Metemos
            return [{
                range: new vscode.Range(decoration.range.start.translate(subLine, 0), decoration.range.end.translate(subLine, 0))
            }];
        }
        return [decoration];
    }


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
                    editor.setDecorations(decorationTypeWithSpace, decorationsWithSpace);
                    editor.setDecorations(decorationTypeWithoutSpace, decorationsWithoutSpace);
                    editor.setDecorations(decorationTypePasted, decorationsPasted);
                }

                // Actualizar la longitud de las líneas del documento
                previousLineLengths[docUri] = document.lineCount;
                isPasting = false;

                // Actualizar el árbol de vista
                identifAIProviderPercent.refresh();
                fileDecorationProvider.refresh();
                
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


// Este método deberá de ser eliminado, pero mientras tenga el fallo lo dejaré
    const deleteMap = vscode.commands.registerCommand('identifAI.deleteIAMap', () => {
		vscode.commands.executeCommand('identifAI.hideDecorations');
        decorationsMap = {};
        context.workspaceState.update('decorationsMap', decorationsMap);

		vscode.window.showInformationMessage('Información eliminada');
        console.log(decorationsMap);
	});

    const showMap = vscode.commands.registerCommand('identifAI.showIAMap', function () {

		vscode.window.showInformationMessage('Información muestreada en el log');
        console.log(decorationsMap);
	});



    const showDecorationsCommand = vscode.commands.registerCommand('identifAI.showDecorations', () => {
        vscode.workspace.textDocuments.forEach(document => {
            const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
            if (editor) {
                const docUri = document.uri.toString();
                const decorations = decorationsMap[docUri];
                if (decorations) {
                    editor.setDecorations(decorationTypeWithSpace, decorations.withSpace || []);
                    editor.setDecorations(decorationTypeWithoutSpace, decorations.withoutSpace || []);
                    editor.setDecorations(decorationTypePasted, decorations.pasted || []);
                }
            }
        });
        activateDecorations = true;
        context.globalState.update('activateDecorations', activateDecorations);
        console.log(activateDecorations);
        vscode.window.showInformationMessage('Ahora se muestran las decoraciones');
    });

    const hideDecorationsCommand = vscode.commands.registerCommand('identifAI.hideDecorations', () => {
        vscode.workspace.textDocuments.forEach(document => {
            const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
            if (editor) {
                const docUri = document.uri.toString();
                const decorations = decorationsMap[docUri];
                if (decorations) {
                    // Eliminar las decoraciones existentes para que nos permitan ponerlos sin fondo
                    editor.setDecorations(decorationTypeWithSpace, []);
                    editor.setDecorations(decorationTypeWithoutSpace, []);
                    editor.setDecorations(decorationTypePasted, []);
                    
                    editor.setDecorations(decorationTypeHidden, decorations.withSpace);
                    editor.setDecorations(decorationTypeHidden, decorations.withoutSpace);
                    editor.setDecorations(decorationTypeHidden, decorations.pasted);
                }
            }
        });
        activateDecorations = false;
        context.globalState.update('activateDecorations', activateDecorations);
        console.log(activateDecorations);
        
        vscode.window.showInformationMessage('Se han escondido las decoraciones');
    });

    context.subscriptions.push(deleteMap);
    context.subscriptions.push(showMap);
    context.subscriptions.push(showDecorationsCommand);
    context.subscriptions.push(hideDecorationsCommand);

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
                    tooltip: `\nDecorations: ${totalDecorations}\n- With Space: ${fileDecorations.withSpace.length}\n- Without Space: ${fileDecorations.withoutSpace.length}\n- Pasted: ${fileDecorations.pasted.length}`
                };
            }
            return {
                badge: null,
                tooltip: '\nNot using identifAI on this file.' // Tooltip por defecto
            }; // Sin decoraciones
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