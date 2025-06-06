const vscode = require('vscode');

function showDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, context, decorationType) {
    vscode.workspace.textDocuments.forEach(document => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
        if (editor) {
            const docUri = document.uri.toString();
            const decorations = decorationsMap[docUri];
            if (decorations) {
                if (decorationType === 'withSpace') {
                    context.globalState.update('decSpaced', true);
                    editor.setDecorations(decorationTypeWithSpace, decorations.withSpace || []);
                    if(context.globalState.get('decNoSpaced', true)) {
                        editor.setDecorations(decorationTypeWithoutSpace, decorations.withoutSpace || []);
                    }
                    if (context.globalState.get('decPasted', true)) {
                        editor.setDecorations(decorationTypePasted, decorations.pasted || []);
                    }
                } else if (decorationType === 'withoutSpace') {
                    context.globalState.update('decNoSpaced', true);
                    editor.setDecorations(decorationTypeWithoutSpace, decorations.withoutSpace || []);
                    if(context.globalState.get('decSpaced', true)) {
                        editor.setDecorations(decorationTypeWithSpace, decorations.withSpace || []);
                    }
                    if (context.globalState.get('decPasted', true)) {
                        editor.setDecorations(decorationTypePasted, decorations.pasted || []);
                    }
                } else if (decorationType === 'pasted') {
                    context.globalState.update('decPasted', true);
                    editor.setDecorations(decorationTypePasted, decorations.pasted || []);
                    if(context.globalState.get('decSpaced', true)) {
                        editor.setDecorations(decorationTypeWithSpace, decorations.withSpace || []);
                    }
                    if (context.globalState.get('decNoSpaced', true)) {
                        editor.setDecorations(decorationTypeWithoutSpace, decorations.withoutSpace || []);
                    }
                } else {
                    editor.setDecorations(decorationTypeWithSpace, decorations.withSpace || []);
                    editor.setDecorations(decorationTypeWithoutSpace, decorations.withoutSpace || []);
                    editor.setDecorations(decorationTypePasted, decorations.pasted || []);
                }
            }
        }
    });
    context.globalState.update('activateDecorations', true);
    vscode.window.showInformationMessage('Ahora se muestran las decoraciones');
}

function deleteDecorations(context) {
    let auxiliar = context.globalState.get('activateDecorations', true);
    let noSpaced = context.globalState.get('decSpaced', true);
    let spaced = context.globalState.get('decNoSpaced', true);
    let pasted = context.globalState.get('decPasted', true);
    vscode.commands.executeCommand('identifAI.hideDecorations');
    context.workspaceState.update('decorationsMap', {});
    vscode.window.showInformationMessage('Información eliminada');
    if (auxiliar) {
        context.globalState.update('activateDecorations', true);
    }
    if (noSpaced) {
        context.globalState.update('decSpaced', true);
    }
    if (spaced) {
        context.globalState.update('decNoSpaced', true);
    }
    if (pasted) {
        context.globalState.update('decPasted', true);
    }
}

function deleteDecorationsInRange(decorationsMap, docUri, range) {
    if (!decorationsMap[docUri]) return;

    ['withSpace', 'withoutSpace', 'pasted'].forEach(type => {
        decorationsMap[docUri][type] = (decorationsMap[docUri][type] || []).filter(decoration => {
            // Si NO hay intersección, la dejamos
            return (
                decoration.range.end.isBefore(range.start) ||
                decoration.range.start.isAfter(range.end)
            );
        });
    });
}

function hideDecorationsType(decorationsMap, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted, decorationTypeHidden, context, decorationType) {
    vscode.workspace.textDocuments.forEach(document => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
        if (editor) {
            const docUri = document.uri.toString();
            const decorations = decorationsMap[docUri];
            if (decorations) {
                if (decorationType === 'withSpace') {
                    context.globalState.update('decSpaced', false);
                    editor.setDecorations(decorationTypeWithSpace, []);
                    editor.setDecorations(decorationTypeHidden, decorations.withSpace);
                } else if (decorationType === 'withoutSpace') {
                    context.globalState.update('decNoSpaced', false);
                    editor.setDecorations(decorationTypeWithoutSpace, []);
                    editor.setDecorations(decorationTypeHidden, decorations.withoutSpace);
                } else if (decorationType === 'pasted') {
                    context.globalState.update('decPasted', false);
                    editor.setDecorations(decorationTypePasted, []);
                    editor.setDecorations(decorationTypeHidden, decorations.pasted);
                } else {
                    editor.setDecorations(decorationTypeWithSpace, []);
                    editor.setDecorations(decorationTypeWithoutSpace, []);
                    editor.setDecorations(decorationTypePasted, []);
                    editor.setDecorations(decorationTypeHidden, decorations.withSpace);
                    editor.setDecorations(decorationTypeHidden, decorations.withoutSpace);
                    editor.setDecorations(decorationTypeHidden, decorations.pasted);
                    context.globalState.update('activateDecorations', false);
                    context.globalState.update('decSpaced', false);
                    context.globalState.update('decNoSpaced', false);
                    context.globalState.update('decPasted', false);

                }
            }
        }
    });
    
    vscode.window.showInformationMessage('Se han escondido las decoraciones');
}
module.exports = {
    showDecorationsType,
    deleteDecorations,
    deleteDecorationsInRange,
    hideDecorationsType
};