const vscode = require('vscode');

/**
 * Elimina decoraciones de un rango específico.
 */
function deleteFunctionOfIADecoration(decoration, startPos, endPos, subLine, change) {
    const finDelBorrado = change.range.end;

    if (decoration.range.start.line === startPos.line && subLine === 0) {
        const aux = change.rangeLength;
        if ((decoration.range.start.isBefore(startPos) && decoration.range.end.isAfter(endPos)) || 
            (finDelBorrado.isAfter(decoration.range.start) && finDelBorrado.isBefore(decoration.range.end))) {
            return {
                range: new vscode.Range(decoration.range.start, decoration.range.end.translate(0, -aux))
            };
        } else if (decoration.range.start.isAfter(startPos)) {
            return {
                range: new vscode.Range(decoration.range.start.translate(0, -aux), decoration.range.end.translate(0, -aux))
            };
        } else {
            return decoration;
        }
    } else if ((decoration.range.start.line > startPos.line - subLine) && subLine !== 0) {
        return {
            range: new vscode.Range(
                decoration.range.start.translate(subLine, 0),
                decoration.range.end.translate(subLine, 0)
            )
        };
    } else if ((decoration.range.start.line >= startPos.line) && subLine !== 0) {
        if (decoration.range.start.line > startPos.line && decoration.range.end.line < startPos.line - subLine) {
            return null;
        } else if (decoration.range.start.line === startPos.line && decoration.range.end.line < startPos.line - subLine && decoration.range.end.character > startPos.character) {
            return {
                range: new vscode.Range(decoration.range.start, startPos)
            };
        } else if (decoration.range.start.line > startPos.line && decoration.range.end.line === startPos.line - subLine) {
            const endChar = finDelBorrado.character;
            const aux = startPos.character - endChar;
            if (decoration.range.start.character >= endChar) {
                return {
                    range: new vscode.Range(
                        decoration.range.start.translate(subLine, aux),
                        decoration.range.end.translate(subLine, aux)
                    )
                };
            } else if (decoration.range.end.character > endChar && decoration.range.start.character < endChar) {
                return {
                    range: new vscode.Range(startPos, decoration.range.end.translate(subLine, aux))
                };
            }
            return null;
        }
    }
    return decoration;
}

/**
 * Modifica decoraciones en función de un rango específico.
 */
function modifyFunctionOfIAMap(decoration, startPos, endPos, subLine, text) {
    if (decoration.range.contains(startPos)) {
        const beforeRange = new vscode.Range(decoration.range.start, startPos);
        const afterRange = new vscode.Range(startPos.translate(0, text.length), decoration.range.end.translate(0, text.length));
        return [
            { range: beforeRange },
            { range: afterRange }
        ];
    } else if (decoration.range.start.isAfter(startPos) && decoration.range.start.line === startPos.line && subLine === 0) {
        if (decoration.range.start.line === startPos.line) {
            return [{
                range: new vscode.Range(decoration.range.start.translate(0, text.length), decoration.range.end.translate(0, text.length))
            }];
        }
    } else if ((decoration.range.start.isAfter(startPos) || decoration.range.start.isAfter(endPos)) && subLine !== 0) {
        return [{
            range: new vscode.Range(decoration.range.start.translate(subLine, 0), decoration.range.end.translate(subLine, 0))
        }];
    }
    return [decoration];
}

module.exports = {
    deleteFunctionOfIADecoration,
    modifyFunctionOfIAMap
};