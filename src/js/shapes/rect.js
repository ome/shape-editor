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

var Rect = function Rect(options) {

    var self = this;
    this.paper = options.paper;
    this.manager = options.manager;

    this._x = options.x;
    this._y = options.y;
    this._width = options.width;
    this._height = options.height;
    this._color = options.color;
    this._lineWidth = options.lineWidth || 2;
    this._selected = false;
    this._zoom = 100;
    this.handle_wh = 6;

    this.element = this.paper.rect();
    this.element.attr({'fill-opacity': 0.01, 'fill': '#fff'});

    // Drag handling of element
    this.element.drag(
        function(dx, dy) {
            // DRAG, update location and redraw
            dx = dx * 100 / self._zoom;
            dy = dy * 100 / self._zoom;
            self._x = dx+this.ox;
            self._y = this.oy+dy;
            self.drawShape();
            return false;
        },
        function() {
            self._handleMousedown();
            // START drag: note the location of all points (copy list)
            this.ox = this.attr('x') * 100 / self._zoom;
            this.oy = this.attr('y') * 100 / self._zoom;
            return false;
        },
        function() {
            // STOP
            return false;
        }
    );

    this.createHandles();

    this.drawShape();
};

// handle start of drag by selecting this shape
Rect.prototype._handleMousedown = function _handleMousedown() {
    this.manager.selectShape(this);
};

Rect.prototype.setSelected = function setSelected(selected) {
    this._selected = !!selected;
    this.drawShape();
};

Rect.prototype.isSelected = function isSelected() {
    return this._selected;
};

Rect.prototype.setZoom = function setZoom(zoom) {
    this._zoom = zoom;
    this.drawShape();
};

Rect.prototype.setCoords = function setCoords(coords) {
    this._x = coords.x || this._x;
    this._y = coords.y || this._y;
    this._width = coords.width || this._width;
    this._height = coords.height || this._height;
    this.drawShape();
};

Rect.prototype.getCoords = function getCoords() {
    return {'x': this._x,
            'y': this._y,
            'width': this._width,
            'height': this._height};
};

Rect.prototype.setColor = function setColor(color) {
    this._color = color;
    this.drawShape();
};

Rect.prototype.getColor = function getColor() {
    return this._color;
};

Rect.prototype.setLineWidth = function setLineWidth(lineWidth) {
    this._lineWidth = lineWidth;
    this.drawShape();
};

Rect.prototype.getLineWidth = function getLineWidth() {
    return this._lineWidth;
};

Rect.prototype.destroy = function destroy() {
    this.element.remove();
    this.handles.remove();
};

Rect.prototype.drawShape = function drawShape() {

    var color = this._color,
        lineW = this._lineWidth;

    var f = this._zoom / 100,
        x = this._x * f,
        y = this._y * f,
        w = this._width * f,
        h = this._height * f;

    this.element.attr({'x':x, 'y':y,
                       'width':w, 'height':h,
                       'stroke': '#' + color,
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
    for (var i=0, l=this.handles.length; i<l; i++) {
        hnd = this.handles[i];
        h_id = hnd.h_id;
        hx = handleIds[h_id][0];
        hy = handleIds[h_id][1];
        hnd.attr({'x':hx-this.handle_wh/2, 'y':hy-this.handle_wh/2});
    }
};

Rect.prototype.getHandleCoords = function getHandleCoords() {

    var f = this._zoom / 100,
        x = this._x * f,
        y = this._y * f,
        w = this._width * f,
        h = this._height * f;

    var handleIds = {'nw': [x, y],
        'n': [x + w/2,y],
        'ne': [x + w,y],
        'w': [x, y + h/2],
        'e': [x + w, y + h/2],
        'sw': [x, y + h],
        's': [x + w/2, y + h],
        'se': [x + w, y + h]};
    return handleIds;
};

// ---- Create Handles -----
Rect.prototype.createHandles = function createHandles() {

    var self = this,
        handle_attrs = {'stroke': '#4b80f9',
                        'fill': '#fff',
                        'cursor': 'default',
                        'fill-opacity': 1.0};

    // map of centre-points for each handle
    var handleIds = this.getHandleCoords();

    // draw handles
    self.handles = this.paper.set();
    var _handle_drag = function() {
        return function (dx, dy, mouseX, mouseY, event) {

            dx = dx * 100 / self._zoom;
            dy = dy * 100 / self._zoom;

            // If drag on corner handle, retain aspect ratio. dx/dy = aspect
            var keep_ratio = self.fixed_ratio || event.shiftKey;
            if (keep_ratio && this.h_id.length === 2) {     // E.g. handle is corner 'ne' etc
                if (this.h_id === 'se' || this.h_id === 'nw') {
                    if (Math.abs(dx/dy) > this.aspect) {
                        dy = dx/this.aspect;
                    } else {
                        dx = dy*this.aspect;
                    }
                } else {
                    if (Math.abs(dx/dy) > this.aspect) {
                        dy = -dx/this.aspect;
                    } else {
                        dx = -dy*this.aspect;
                    }
                }
            }
            // Use dx & dy to update the location of the handle and the corresponding point of the parent
            var new_x = this.ox + dx;
            var new_y = this.oy + dy;
            var newRect = {
                x: self._x,
                y: self._y,
                width: self._width,
                height: self._height
            };
            if (this.h_id.indexOf('e') > -1) {    // if we're dragging an 'EAST' handle, update width
                newRect.width = new_x - self._x + self.handle_wh/2;
            }
            if (this.h_id.indexOf('s') > -1) {    // if we're dragging an 'SOUTH' handle, update height
                newRect.height = new_y - self._y + self.handle_wh/2;
            }
            if (this.h_id.indexOf('n') > -1) {    // if we're dragging an 'NORTH' handle, update y and height
                newRect.y = new_y + self.handle_wh/2;
                newRect.height = this.oheight - dy;
            }
            if (this.h_id.indexOf('w') > -1) {    // if we're dragging an 'WEST' handle, update x and width
                newRect.x = new_x + self.handle_wh/2;
                newRect.width = this.owidth - dx;
            }
            // Don't allow zero sized rect.
            if (newRect.width < 1 || newRect.height < 1) {
                return false;
            }

            self._x = newRect.x;
            self._y = newRect.y;
            self._width = newRect.width;
            self._height = newRect.height;
            self.drawShape();
            return false;
        };
    };
    var _handle_drag_start = function() {
        return function () {
            // START drag: simply note the location we started
            this.ox = this.attr("x") * 100 / self._zoom;  // + self.handle_wh/2;
            this.oy = this.attr("y") * 100 / self._zoom;  // + self.handle_wh/2;
            this.owidth = self._width;
            this.oheight = self._height;
            this.aspect = self._width / self._height;
            return false;
        };
    };
    var _handle_drag_end = function() {
        return function() {
            return false;
        };
    };
    // var _stop_event_propagation = function(e) {
    //     e.stopImmediatePropagation();
    // }
    for (var key in handleIds) {
        var hx = handleIds[key][0];
        var hy = handleIds[key][1];
        var handle = this.paper.rect(hx-self.handle_wh/2, hy-self.handle_wh/2, self.handle_wh, self.handle_wh).attr(handle_attrs);
        handle.attr({'cursor': key + '-resize'});     // css, E.g. ne-resize
        handle.h_id = key;
        handle.rect = self;

        handle.drag(
            _handle_drag(),
            _handle_drag_start(),
            _handle_drag_end()
        );
        // handle.mousedown(_stop_event_propagation);
        self.handles.push(handle);
    }
    self.handles.hide();     // show on selection
};



// Class for creating Lines.
var CreateRect = function CreateRect(options) {

    this.paper = options.paper;
    this.manager = options.manager;
};

CreateRect.prototype.startDrag = function startDrag(startX, startY) {

    var color = this.manager.getColor(),
        lineWidth = this.manager.getLineWidth();
    // Also need to get lineWidth and zoom/size etc.

    this.startX = startX;
    this.startY = startY;

    this.rect = new Rect({
        'manager': this.manager,
        'paper': this.paper,
        'x': startX,
        'y': startY,
        'width': 0,
        'height': 0,
        'lineWidth': lineWidth,
        'color': color});
};

CreateRect.prototype.drag = function drag(dragX, dragY) {

    var dx = this.startX - dragX,
        dy = this.startY - dragY;

    this.rect.setCoords({'x': Math.min(dragX, this.startX),
                        'y': Math.min(dragY, this.startY),
                        'width': Math.abs(dx), 'height': Math.abs(dy)});
};

CreateRect.prototype.stopDrag = function stopDrag() {

    var coords = this.rect.getCoords();
    if (coords.width < 2 || coords.height < 2) {
        this.rect.destroy();
        delete this.rect;
        return;
    }
    this.rect.setSelected(true);
    this.manager.addShape(this.rect);
};
