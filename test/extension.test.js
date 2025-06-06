const assert = require('assert');
const vscode = require('vscode');
const path = require('path');

suite('End-to-End Test Suite', function () {
    this.timeout(1000000);
    test('DecorationsMap contiene el fichero correcto tras autocompletar', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');

        const decorationsMapStr = JSON.stringify(decorationsMap);
        
        const fileName = doc.uri.fsPath.split(/[\\/]/).pop();
        assert.ok(
            decorationsMapStr.includes(fileName),
            `No se encontrÃ³ el archivo ${fileName} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`El fichero ${fileName} se encuentra en ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 2
    test('DecorationsMap contiene el rango correcto tras autocompletar', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');

        const decorationsMapStr = JSON.stringify(decorationsMap);
        
        const rango = '"range":[{"line":0,"character":0},{"line":0,"character":7}]}]';
        assert.ok(
            decorationsMapStr.includes(rango),
            `No se encontrÃ³ el archivo ${rango} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`El rango ${rango} se encuentra en ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 3
    test('DecorationsMap contiene el tipo correcto tras autocompletar', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');

        const decorationsMapStr = JSON.stringify(decorationsMap);
        
        let tipo = '"withSpace":[{';
        assert.ok(
            !decorationsMapStr.includes(tipo),
            `No se encontrÃ³ el archivo ${tipo} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        tipo = '"withoutSpace":[{';
        assert.ok(
            decorationsMapStr.includes(tipo),
            `No se encontrÃ³ el archivo ${tipo} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        tipo = '"pasted":[{';
        assert.ok(
            !decorationsMapStr.includes(tipo),
            `No se encontrÃ³ el archivo ${tipo} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 4
    test('DecorationsMap contiene el tipo correcto tras autocompletar con Copilot', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            //Simula que Copilot se activa
            editBuilder.insert(new vscode.Position(0, 0), 'Hola IdentifAI');
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Recupera el decorationsMap
        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');
        const decorationsMapStr = JSON.stringify(decorationsMap);

        // Comprueba que withSpace tiene contenido y los otros no
        let tipo = '"withSpace":[{';
        assert.ok(
            decorationsMapStr.includes(tipo),
            `No se encontrÃ³ el tipo ${tipo} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        tipo = '"withoutSpace":[{';
        assert.ok(
            !decorationsMapStr.includes(tipo),
            `withoutSpace deberÃ­a estar vacÃ­o. Log capturado:\n${decorationsMapStr}`
        );

        tipo = '"pasted":[{';
        assert.ok(
            !decorationsMapStr.includes(tipo),
            `pasted deberÃ­a estar vacÃ­o. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`DecorationsMap tras autocompletar con Copilot: ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 5
    test('DecorationsMap contiene el tipo correcto tras pegar texto', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'H');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'l');
            editBuilder.insert(new vscode.Position(0, 3), 'a');
        });

        editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 4));

        const textToCopy = editor.document.getText(editor.selection);
        await vscode.env.clipboard.writeText(textToCopy);
        
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(1, 0), '\n');
        });
        editor.selection = new vscode.Selection(new vscode.Position(1, 0), new vscode.Position(1, 0));
        await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Recupera el decorationsMap
        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');
        const decorationsMapStr = JSON.stringify(decorationsMap);

        // Comprueba que pasted tiene contenido y los otros no
        let tipo = '"withSpace":[{';
        assert.ok(
            !decorationsMapStr.includes(tipo),
            `withSpace deberÃ­a estar vacÃ­o. Log capturado:\n${decorationsMapStr}`
        );

        tipo = '"withoutSpace":[{';
        assert.ok(
            !decorationsMapStr.includes(tipo),
            `withoutSpace deberÃ­a estar vacÃ­o. Log capturado:\n${decorationsMapStr}`
        );

        tipo = '"pasted":[{';
        assert.ok(
            decorationsMapStr.includes(tipo),
            `No se encontrÃ³ el tipo ${tipo} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`DecorationsMap tras pegar texto: ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 6
    test('Cambio de color de fondo y comprobaciÃ³n del color seleccionando AI', async () => {
        const seleccionada = 'Change bg color with AI';

        const rgb = [
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256)
        ];

        let llamada = 0;
        const originalShowInputBox = vscode.window.showInputBox;
        vscode.window.showInputBox = async () => String(rgb[llamada++]);

        await vscode.commands.executeCommand('extension.applySelection', seleccionada);

        vscode.window.showInputBox = originalShowInputBox;

        const rgbaStr = await vscode.commands.executeCommand('identifAI.returnColorWith');
        assert.ok(typeof rgbaStr === 'string', `El comando no devolviÃ³ una cadena: ${rgbaStr}`);
        const match = rgbaStr.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\s*\)/);
        if (!match) return null;
        const color = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];

        console.log('Esperado:', rgb);
        console.log('Devuelto:', color);
        console.log('Iguales:', color[0] === rgb[0], color[1] === rgb[1], color[2] === rgb[2]);

        assert.ok(
            color[0] === rgb[0] && color[1] === rgb[1] && color[2] === rgb[2],
            `Color devuelto incorrecto para ${seleccionada}: esperado (${rgb.join(',')}) pero fue (${color.join(',')})`
        );

        console.log(`OK: Color ${seleccionada} seleccionado correctamente: (${color[0]},${color[1]},${color[2]})`);
    });

    // Test 7
    test('Cambio de color de fondo y comprobaciÃ³n del color seleccionando vs', async () => {
        const seleccionada = 'Change bg color with VS';

        const rgb = [
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256)
        ];

        let llamada = 0;
        const originalShowInputBox = vscode.window.showInputBox;
        vscode.window.showInputBox = async () => String(rgb[llamada++]);

        await vscode.commands.executeCommand('extension.applySelection', seleccionada);

        vscode.window.showInputBox = originalShowInputBox;

        const rgbaStr = await vscode.commands.executeCommand('identifAI.returnColorWithout');
        assert.ok(typeof rgbaStr === 'string', `El comando no devolviÃ³ una cadena: ${rgbaStr}`);
        const match = rgbaStr.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\s*\)/);
        if (!match) return null;
        const color = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];

        console.log('Esperado:', rgb);
        console.log('Devuelto:', color);
        console.log('Iguales:', color[0] === rgb[0], color[1] === rgb[1], color[2] === rgb[2]);

        assert.ok(
            color[0] === rgb[0] && color[1] === rgb[1] && color[2] === rgb[2],
            `Color devuelto incorrecto para ${seleccionada}: esperado (${rgb.join(',')}) pero fue (${color.join(',')})`
        );

        console.log(`OK: Color ${seleccionada} seleccionado correctamente: (${color[0]},${color[1]},${color[2]})`);
    });

    // Test 8
    test('Cambio de color de fondo y comprobaciÃ³n del color para texto pegado', async () => {
        const seleccionada = 'Change bg color for pasted text';

        const rgb = [
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256)
        ];

        let llamada = 0;
        const originalShowInputBox = vscode.window.showInputBox;
        vscode.window.showInputBox = async () => String(rgb[llamada++]);

        await vscode.commands.executeCommand('extension.applySelection', seleccionada);

        vscode.window.showInputBox = originalShowInputBox;

        const rgbaStr = await vscode.commands.executeCommand('identifAI.returnColorPasted');
        assert.ok(typeof rgbaStr === 'string', `El comando no devolviÃ³ una cadena: ${rgbaStr}`);
        const match = rgbaStr.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\s*\)/);
        if (!match) return null;
        const color = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];

        console.log('Esperado:', rgb);
        console.log('Devuelto:', color);
        console.log('Iguales:', color[0] === rgb[0], color[1] === rgb[1], color[2] === rgb[2]);

        assert.ok(
            color[0] === rgb[0] && color[1] === rgb[1] && color[2] === rgb[2],
            `Color devuelto incorrecto para ${seleccionada}: esperado (${rgb.join(',')}) pero fue (${color.join(',')})`
        );

        console.log(`OK: Color ${seleccionada} seleccionado correctamente: (${color[0]},${color[1]},${color[2]})`);
    });

    // Test 9
    test('DecorationsMap contiene los ficheros correctos', async () => {
        const doc1 = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor1 = await vscode.window.showTextDocument(doc1);

        await editor1.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        const fileName1 = doc1.uri.fsPath.split(/[\\/]/).pop();
        
        const doc2 = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor2 = await vscode.window.showTextDocument(doc2);

        await editor2.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');

        const decorationsMapStr = JSON.stringify(decorationsMap);
        
        const fileName2 = doc2.uri.fsPath.split(/[\\/]/).pop();
        assert.ok(
            decorationsMapStr.includes(fileName1),
            `No se encontrÃ³ el archivo ${fileName1} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        assert.ok(
            decorationsMapStr.includes(fileName2),
            `No se encontrÃ³ el archivo ${fileName2} en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`El fichero ${fileName1} y el fichero ${fileName2} se encuentra en ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 10
    test('DecorationsMap funciona en fichero con muchas lÃ­neas', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            for (let i = 0; i < 10000; i++) {
                editBuilder.insert(new vscode.Position(i, 0), '\n');
            }
            editBuilder.insert(new vscode.Position(10000, 0), 'c');
            editBuilder.insert(new vscode.Position(10000, 1), 'o');
            editBuilder.insert(new vscode.Position(10000, 2), 'n');
            editBuilder.insert(new vscode.Position(10000, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');

        const decorationsMapStr = JSON.stringify(decorationsMap);
        
        const fileName = doc.uri.fsPath.split(/[\\/]/).pop();
        assert.ok(
            decorationsMapStr.includes("10000"),
            `No se encontrÃ³ la decoraciÃ³n del archivo ${fileName} lÃ­nea 10000 en el log de decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`El fichero ${fileName} tiene una decoraciÃ³n en la lÃ­nea 10000 y se encuentra en decorationsMap = ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 11
    test('DecorationsMap actualiza el rango tras borrar caracteres al principio', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 2));
        await vscode.commands.executeCommand('deleteLeft');
        await new Promise(resolve => setTimeout(resolve, 500));

        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');
        const decorationsMapStr = JSON.stringify(decorationsMap);

        const rangoEsperado = '"range":[{"line":0,"character":0},{"line":0,"character":5}]}]';
        assert.ok(
            decorationsMapStr.includes(rangoEsperado),
            `No se encontrÃ³ el rango actualizado ${rangoEsperado} en decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`Tras borrar, el rango actualizado es correcto: ${rangoEsperado} en ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 12
    test('DecorationsMap actualiza el rango tras borrar caracteres en mÃºltiples lÃ­neas', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 7), '\n');
            editBuilder.insert(new vscode.Position(1, 0), 'c');
            editBuilder.insert(new vscode.Position(1, 1), 'o');
            editBuilder.insert(new vscode.Position(1, 2), 'n');
            editBuilder.insert(new vscode.Position(1, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        editor.selection = new vscode.Selection(new vscode.Position(0, 4), new vscode.Position(1, 2));
        await vscode.commands.executeCommand('deleteLeft');
        await new Promise(resolve => setTimeout(resolve, 500));

        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');
        const decorationsMapStr = JSON.stringify(decorationsMap);
        console.log(`DecorationsMap tras borrar: ${decorationsMapStr}`);

        const rangoEsperado1 = '{"range":[{"line":0,"character":0},{"line":0,"character":4}]}';
        const rangoEsperado2 = '{"range":[{"line":0,"character":4},{"line":0,"character":9}]}';
        assert.ok(
            decorationsMapStr.includes(rangoEsperado1) && decorationsMapStr.includes(rangoEsperado2),
            `No se encontrÃ³ el rango actualizado ${rangoEsperado1} en decorationsMap. Log capturado:\n${decorationsMapStr}`
        );

        console.log(`Tras borrar, el rango actualizado es \nrango1 = ${rangoEsperado1} \nrango2 = ${rangoEsperado2} \nen ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 13
    test('DecorationsMap actualiza el rango tras editar caracteres del medio', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 2), 'c');
        });

        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');
        const decorationsMapStr = JSON.stringify(decorationsMap);

        const rangoEsperado1 = '{"range":[{"line":0,"character":0},{"line":0,"character":2}]}';
        const rangoEsperado2 = '{"range":[{"line":0,"character":3},{"line":0,"character":8}]}';
        assert.ok(
            decorationsMapStr.includes(rangoEsperado1) && decorationsMapStr.includes(rangoEsperado2),
            `No se encontrÃ³ el rango actualizado ${rangoEsperado1} o ${rangoEsperado2} en decorationsMap. Log capturado:\n${decorationsMapStr}`
        );
        console.log(`Tras borrar, el rango actualizado es correcto: \nRango esperado1 = ${rangoEsperado1} \nRango esperado 2 = ${rangoEsperado1} \nDecorationsMap = ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    // Test 14: Copiar el siguiente texto antes de ejecutar el test -> Texto a copiar
    test('DecorationsMap actualiza el rango tras editar pasted, AI y Vs en el medio de vs', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'c');
            editBuilder.insert(new vscode.Position(0, 1), 'o');
            editBuilder.insert(new vscode.Position(0, 2), 'n');
            editBuilder.insert(new vscode.Position(0, 3), 'f');
        });

        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        await new Promise(resolve => setTimeout(resolve, 500));

        editor.selection = new vscode.Selection(new vscode.Position(0, 2), new vscode.Position(0, 2));
        await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        await new Promise(resolve => setTimeout(resolve, 500));
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 3), 'Sim AI');
        });
        const decorationsMap = await vscode.commands.executeCommand('identifAI.returnIAMap');
        const decorationsMapStr = JSON.stringify(decorationsMap);

        const rangoAI = '"withSpace":[{"range":[{"line":0,"character":3},{"line":0,"character":9}]}]';
        const rangoVS = '"withoutSpace":[{"range":[{"line":0,"character":0},{"line":0,"character":2}]},{"range":[{"line":0,"character":22},{"line":0,"character":27}]}]';
        const rangoPasted = '"pasted":[{"range":[{"line":0,"character":2},{"line":0,"character":3}]},{"range":[{"line":0,"character":9},{"line":0,"character":22}]}]';
        console.log(`DecorationsMap tras editar: ${decorationsMapStr}`);
        assert.ok(
            decorationsMapStr.includes(rangoAI) && decorationsMapStr.includes(rangoVS) && decorationsMapStr.includes(rangoPasted),
            `No se encontrÃ³ el rango actualizado ${rangoAI} o ${rangoVS} o ${rangoPasted} en decorationsMap. Log capturado:\n${decorationsMapStr}`
        );
        console.log(`Tras borrar, el rango actualizado es correcto: \nRango AI = ${rangoAI} \nRango VS = ${rangoVS} \nRango Pasted = ${rangoPasted} \nDecorationsMap = ${decorationsMapStr}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

});