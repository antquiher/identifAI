const vscode = require('vscode');

function getChildrenForProvider1() {
    return [
        new OptionItem('Change bg color with AI'),
        new OptionItem('Change bg color with VS'),
        new OptionItem('Change bg color for pasted text')
    ];
}

function getChildrenForProvider2(document, decorationsMap) {
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
        new vscode.TreeItem(`Text with AI: ${withSpacePercentage}%`, vscode.TreeItemCollapsibleState.None),
        new vscode.TreeItem(`Text with VS: ${withoutSpacePercentage}%`, vscode.TreeItemCollapsibleState.None),
        new vscode.TreeItem(`Pasted text: ${pastedPercentage}%`, vscode.TreeItemCollapsibleState.None),
        new vscode.TreeItem(`Default text: ${defaultPercentage}%`, vscode.TreeItemCollapsibleState.None)
    ];

    items[0].iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('editorError.foreground'));
    items[1].iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('editorWarning.foreground'));
    items[2].iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('editorInfo.foreground'));
    items[3].iconPath = new vscode.ThemeIcon('circle-filled');

    return items;
}

function handleApplySelection(label, context, decorationTypeWithSpace, decorationTypeWithoutSpace, decorationTypePasted) {
    return async () => {
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
        const newColor = `rgba(${r}, ${g}, ${b},0.3)`;

        if (label === 'Change bg color with AI') {
            decorationTypeWithSpace.dispose();
            decorationTypeWithSpace = vscode.window.createTextEditorDecorationType({
                backgroundColor: newColor
            });
            context.globalState.update('colorWithSpace', newColor);
        } else if (label === 'Change bg color with VS') {
            decorationTypeWithoutSpace.dispose();
            decorationTypeWithoutSpace = vscode.window.createTextEditorDecorationType({
                backgroundColor: newColor
            });
            context.globalState.update('colorWithoutSpace', newColor);
        } else if (label === 'Change bg color for pasted text') {
            decorationTypePasted.dispose();
            decorationTypePasted = vscode.window.createTextEditorDecorationType({
                backgroundColor: newColor
            });
            context.globalState.update('colorPasted', newColor);
        }

        // Devolver el label y el nuevo color
        return [label, newColor];
    };
}


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

function getNavigationTreeItemsGrouped(decorationsMap) {
    const items = [];

    for (const [fileUri, decorations] of Object.entries(decorationsMap)) {
        const fileItem = {
            label: fileUri,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            children: []
        };

        const types = {
            "With vs": decorations.withoutSpace,
            "With AI": decorations.withSpace,
            "Pasted": decorations.pasted
        };

        for (const [type, ranges] of Object.entries(types)) {
            if (ranges && ranges.length > 0) {
                const typeItem = {
                    label: type,
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                    children: []
                };

                ranges.forEach(decoration => {
                    const doc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === fileUri);
                    const text = doc ? doc.getText(decoration.range) : "<Texto no disponible>";
                    typeItem.children.push({
                        label: `- ${text}`,
                        collapsibleState: vscode.TreeItemCollapsibleState.None
                    });
                });

                fileItem.children.push(typeItem);
            }
        }

        items.push(fileItem);
    }

    return items;
}


module.exports = {
    getChildrenForProvider1,
    getChildrenForProvider2,
    handleApplySelection,
    OptionItem,
    getNavigationTreeItemsGrouped
};