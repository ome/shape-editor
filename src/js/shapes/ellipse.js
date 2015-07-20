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

    this._cx = options.cx;
    this._cy = options.cy;
    this._rx = options.rx;
    this._ry = options.ry;
    this._rotation = options.rotation || 0;

    this._color = options.color;
    this._lineWidth = options.lineWidth || 2;
    this.handle_wh = 6;

    this.element = this.paper.ellipse();
    this.element.attr({'fill-opacity': 0.01, 'fill': '#fff'});

    // Drag handling of ellipse
    this.element.drag(
        function(dx, dy) {
            // DRAG, update location and redraw
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
            return false;
        }
    );

    console.log("createHandles...");
    this.createHandles();

    console.log("drawShape...");
    this.drawShape();
};

// handle start of drag by selecting this shape
Ellipse.prototype._handleMousedown = function _handleMousedown() {
    this.manager.selectShape(this);
};

// Ellipse.prototype.setCoords = function setCoords(coords) {
//     this._x1 = coords.x1 || this._x1;
//     this._y1 = coords.y1 || this._y1;
//     this._x2 = coords.x2 || this._x2;
//     this._y2 = coords.y2 || this._y2;
//     this.drawShape();
// };

// Ellipse.prototype.getCoords = function getCoords() {
//     return {'x1': this._x1,
//             'y1': this._y1,
//             'x2': this._x2,
//             'y2': this._y2};
// };

Ellipse.prototype.setColor = function setColor(color) {
    this._color = color;
    this.drawShape();
};

Ellipse.prototype.getColor = function getColor() {
    return this._color;
};

Ellipse.prototype.setLineWidth = function setLineWidth(lineWidth) {
    this._lineWidth = lineWidth;
    this.drawShape();
};

Ellipse.prototype.getLineWidth = function getLineWidth() {
    return this._lineWidth;
};

Ellipse.prototype.destroy = function destroy() {
    this.element.remove();
    this.handles.remove();
};

// Ellipse.prototype.getPath = function getPath() {
//     return "M" + this._x1 + " " + this._y1 + "L" + this._x2 + " " + this._y2;
// };

Ellipse.prototype.isSelected = function isSelected() {
    return this._selected;
};


Ellipse.prototype.updateHandle = function updateHandle(handleId, x, y) {
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
    
    this._cx = (hh.start.x + hh.end.x)/2,
    this._cy = (hh.start.y + hh.end.y)/2,
    this._rx = Math.sqrt((lengthX * lengthX) + (lengthY * lengthY)) / 2,
    this._ry = Math.sqrt((widthX * widthX) + (widthY * widthY)) / 2,

    this.drawShape();
};

Ellipse.prototype.drawShape = function drawShape() {

    var color = this._color,
        lineW = this._lineWidth;

    this.element.attr({'cx': this._cx,
                       'cy': this._cy,
                       'rx': this._rx,
                       'ry': this._ry,
                       'stroke': '#' + color,
                       'stroke-width': lineW});
    this.element.transform('r'+ this._rotation);

    if (this.isSelected()) {
        this.element.toFront();
        this.handles.show().toFront();
    } else {
        this.handles.hide();
    }

    // update Handles
    this._handleIds = this.getHandleCoords();
    console.log("handleIds", this._handleIds);
    var hnd, h_id, hx, hy;
    for (var h=0, l=this.handles.length; h<l; h++) {
        hnd = this.handles[h];
        h_id = hnd.h_id;
        hx = this._handleIds[h_id].x;
        hy = this._handleIds[h_id].y;
        hnd.attr({'x':hx-this.handle_wh/2, 'y':hy-this.handle_wh/2});
    }
};

Ellipse.prototype.setSelected = function setSelected(selected) {
    this._selected = !!selected;
    this.drawShape();
};


Ellipse.prototype.createHandles = function createHandles() {
    // ---- Create Handles -----

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
            this.ox = this.attr("x") + this.attr('width')/2;
            this.oy = this.attr("y") + this.attr('height')/2;
            return false;
        };
    };
    var _handle_drag_end = function() {
        return function() {
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

        handle.drag(
            _handle_drag(),
            _handle_drag_start(),
            _handle_drag_end()
        );
        self.handles.push(handle);
    }

    self.handles.attr(handleAttrs).hide();     // show on selection
};

Ellipse.prototype.getHandleCoords = function getHandleCoords() {
    
    var rot = Raphael.rad(this._rotation),
        startX = this._cx - (Math.cos(rot) * this._rx),
        startY = this._cy - (Math.sin(rot) * this._rx),
        endX = this._cx + (Math.cos(rot) * this._rx),
        endY = this._cy + (Math.sin(rot) * this._rx),
        leftX = this._cx + (Math.sin(rot) * this._ry),
        leftY = this._cy - (Math.cos(rot) * this._ry),
        rightX = this._cx - (Math.sin(rot) * this._ry),
        rightY = this._cy + (Math.cos(rot) * this._ry);
    console.log("getHandleCoords", rot, startX, startY);

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

    var color = this.manager.getColor(),
        lineWidth = this.manager.getLineWidth();

    this.ellipse = new Ellipse({
        'manager': this.manager,
        'paper': this.paper,
        'cx': startX,
        'cy': startY,
        'rx': 0,
        'ry': 50,
        'rotation': 0,
        'lineWidth': lineWidth,
        'color': color});
};

CreateEllipse.prototype.drag = function drag(dragX, dragY) {

    this.ellipse.updateHandle('end', dragX, dragY);
};

CreateEllipse.prototype.stopDrag = function stopDrag() {

    // var coords = this.ellipse.getCoords();
    // if ((Math.abs(coords.x1 - coords.x2) < 2) &&
    //         (Math.abs(coords.y1 - coords.y2) < 2)) {
    //     this.line.destroy();
    //     delete this.line;
    //     return;
    // }
    this.ellipse.setSelected(true);
    this.manager.addShape(this.ellipse);
};
