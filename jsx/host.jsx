// Text Frame Inspector - Host Script (ExtendScript)

var DEFAULT_PLACEHOLDER_PREFIXES = [
    "滚滚",
    "滚滚长江东逝水",
    "是非",
    "是非成败转头空",
    "lorem",
    "lorem ipsum",
    "ipsum",
    "placeholder",
    "dummy text",
    "sample text",
    "the quick brown fox",
    "your text here",
    "text goes here",
    "enter text",
    "type your text",
    "请输入",
    "文本内容",
    "在此输入"
];

var TINY_FONT_PT = 2;
var TFI_MARK_LAYER_NAME = "__TextFrameInspector__";
var TFI_ALL_GROUP_NAME = "__TFI_ALL__";
var TFI_RISK_GROUP_NAME = "__TFI_RISK__";
var TFI_FOCUS_GROUP_NAME = "__TFI_FOCUS__";
var TFI_SETTINGS = {
    prefixes: DEFAULT_PLACEHOLDER_PREFIXES,
    allColor: { red: 255, green: 170, blue: 0 },
    riskColor: { red: 255, green: 60, blue: 60 },
    focusColor: { red: 0, green: 200, blue: 255 },
    allWidth: 1,
    riskWidth: 2,
    focusWidth: 2,
    crossWidth: 1.5
};

function _tfiEscapeString(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, "\\\"")
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t")
        .replace(/\f/g, "\\f");
}

function _tfiToJson(value) {
    if (value === null) {
        return "null";
    }

    var valueType = typeof value;

    if (valueType === "string") {
        return "\"" + _tfiEscapeString(value) + "\"";
    }

    if (valueType === "number") {
        return isFinite(value) ? String(value) : "null";
    }

    if (valueType === "boolean") {
        return value ? "true" : "false";
    }

    if (value instanceof Array) {
        var items = [];
        for (var i = 0; i < value.length; i++) {
            items.push(_tfiToJson(value[i]));
        }
        return "[" + items.join(",") + "]";
    }

    if (valueType === "object") {
        var pairs = [];
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                pairs.push("\"" + _tfiEscapeString(key) + "\":" + _tfiToJson(value[key]));
            }
        }
        return "{" + pairs.join(",") + "}";
    }

    return "null";
}

function _tfiSuccess(data) {
    return _tfiToJson(data);
}

function _tfiError(message, detail) {
    return _tfiToJson({
        error: String(message || "Unknown error"),
        detail: detail ? String(detail) : ""
    });
}

function _tfiSafeString(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
}

function _tfiTrim(value) {
    return _tfiSafeString(value).replace(/^\s+|\s+$/g, "");
}

function _tfiGetFontSize(textFrame) {
    try {
        if (textFrame.characters.length > 0) {
            return textFrame.characters[0].characterAttributes.size;
        }
    } catch (e) {}
    return null;
}

function _tfiGetLayerName(textFrame) {
    try {
        return _tfiSafeString(textFrame.layer.name);
    } catch (e) {}
    return "";
}

function _tfiGetDocument() {
    if (!app.documents.length) {
        return null;
    }
    return app.activeDocument;
}

function _tfiNormalizeText(value) {
    return _tfiTrim(value).toLowerCase();
}

function _tfiParsePositiveNumber(value, fallback) {
    var num = parseFloat(value);
    return isFinite(num) && num > 0 ? num : fallback;
}

function _tfiHexToRgb(hex, fallback) {
    var value = _tfiTrim(hex).replace(/^#/, "");
    if (value.length === 3) {
        value = value.charAt(0) + value.charAt(0) +
            value.charAt(1) + value.charAt(1) +
            value.charAt(2) + value.charAt(2);
    }

    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        return fallback;
    }

    return {
        red: parseInt(value.substring(0, 2), 16),
        green: parseInt(value.substring(2, 4), 16),
        blue: parseInt(value.substring(4, 6), 16)
    };
}

function _tfiColorFromSettings(rgb) {
    return _tfiCreateRgbColor(rgb.red, rgb.green, rgb.blue);
}

function setInspectorSettings(jsonText) {
    try {
        if (jsonText === null || jsonText === undefined || jsonText === "") {
            return _tfiSuccess({ success: true });
        }

        var parsed = eval("(" + String(jsonText) + ")");
        var prefixes = [];
        if (parsed.prefixes && parsed.prefixes.length) {
            for (var i = 0; i < parsed.prefixes.length; i++) {
                var prefix = _tfiTrim(parsed.prefixes[i]);
                if (prefix) {
                    prefixes.push(prefix);
                }
            }
        }

        TFI_SETTINGS.prefixes = prefixes.length ? prefixes : DEFAULT_PLACEHOLDER_PREFIXES;
        TFI_SETTINGS.allColor = _tfiHexToRgb(parsed.allColor, TFI_SETTINGS.allColor);
        TFI_SETTINGS.riskColor = _tfiHexToRgb(parsed.riskColor, TFI_SETTINGS.riskColor);
        TFI_SETTINGS.focusColor = _tfiHexToRgb(parsed.focusColor, TFI_SETTINGS.focusColor);
        TFI_SETTINGS.allWidth = _tfiParsePositiveNumber(parsed.allWidth, TFI_SETTINGS.allWidth);
        TFI_SETTINGS.riskWidth = _tfiParsePositiveNumber(parsed.riskWidth, TFI_SETTINGS.riskWidth);
        TFI_SETTINGS.focusWidth = _tfiParsePositiveNumber(parsed.focusWidth, TFI_SETTINGS.focusWidth);
        TFI_SETTINGS.crossWidth = _tfiParsePositiveNumber(parsed.crossWidth, TFI_SETTINGS.crossWidth);

        return _tfiSuccess({ success: true });
    } catch (err) {
        return _tfiError("配置解析失败 / Settings parse failed", err && err.message ? err.message : err);
    }
}

function _tfiIsPlaceholderText(value) {
    var text = _tfiNormalizeText(value);
    if (!text) {
        return false;
    }

    for (var i = 0; i < TFI_SETTINGS.prefixes.length; i++) {
        var prefix = _tfiNormalizeText(TFI_SETTINGS.prefixes[i]);
        if (prefix && text.indexOf(prefix) === 0) {
            return true;
        }
    }

    return false;
}

function _tfiGetMarkLayer(doc) {
    var layer = null;
    try {
        layer = doc.layers.getByName(TFI_MARK_LAYER_NAME);
    } catch (e) {}

    if (!layer) {
        layer = doc.layers.add();
        layer.name = TFI_MARK_LAYER_NAME;
    }

    layer.visible = true;
    layer.locked = false;
    layer.printable = false;
    return layer;
}

function _tfiFindPageItemByName(container, name) {
    for (var i = 0; i < container.pageItems.length; i++) {
        if (container.pageItems[i].name === name) {
            return container.pageItems[i];
        }
    }
    return null;
}

function _tfiRemoveNamedItem(container, name) {
    var item = _tfiFindPageItemByName(container, name);
    if (item) {
        try {
            item.remove();
        } catch (e) {}
    }
}

function _tfiGetOrCreateGroup(layer, name) {
    var group = null;
    try {
        group = layer.groupItems.getByName(name);
    } catch (e) {}

    if (!group) {
        group = layer.groupItems.add();
        group.name = name;
    }

    return group;
}

function _tfiCreateRgbColor(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}

function _tfiGetBoundsInfo(textFrame) {
    var gb = textFrame.geometricBounds;
    var left = gb[0];
    var top = gb[1];
    var right = gb[2];
    var bottom = gb[3];

    return {
        left: left,
        top: top,
        right: right,
        bottom: bottom,
        width: right - left,
        height: top - bottom,
        centerX: (left + right) / 2,
        centerY: (top + bottom) / 2
    };
}

function _tfiDrawRect(group, bounds, strokeColor, strokeWidth) {
    var rect = group.pathItems.rectangle(bounds.top, bounds.left, bounds.width, bounds.height);
    rect.stroked = true;
    rect.strokeWidth = strokeWidth;
    rect.strokeColor = strokeColor;
    rect.filled = false;
    return rect;
}

function _tfiDrawLine(group, x1, y1, x2, y2, strokeColor, strokeWidth) {
    var line = group.pathItems.add();
    line.setEntirePath([[x1, y1], [x2, y2]]);
    line.stroked = true;
    line.strokeWidth = strokeWidth;
    line.strokeColor = strokeColor;
    line.filled = false;
    return line;
}

function _tfiPrepareMarkLayer(doc) {
    var layer = _tfiGetMarkLayer(doc);
    _tfiRemoveNamedItem(layer, TFI_ALL_GROUP_NAME);
    _tfiRemoveNamedItem(layer, TFI_RISK_GROUP_NAME);
    _tfiRemoveNamedItem(layer, TFI_FOCUS_GROUP_NAME);
    return layer;
}

function _tfiHasRiskTextFrame(textFrame) {
    var rawContent = _tfiSafeString(textFrame.contents);
    if (_tfiIsPlaceholderText(rawContent)) {
        return true;
    }

    var fontSize = _tfiGetFontSize(textFrame);
    if (fontSize !== null && fontSize < TINY_FONT_PT) {
        return true;
    }

    if (rawContent.replace(/\s/g, "") === "") {
        return true;
    }

    try {
        if (!textFrame.layer.visible) {
            return true;
        }
    } catch (e1) {}

    try {
        if (textFrame.opacity === 0) {
            return true;
        }
    } catch (e2) {}

    return false;
}

function getAllTextFrames() {
    try {
        var doc = _tfiGetDocument();
        if (!doc) {
            return _tfiError("没有打开的文档 / No document open");
        }

        var abIdx = doc.artboards.getActiveArtboardIndex();
        var abRect = doc.artboards[abIdx].artboardRect;
        var results = [];

        for (var i = 0; i < doc.textFrames.length; i++) {
            var tf = doc.textFrames[i];
            var rawContent = _tfiSafeString(tf.contents);
            var gb = tf.geometricBounds;
            var risks = [];

            if (_tfiIsPlaceholderText(rawContent)) {
                risks.push("占位文本");
            }

            var fontSize = _tfiGetFontSize(tf);
            if (fontSize !== null && fontSize < TINY_FONT_PT) {
                risks.push("字号" + fontSize + "pt");
            }

            var outside = (
                gb[0] > abRect[2] ||
                gb[2] < abRect[0] ||
                gb[1] < abRect[3] ||
                gb[3] > abRect[1]
            );
            if (outside) {
                risks.push("画板外");
            }

            try {
                if (!tf.layer.visible) {
                    risks.push("隐藏图层");
                }
            } catch (e1) {}

            try {
                if (tf.opacity === 0) {
                    risks.push("透明度=0");
                }
            } catch (e2) {}

            if (rawContent.replace(/\s/g, "") === "") {
                risks.push("空文本框");
            }

            var display = rawContent;
            if (display.length > 80) {
                display = display.substring(0, 80) + "...";
            }

            results.push({
                index: i,
                content: display,
                fontInfo: fontSize !== null ? (fontSize + "pt") : "",
                hasRisk: risks.length > 0,
                risks: risks,
                layerName: _tfiGetLayerName(tf)
            });
        }

        return _tfiSuccess({
            total: doc.textFrames.length,
            frames: results
        });
    } catch (err) {
        return _tfiError("扫描失败 / Scan failed", err && err.message ? err.message : err);
    }
}

function selectTextFrame(index) {
    try {
        var doc = _tfiGetDocument();
        if (!doc) {
            return _tfiError("没有打开的文档 / No document open");
        }

        if (index < 0 || index >= doc.textFrames.length) {
            return _tfiError("文本框索引无效 / Invalid text frame index");
        }

        var tf = doc.textFrames[index];
        var bounds = _tfiGetBoundsInfo(tf);
        var abIdx = doc.artboards.getActiveArtboardIndex();
        var abRect = doc.artboards[abIdx].artboardRect;
        var markLayer = _tfiGetMarkLayer(doc);

        _tfiRemoveNamedItem(markLayer, TFI_FOCUS_GROUP_NAME);

        var group = _tfiGetOrCreateGroup(markLayer, TFI_FOCUS_GROUP_NAME);
        var crossColor = _tfiColorFromSettings(TFI_SETTINGS.focusColor);
        var boxColor = _tfiColorFromSettings(TFI_SETTINGS.allColor);

        _tfiDrawRect(group, bounds, boxColor, TFI_SETTINGS.focusWidth);
        _tfiDrawLine(group, bounds.centerX, abRect[1], bounds.centerX, abRect[3], crossColor, TFI_SETTINGS.crossWidth);
        _tfiDrawLine(group, abRect[0], bounds.centerY, abRect[2], bounds.centerY, crossColor, TFI_SETTINGS.crossWidth);

        doc.selection = null;
        tf.selected = true;
        try {
            app.redraw();
        } catch (e1) {}
        try {
            app.executeMenuCommand("fitselection");
        } catch (e2) {
            try {
                app.executeMenuCommand("zoomToSelection");
            } catch (e3) {}
        }
        try {
            app.redraw();
        } catch (e4) {}

        return _tfiSuccess({
            success: true,
            index: index
        });
    } catch (err) {
        return _tfiError("定位失败 / Select failed", err && err.message ? err.message : err);
    }
}

function highlightAllTextFrames() {
    try {
        var doc = _tfiGetDocument();
        if (!doc) {
            return _tfiError("没有打开的文档 / No document open");
        }

        var markLayer = _tfiPrepareMarkLayer(doc);
        var group = _tfiGetOrCreateGroup(markLayer, TFI_ALL_GROUP_NAME);
        var cleanColor = _tfiColorFromSettings(TFI_SETTINGS.allColor);
        var riskColor = _tfiColorFromSettings(TFI_SETTINGS.riskColor);
        var count = 0;

        for (var i = 0; i < doc.textFrames.length; i++) {
            var tf = doc.textFrames[i];
            try {
                var bounds = _tfiGetBoundsInfo(tf);
                var color = _tfiIsPlaceholderText(tf.contents) ? riskColor : cleanColor;
                _tfiDrawRect(group, bounds, color, _tfiIsPlaceholderText(tf.contents) ? TFI_SETTINGS.riskWidth : TFI_SETTINGS.allWidth);
                count++;
            } catch (itemErr) {}
        }

        try {
            app.redraw();
        } catch (e) {}

        return _tfiSuccess({
            success: true,
            count: count
        });
    } catch (err) {
        return _tfiError("高亮失败 / Highlight failed", err && err.message ? err.message : err);
    }
}

function highlightRiskTextFrames() {
    try {
        var doc = _tfiGetDocument();
        if (!doc) {
            return _tfiError("没有打开的文档 / No document open");
        }

        var markLayer = _tfiPrepareMarkLayer(doc);
        var group = _tfiGetOrCreateGroup(markLayer, TFI_RISK_GROUP_NAME);
        var riskColor = _tfiColorFromSettings(TFI_SETTINGS.riskColor);
        var count = 0;

        for (var i = 0; i < doc.textFrames.length; i++) {
            var tf = doc.textFrames[i];
            try {
                if (!_tfiHasRiskTextFrame(tf)) {
                    continue;
                }
                var bounds = _tfiGetBoundsInfo(tf);
                _tfiDrawRect(group, bounds, riskColor, TFI_SETTINGS.riskWidth);
                count++;
            } catch (itemErr) {}
        }

        try {
            app.redraw();
        } catch (e) {}

        return _tfiSuccess({
            success: true,
            count: count
        });
    } catch (err) {
        return _tfiError("高亮敏感字失败 / Highlight risky text failed", err && err.message ? err.message : err);
    }
}

function clearHighlights() {
    try {
        var doc = _tfiGetDocument();
        if (!doc) {
            return _tfiSuccess({ success: true, count: 0 });
        }

        var removed = 0;
        var layer = null;
        try {
            layer = doc.layers.getByName(TFI_MARK_LAYER_NAME);
        } catch (e1) {}

        if (layer) {
            try {
                removed += layer.pageItems.length;
            } catch (e2) {}
            try {
                layer.remove();
            } catch (e3) {}
        }

        try {
            doc.selection = null;
        } catch (e4) {}
        try {
            app.redraw();
        } catch (e5) {}

        return _tfiSuccess({
            success: true,
            count: removed
        });
    } catch (err) {
        return _tfiError("还原失败 / Restore failed", err && err.message ? err.message : err);
    }
}
