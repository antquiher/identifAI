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
            // Aplicar la decoración de texto pegado
            const startPos = editor.selection.active;
            const endPos = startPos.translate(0, clipboardText.length);
            const range = new vscode.Range(startPos, endPos);
            const docUri = editor.document.uri.toString();
            let decorationsPasted = [];
            if (decorationsMap[docUri] && decorationsMap[docUri].pasted) {
                decorationsPasted = decorationsMap[docUri].pasted;
            }
            decorationsPasted.push({ range: range });
            
            decorationsMap[docUri] = {
                ...decorationsMap[docUri],
                pasted: decorationsPasted
            };
            
            context.workspaceState.update('decorationsMap', decorationsMap);
            editor.setDecorations(decorationTypePasted, decorationsPasted);
            
            // Lógica personalizada después de pegar
            vscode.window.showInformationMessage('Pegar personalizado ejecutado.');
          });
        }
    });
	  
	  context.subscriptions.push(pasteCommand);

    // Cargar las decoraciones desde el estado del workspace
    let decorationsMap = context.workspaceState.get('decorationsMap', {});
    
    //Esto es provisional. Me sigue dando fallo en el decorationsMap
    let decorationsWithSpace = [];
    let decorationsWithoutSpace = [];
    let decorationsPasted = [];
    vscode.workspace.onDidChangeTextDocument((event) => {
        const document = event.document;
        const docUri = document.uri.toString();
        decorationsWithSpace = decorationsMap[docUri].withSpace || [];
        decorationsWithoutSpace = decorationsMap[docUri].withoutSpace || [];
        decorationsPasted = decorationsMap[docUri].pasted || [];
    })
    //Hasta aqui es provisional
    // Esta linea hay q quitarsela
    decorationsMap = {};
    console.log(decorationsMap);
    let activateDecorations = context.workspaceState.get('activateDecorations', true);
    console.log(activateDecorations);
    let numLines =0
    let isPasting = false;

    // Verificar y limpiar el decorationsMap
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

// Aplicar las decoraciones a todos los documentos abiertos al activar la extensión   TODO: Revisar si es necesario
/*
    if(activateDecorations){
        vscode.commands.executeCommand('identifAI.showDecorations');
    }
*/

    function adjustRangesAfterPosition(ranges, position, lineOffset) {
        return ranges.map(range => {
            if (range.end.line > position.line || (range.end.line === position.line && range.end.character > position.character)) {
                return new vscode.Range(
                    new vscode.Position(range.start.line + lineOffset, range.start.character),
                    new vscode.Position(range.end.line + lineOffset, range.end.character)
                );
            }
            return range;
        });
    }

// Main metodo para la extensión
    vscode.workspace.onDidChangeTextDocument((event) => {
        identifAIProviderPercent.refresh();
        const document = event.document;
        const changes = event.contentChanges;
        const docUri = document.uri.toString();
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
                    const endPos = change.range.start.translate(0, text.length);

                    if (text.length === 0) { // Eliminación de texto
                        const linesToRemove = new Set();

                        // Para el withSpace
                        decorationsWithSpace = decorationsWithSpace.map(decoration => {
                            const document = editor.document;
                            const newNewLines = document.lineCount;
                            if (newNewLines !== numLines) {
                                const subLine= newNewLines - numLines;
                                numLines = newNewLines;
                                if(subLine<0){
                                    for (let i=1; i<=subLine; i++){
                                        linesToRemove.add(i);
                                    }
                                    return false
                                }
                            }
                            if (decoration.range.contains(startPos) || decoration.range.contains(endPos)) {
                                if (decoration.range.start.isBefore(startPos) && decoration.range.end.isAfter(endPos)) {
                                    return {
                                        range: new vscode.Range(decoration.range.start, decoration.range.end.translate(0, -change.rangeLength))
                                    };
                                } else if (decoration.range.start.isBefore(startPos)) {
                                    return {
                                        range: new vscode.Range(decoration.range.start, startPos)
                                    };
                                } else if (decoration.range.end.isAfter(endPos)) {
                                    return {
                                        range: new vscode.Range(endPos, decoration.range.end.translate(0, -change.rangeLength))
                                    };
                                }
                            }
                            return decoration;
                        }).filter(decoration => !decoration.range.isEmpty);

                        //Para el paste
                        decorationsPasted = decorationsPasted.map(decoration => {
                            const document = editor.document;
                            const newNewLines = document.lineCount;
                            if (newNewLines !== numLines) {
                                const subLine= newNewLines - numLines;
                                numLines = newNewLines;
                                if(subLine<0){
                                    for (let i=1; i<=subLine; i++){
                                        linesToRemove.add(i);
                                    }
                                    return false
                                }
                            }
                            if (decoration.range.contains(startPos) || decoration.range.contains(endPos)) {
                                if (decoration.range.start.isBefore(startPos) && decoration.range.end.isAfter(endPos)) {
                                    return {
                                        range: new vscode.Range(decoration.range.start, decoration.range.end.translate(0, -change.rangeLength))
                                    };
                                } else if (decoration.range.start.isBefore(startPos)) {
                                    return {
                                        range: new vscode.Range(decoration.range.start, startPos)
                                    };
                                } else if (decoration.range.end.isAfter(endPos)) {
                                    return {
                                        range: new vscode.Range(endPos, decoration.range.end.translate(0, -change.rangeLength))
                                    };
                                }
                            }
                            return decoration;
                        }).filter(decoration => !decoration.range.isEmpty);

                        //Para el sin espacio
                        decorationsWithoutSpace = decorationsWithoutSpace.map(decoration => {
                            if (decoration.range.contains(startPos) || decoration.range.contains(endPos)) {
                                if (decoration.range.start.isBefore(startPos) && decoration.range.end.isAfter(endPos)) {
                                    return {
                                        range: new vscode.Range(decoration.range.start, decoration.range.end.translate(0, -change.rangeLength))
                                    };
                                } else if (decoration.range.start.isBefore(startPos)) {
                                    return {
                                        range: new vscode.Range(decoration.range.start, startPos)
                                    };
                                } else if (decoration.range.end.isAfter(endPos)) {
                                    return {
                                        range: new vscode.Range(endPos, decoration.range.end.translate(0, -change.rangeLength))
                                    };
                                }
                            }
                            return decoration;
                        }).filter(decoration => !decoration.range.isEmpty);
                        
                        
                    }
                    
                    else{// Inserción de texto
                        decorationsWithSpace = decorationsWithSpace.flatMap(decoration => {
                            if (decoration.range.contains(startPos)) {
                                const beforeRange = new vscode.Range(decoration.range.start, startPos);
                                const afterRange = new vscode.Range(startPos.translate(0, text.length), decoration.range.end.translate(0, text.length));
                                return [
                                    { range: beforeRange },
                                    { range: afterRange }
                                ];
                            } else if (decoration.range.start.isAfter(startPos)) {
                                return [{
                                    range: new vscode.Range(decoration.range.start.translate(0, text.length), decoration.range.end.translate(0, text.length))
                                }];
                            }
                            return [decoration];
                        });

                        decorationsWithoutSpace = decorationsWithoutSpace.flatMap(decoration => {
                            if (decoration.range.contains(startPos)) {
                                const beforeRange = new vscode.Range(decoration.range.start, startPos);
                                const afterRange = new vscode.Range(startPos.translate(0, text.length), decoration.range.end.translate(0, text.length));
                                return [
                                    { range: beforeRange },
                                    { range: afterRange }
                                ];
                            } else if (decoration.range.start.isAfter(startPos) ) {
                                if(text.length == 1){
                                    return [{
                                        range: new vscode.Range(decoration.range.start.translate(0, text.length), decoration.range.end.translate(0, text.length))
                                    }];
                                }
                                if(!(/\s/.test(text))){
                                    return [{
                                        range: new vscode.Range(decoration.range.start.translate(0, text.length), decoration.range.end.translate(0, text.length))
                                    }];
                                }
                            }
                            return [decoration];
                        });

                        decorationsPasted = decorationsPasted.flatMap(decoration => {
                            if (decoration.range.contains(startPos)) {
                                const beforeRange = new vscode.Range(decoration.range.start, startPos);
                                const afterRange = new vscode.Range(startPos.translate(0, text.length), decoration.range.end.translate(0, text.length));
                                return [
                                    { range: beforeRange },
                                    { range: afterRange }
                                ];
                            } else if (decoration.range.start.isAfter(startPos) ) {
                                if(text.length == 1){
                                    return [{
                                        range: new vscode.Range(decoration.range.start.translate(0, text.length), decoration.range.end.translate(0, text.length))
                                    }];
                                }
                                if(!(/\s/.test(text))){
                                    return [{
                                        range: new vscode.Range(decoration.range.start.translate(0, text.length), decoration.range.end.translate(0, text.length))
                                    }];
                                }
                            }
                            return [decoration];
                        });
                    }

                    if (text.length > 1) {
                        
                        //Esto hay q modificar el if \s
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
                                const aux = editor.document.lineAt(lineStart+i).text
                                if((/^\s+$/.test(aux))){
                                    const range = new vscode.Range(new vscode.Position(lineStart+i, 0), new vscode.Position(lineStart+i, Number. MAX_VALUE));
                                    decorationsWithSpace.push({ range: range });
                                }
                                decorationsWithSpace = adjustRangesAfterPosition(decorationsWithSpace, startPos, subLine);
                                decorationsWithoutSpace = adjustRangesAfterPosition(decorationsWithoutSpace, startPos, subLine);
                                decorationsPasted = adjustRangesAfterPosition(decorationsPasted, startPos, subLine);
                                
                            }
                        }
                        if(subLine < 0){
                            decorationsWithSpace = adjustRangesAfterPosition(decorationsWithSpace, startPos, subLine);
                            decorationsWithoutSpace = adjustRangesAfterPosition(decorationsWithoutSpace, startPos, subLine);
                            decorationsPasted = adjustRangesAfterPosition(decorationsPasted, startPos, subLine);
                        }
                    }
                });

                // Almacenar las decoraciones en el objeto
                decorationsMap[docUri] = {
                    withSpace: decorationsWithSpace,
                    withoutSpace: decorationsWithoutSpace,
                    pasted: decorationsPasted
                };

                // Guardar las decoraciones en el estado del workspace
                context.workspaceState.update('decorationsMap', decorationsMap);

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
    }

//function deactivate() {}

module.exports = {
    activate,
//    deactivate
};