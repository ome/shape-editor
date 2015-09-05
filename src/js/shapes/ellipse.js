/*
// Copyright (C) 2015 University of Dundee & Open Microscopy Environment.
// All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* globals Raphael: false */
/* globals console: false */

var Ellipse = function Ellipse(options) {

    var self = this;
    this.manager = options.manager;
    this.paper = options.paper;

    if (options.id) {
        this._id = options.id;
    } else {
        this._id = this.manager.getRandomId();
    }
    this._cx = options.cx;
    this._cy = options.cy;
    this._rx = options.rx;
    this._ry = options.ry;
    this._rotation = options.rotation || 0;

    this._strokeColor = options.strokeColor;
    this._strokeWidth = options.strokeWidth || 2;
    this._selected = false;
    this._zoomFraction = 1;
    if (options.zoom) {
        this._zoomFraction = options.zoom / 100;
    }
    this.handle_wh = 6;

    this.element = this.paper.ellipse();
    this.element.attr({'fill-opacity': 0.01, 'fill': '#fff'});

    // Drag handling of ellipse
    if (this.manager.canEdit) {
        this.element.drag(
            function(dx, dy) {
                // DRAG, update location and redraw
                dx = dx / self._zoomFraction;
                dy = dy / self._zoomFraction;
                self._cx = dx+this.ox;
                self._cy = this.oy+dy;
                self.drawShape();
                return false;
            },
            function() {
                // START drag: note the start location
                self._handleMousedown();
                this.ox = self._cx;
                this.oy = self._cy;
                return false;
            },
            function() {
                // STOP
                // notify changed if moved
                if (this.ox !== self._cx || this.oy !== self._cy) {
                    self.manager.notifyShapeChanged(self);
                }
                return false;
            }
        );
    }

    this.createHandles();

    this.drawShape();
};

Ellipse.prototype.toJson = function toJson() {
    var rv = {
        'type': "Ellipse",
        'cx': this._cx,
        'cy': this._cy,
        'rx': this._rx,
        'ry': this._ry,
        'rotation': this._rotation,
        'strokeWidth': this._strokeWidth,
        'strokeColor': this._strokeColor
    };
    if (this._id) {
        rv.id = this._id;
    }
    return rv;
};

Ellipse.prototype.compareCoords = function compareCoords(json) {

    var selfJson = this.toJson(),
        match = true;
    if (json.type !== selfJson.type) {
        return false;
    }
    ['cx', 'cy', 'rx', 'ry', 'rotation'].forEach(function(c){
        if (json[c] !== selfJson[c]) {
            match = false;
        }
    });
    return match;
};

// Useful for pasting json with an offset
Ellipse.prototype.offsetCoords = function offsetCoords(json, dx, dy) {
    json.cx = json.cx + dx;
    json.cy = json.cy + dy;
    return json;
};

// handle start of drag by selecting this shape
Ellipse.prototype._handleMousedown = function _handleMousedown() {
    this.manager.selectShape(this);
};

Ellipse.prototype.setColor = function setColor(strokeColor) {
    this._strokeColor = strokeColor;
    this.drawShape();
};

Ellipse.prototype.getStrokeColor = function getStrokeColor() {
    return this._strokeColor;
};

Ellipse.prototype.setStrokeColor = function setStrokeColor(strokeColor) {
    this._strokeColor = strokeColor;
    this.drawShape();
};

Ellipse.prototype.setStrokeWidth = function setStrokeWidth(strokeWidth) {
    this._strokeWidth = strokeWidth;
    this.drawShape();
};

Ellipse.prototype.getStrokeWidth = function getStrokeWidth() {
    return this._strokeWidth;
};

Ellipse.prototype.destroy = function destroy() {
    this.element.remove();
    this.handles.remove();
};

Ellipse.prototype.intersectRegion = function intersectRegion(region) {
    var path = this.manager.regionToPath(region, this._zoomFraction * 100);
    var f = this._zoomFraction,
        x = parseInt(this._cx * f, 10),
        y = parseInt(this._cy * f, 10);

    if (Raphael.isPointInsidePath(path, x, y)) {
        return true;
    }
    var path2 = this.getPath(),
        i = Raphael.pathIntersection(path, path2);
    return (i.length > 0);
};

Ellipse.prototype.getPath = function getPath() {

    // Adapted from https://github.com/poilu/raphael-boolean
    var a = this.element.attrs,
        rx = a.rx,
        ry = a.ry,
        cornerPoints = [
            [a.cx - rx, a.cy - ry],
            [a.cx + rx, a.cy - ry],
            [a.cx + rx, a.cy + ry],
            [a.cx - rx, a.cy + ry]
        ],
        path = [];
    var radiusShift = [
        [
            [0, 1],
            [1, 0]
        ],
        [
            [-1, 0],
            [0, 1]
        ],
        [
            [0, -1],
            [-1, 0]
        ],
        [
            [1, 0],
            [0, -1]
        ]
    ];

    //iterate all corners
    for (var i = 0; i <= 3; i++) {
        //insert starting point
        if (i === 0) {
            path.push(["M", cornerPoints[0][0], cornerPoints[0][1] + ry]);
        }

        //insert "curveto" (radius factor .446 is taken from Inkscape)
        var c1 = [cornerPoints[i][0] + radiusShift[i][0][0] * rx * 0.446, cornerPoints[i][1] + radiusShift[i][0][1] * ry * 0.446];
        var c2 = [cornerPoints[i][0] + radiusShift[i][1][0] * rx * 0.446, cornerPoints[i][1] + radiusShift[i][1][1] * ry * 0.446];
        var p2 = [cornerPoints[i][0] + radiusShift[i][1][0] * rx, cornerPoints[i][1] + radiusShift[i][1][1] * ry];
        path.push(["C", c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]]);
    }
    path.push(["Z"]);
    path = path.join(",").replace(/,?([achlmqrstvxz]),?/gi, "$1");

    if (this._rotation !== 0) {
        path = Raphael.transformPath(path, "r" + this._rotation);
    }
    return path;
};

Ellipse.prototype.isSelected = function isSelected() {
    return this._selected;
};

Ellipse.prototype.setZoom = function setZoom(zoom) {
    this._zoomFraction = zoom / 100;
    this.drawShape();
};

Ellipse.prototype.updateHandle = function updateHandle(handleId, x, y) {
    // Refresh the handle coordinates, then update the specified handle
    // using MODEL coordinates
    this._handleIds = this.getHandleCoords();
    var h = this._handleIds[handleId];
    h.x = x;
    h.y = y;
    this.updateShapeFromHandles();
};

Ellipse.prototype.updateShapeFromHandles = function updateShapeFromHandles() {
    var hh = this._handleIds,
        lengthX = hh.end.x - hh.start.x,
        lengthY = hh.end.y - hh.start.y,
        widthX = hh.left.x - hh.right.x,
        widthY = hh.left.y - hh.right.y,
        rot;
    if (lengthX === 0){
        this._rotation = 90;
    } else if (lengthX > 0) {
        rot = Math.atan(lengthY / lengthX);
        this._rotation = Raphael.deg(rot);
    } else if (lengthX < 0) {
        rot = Math.atan(lengthY / lengthX);
        this._rotation = 180 + Raphael.deg(rot);
    }
    
    this._cx = (hh.start.x + hh.end.x)/2;
    this._cy = (hh.start.y + hh.end.y)/2;
    this._rx = Math.sqrt((lengthX * lengthX) + (lengthY * lengthY)) / 2;
    this._ry = Math.sqrt((widthX * widthX) + (widthY * widthY)) / 2;

    this.drawShape();
};

Ellipse.prototype.drawShape = function drawShape() {

    var strokeColor = this._strokeColor,
        strokeW = this._strokeWidth * this._zoomFraction;

    var f = this._zoomFraction,
        cx = this._cx * f,
        cy = this._cy * f,
        rx = this._rx * f,
        ry = this._ry * f;

    this.element.attr({'cx': cx,
                       'cy': cy,
                       'rx': rx,
                       'ry': ry,
                       'stroke': strokeColor,
                       'stroke-width': strokeW});
    this.element.transform('r'+ this._rotation);

    if (this.isSelected()) {
        this.element.toFront();
        this.handles.show().toFront();
    } else {
        this.handles.hide();
    }

    // handles have been updated (model coords)
    this._handleIds = this.getHandleCoords();
    var hnd, h_id, hx, hy;
    for (var h=0, l=this.handles.length; h<l; h++) {
        hnd = this.handles[h];
        h_id = hnd.h_id;
        hx = this._handleIds[h_id].x * this._zoomFraction;
        hy = this._handleIds[h_id].y * this._zoomFraction;
        hnd.attr({'x':hx-this.handle_wh/2, 'y':hy-this.handle_wh/2});
    }
};

Ellipse.prototype.setSelected = function setSelected(selected) {
    this._selected = !!selected;
    this.drawShape();
};


Ellipse.prototype.createHandles = function createHandles() {
    // ---- Create Handles -----

    // NB: handleIds are used to calculate ellipse coords
    // so handledIds are scaled to MODEL coords, not zoomed.
    this._handleIds = this.getHandleCoords();

    var self = this,
        // map of centre-points for each handle
        handleAttrs = {'stroke': '#4b80f9',
                        'fill': '#fff',
                        'cursor': 'move',
                        'fill-opacity': 1.0};

    // draw handles
    self.handles = this.paper.set();
    var _handle_drag = function() {
        return function (dx, dy, mouseX, mouseY, event) {
            dx = dx / self._zoomFraction;
            dy = dy / self._zoomFraction;
            // on DRAG...
            var absX = dx + this.ox,
                absY = dy + this.oy;
            self.updateHandle(this.h_id, absX, absY);
            return false;
        };
    };
    var _handle_drag_start = function() {
        return function () {
            // START drag: simply note the location we started
            // we scale by zoom to get the 'model' coordinates
            this.ox = (this.attr("x") + this.attr('width')/2) / self._zoomFraction;
            this.oy = (this.attr("y") + this.attr('height')/2) / self._zoomFraction;
            return false;
        };
    };
    var _handle_drag_end = function() {
        return function() {
            // simply notify manager that shape has changed
            self.manager.notifyShapeChanged(self);
            return false;
        };
    };

    var hsize = this.handle_wh,
        hx, hy, handle;
    for (var key in this._handleIds) {
        hx = this._handleIds[key].x;
        hy = this._handleIds[key].y;
        handle = this.paper.rect(hx-hsize/2, hy-hsize/2, hsize, hsize);
        handle.attr({'cursor': 'move'});
        handle.h_id = key;
        handle.line = self;

        if (this.manager.canEdit) {
            handle.drag(
                _handle_drag(),
                _handle_drag_start(),
                _handle_drag_end()
            );
        }
        self.handles.push(handle);
    }

    self.handles.attr(handleAttrs).hide();     // show on selection
};

Ellipse.prototype.getHandleCoords = function getHandleCoords() {
    // Returns MODEL coordinates (not zoom coordinates)
    var rot = Raphael.rad(this._rotation),
        cx = this._cx,
        cy = this._cy,
        rx = this._rx,
        ry = this._ry,
        startX = cx - (Math.cos(rot) * rx),
        startY = cy - (Math.sin(rot) * rx),
        endX = cx + (Math.cos(rot) * rx),
        endY = cy + (Math.sin(rot) * rx),
        leftX = cx + (Math.sin(rot) * ry),
        leftY = cy - (Math.cos(rot) * ry),
        rightX = cx - (Math.sin(rot) * ry),
        rightY = cy + (Math.cos(rot) * ry);

    return {'start':{x: startX, y: startY},
            'end':{x: endX, y: endY},
            'left':{x: leftX, y: leftY},
            'right':{x: rightX, y: rightY}
        };
};


// Class for creating Lines.
var CreateEllipse = function CreateEllipse(options) {

    this.paper = options.paper;
    this.manager = options.manager;
};

CreateEllipse.prototype.startDrag = function startDrag(startX, startY) {

    var strokeColor = this.manager.getStrokeColor(),
        strokeWidth = this.manager.getStrokeWidth(),
        zoom = this.manager.getZoom();

    this.ellipse = new Ellipse({
        'manager': this.manager,
        'paper': this.paper,
        'cx': startX,
        'cy': startY,
        'rx': 0,
        'ry': 50,
        'rotation': 0,
        'strokeWidth': strokeWidth,
        'zoom': zoom,
        'strokeColor': strokeColor});
};

CreateEllipse.prototype.drag = function drag(dragX, dragY) {

    this.ellipse.updateHandle('end', dragX, dragY);
};

CreateEllipse.prototype.stopDrag = function stopDrag() {

    // Don't create ellipse of zero size (click, without drag)
    var coords = this.ellipse.toJson();
    if (coords.rx < 2) {
        this.ellipse.destroy();
        delete this.ellipse;
        return;
    }
    // on the 'new:shape' trigger, this shape will already be selected
    this.ellipse.setSelected(true);
    this.manager.addShape(this.ellipse);
};
