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

var Line = function Line(options) {

    this.paper = options.paper;

    this._x1 = options.x1;
    this._y1 = options.y1;
    this._x2 = options.x2;
    this._y2 = options.y2;
    this._color = options.color;
    this._lineWidth = options.lineWidth || 2;
    this.handle_wh = 6;

    this.element = this.paper.path();

    this.createHandles();
    // TODO: setup drag handling etc.
    this.drawShape();
};


Line.prototype.setCoords = function setCoords(coords) {
    this._x1 = coords.x1 || this._x1;
    this._y1 = coords.y1 || this._y1;
    this._x2 = coords.x2 || this._x2;
    this._y2 = coords.y2 || this._y2;
    this.drawShape();
};


Line.prototype.getPath = function getPath() {
    return "M" + this._x1 + " " + this._y1 + "L" + this._x2 + " " + this._y2;
};

Line.prototype.isSelected = function isSelected() {
    return this._selected;
};

Line.prototype.drawShape = function drawShape() {

    var p = this.getPath(),
        color = this._color,
        lineW = this._lineWidth;

    this.element.attr({'path': p,
                       'stroke': '#' + color,
                       'fill': '#' + color,
                       'stroke-width': lineW});

    if (this.isSelected()) {
        this.element.toFront();
        this.handles.show().toFront();
    } else {
        this.handles.hide();
    }

    // update Handles
    var handleIds = this.getHandleCoords();
    var hnd, h_id, hx, hy;
    for (var h=0, l=this.handles.length; h<l; h++) {
        hnd = this.handles[h];
        h_id = hnd.h_id;
        hx = handleIds[h_id].x;
        hy = handleIds[h_id].y;
        hnd.attr({'x':hx-this.handle_wh/2, 'y':hy-this.handle_wh/2});
    }
};

Line.prototype.setSelected = function setSelected(selected) {
    this._selected = !!selected;
    this.drawShape();
};


Line.prototype.createHandles = function createHandles() {
    // ---- Create Handles -----

    var self = this,
        // map of centre-points for each handle
        handleIds = this.getHandleCoords(),
        handleAttrs = {'stroke': '#4b80f9',
                        'fill': '#fff',
                        'cursor': 'default',
                        'fill-opacity': 1.0};
    // draw handles
    self.handles = this.paper.set();
    var _handle_drag = function() {
        return function (dx, dy, mouseX, mouseY, event) {
            // on DRAG...
            if (this.h_id === "start" || this.h_id === "middle") {
                self._x1 = this.old.x1 + dx;
                self._y1 = this.old.y1 + dy;
            }
            if (this.h_id === "end" || this.h_id === "middle") {
                self._x2 = this.old.x2 + dx;
                self._y2 = this.old.y2 + dy;
            }
            self.drawShape();
            return false;
        };
    };
    var _handle_drag_start = function() {
        return function () {
            // START drag: cache the starting coords of the line
            this.old = {
                'x1': self._x1,
                'x2': self._x2,
                'y1': self._y1,
                'y2': self._y2
            };
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
    for (var key in handleIds) {
        hx = handleIds[key].x;
        hy = handleIds[key].y;
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

Line.prototype.getHandleCoords = function getHandleCoords() {
    return {'start': {x: this._x1, y: this._y1},
        'middle': {x: (this._x1+this._x2)/2, y: (this._y1+this._y2)/2},
        'end': {x: this._x2, y: this._y2}
    };
};



// Class for creating Lines.
var CreateLine = function CreateLine(options) {

    this.paper = options.paper;
    this.manager = options.manager;
    console.log("CreateLine", this.manager);
};

CreateLine.prototype.startDrag = function startDrag(startX, startY) {

    var color = this.manager.getColor();
    // Also need to get lineWidth and zoom/size etc.
    console.log("CreateLine", this.manager);
    console.log('CreateLine.startDrag', color, startX, startY);

    this.line = new Line({
        'paper': this.paper,
        'x1': startX,
        'y1': startY,
        'x2': startX,
        'y2': startY,
        'color': color});
};

CreateLine.prototype.drag = function drag(dragX, dragY) {

    this.line.setCoords({'x2': dragX, 'y2': dragY});
};

CreateLine.prototype.stopDrag = function stopDrag() {

    this.line.setSelected(true);
    this.manager.addShape(this.line);
};
