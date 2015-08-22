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

    var self = this;
    this.manager = options.manager;
    this.paper = options.paper;

    if (options.id) {
        this._id = options.id;
    } else {
        this._id = this.manager.getRandomId();
    }
    this._x1 = options.x1;
    this._y1 = options.y1;
    this._x2 = options.x2;
    this._y2 = options.y2;
    this._strokeColor = options.strokeColor;
    this._strokeWidth = options.strokeWidth || 2;
    this.handle_wh = 6;
    this._selected = false;
    this._zoomFraction = 1;
    if (options.zoom) {
        this._zoomFraction = options.zoom / 100;
    }

    this.element = this.paper.path();

    // Drag handling of line
    if (this.manager.canEdit) {
        this.element.drag(
            function(dx, dy) {
                // DRAG, update location and redraw
                dx = dx / self._zoomFraction;
                dy = dy / self._zoomFraction;
                self._x1 = this.old.x1 + dx;
                self._y1 = this.old.y1 + dy;
                self._x2 = this.old.x2 + dx;
                self._y2 = this.old.y2 + dy;
                self.drawShape();
                return false;
            },
            function() {
                // START drag: note the location of all points
                self._handleMousedown();
                this.old = {
                    'x1': self._x1,
                    'x2': self._x2,
                    'y1': self._y1,
                    'y2': self._y2
                };
                return false;
            },
            function() {
                // STOP
                // notify manager if line has moved
                if (self._x1 !== this.old.x1 || self._y1 !== this.old.y1) {
                    self.manager.notifyShapeChanged(self);
                }
                return false;
            }
        );
    }

    this.createHandles();

    this.drawShape();
};

Line.prototype.toJson = function toJson() {
    var rv = {
        'type': 'Line',
        'x1': this._x1,
        'x2': this._x2,
        'y1': this._y1,
        'y2': this._y2,
        'strokeWidth': this._strokeWidth,
        'strokeColor': this._strokeColor
    };
    if (this._id) {
        rv.id = this._id;
    }
    return rv;
};

Line.prototype.compareCoords = function compareCoords(json) {

    var selfJson = this.toJson(),
        match = true;
    if (json.type !== selfJson.type) {
        return false;
    }
    ['x1', 'y1', 'x2', 'y2'].forEach(function(c){
        if (json[c] !== selfJson[c]) {
            match = false;
        }
    });
    return match;
};

// Useful for pasting json with an offset
Line.prototype.offsetCoords = function offsetCoords(json, dx, dy) {
    json.x1 = json.x1 + dx;
    json.y1 = json.y1 + dy;
    json.x2 = json.x2 + dx;
    json.y2 = json.y2 + dy;
    return json;
};

// handle start of drag by selecting this shape
Line.prototype._handleMousedown = function _handleMousedown() {
    this.manager.selectShape(this);
};

Line.prototype.setCoords = function setCoords(coords) {
    this._x1 = coords.x1 || this._x1;
    this._y1 = coords.y1 || this._y1;
    this._x2 = coords.x2 || this._x2;
    this._y2 = coords.y2 || this._y2;
    this.drawShape();
};

Line.prototype.getCoords = function getCoords() {
    return {'x1': this._x1,
            'y1': this._y1,
            'x2': this._x2,
            'y2': this._y2};
};

Line.prototype.setStrokeColor = function setStrokeColor(strokeColor) {
    this._strokeColor = strokeColor;
    this.drawShape();
};

Line.prototype.getStrokeColor = function getStrokeColor() {
    return this._strokeColor;
};

Line.prototype.setStrokeWidth = function setStrokeWidth(strokeWidth) {
    this._strokeWidth = strokeWidth;
    this.drawShape();
};

Line.prototype.getStrokeWidth = function getStrokeWidth() {
    return this._strokeWidth;
};

Line.prototype.destroy = function destroy() {
    this.element.remove();
    this.handles.remove();
};

Line.prototype.getPath = function getPath() {
    var f = this._zoomFraction,
        x1 = this._x1 * f,
        y1 = this._y1 * f,
        x2 = this._x2 * f,
        y2 = this._y2 * f;
    return "M" + x1 + " " + y1 + "L" + x2 + " " + y2;
};

Line.prototype.isSelected = function isSelected() {
    return this._selected;
};

Line.prototype.setZoom = function setZoom(zoom) {
    this._zoomFraction = zoom / 100;
    this.drawShape();
};

Line.prototype.drawShape = function drawShape() {

    var p = this.getPath(),
        strokeColor = this._strokeColor,
        strokeW = this._strokeWidth * this._zoomFraction;

    this.element.attr({'path': p,
                       'stroke': strokeColor,
                       'fill': strokeColor,
                       'stroke-width': strokeW});

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
                        'cursor': 'move',
                        'fill-opacity': 1.0};
    // draw handles
    self.handles = this.paper.set();
    var _handle_drag = function() {
        return function (dx, dy, mouseX, mouseY, event) {

            dx = dx / self._zoomFraction;
            dy = dy / self._zoomFraction;

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
            // notify manager if line has moved
            if (self._x1 !== this.old.x1 || self._y1 !== this.old.y1 ||
                    self._x2 !== this.old.x2 || self._y2 !== this.old.y2) {
                self.manager.notifyShapeChanged(self);
            }
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

Line.prototype.getHandleCoords = function getHandleCoords() {
    var f = this._zoomFraction,
        x1 = this._x1 * f,
        y1 = this._y1 * f,
        x2 = this._x2 * f,
        y2 = this._y2 * f;
    return {'start': {x: x1, y: y1},
        'middle': {x: (x1+x2)/2, y: (y1+y2)/2},
        'end': {x: x2, y: y2}
    };
};



var Arrow = function Arrow(options) {

    var that = new Line(options);

    var toJ = that.toJson;

    that.toJson = function toJson() {
        var lineJson = toJ.call(that);
        lineJson.type = "Arrow";
        return lineJson;
    };

    that.getPath = function getPath() {

        var zf = this._zoomFraction,
            x1 = this._x1 * zf,
            y1 = this._y1 * zf,
            x2 = this._x2 * zf,
            y2 = this._y2 * zf;

        var headSize = (this._strokeWidth * 3) + 9,
            dx = x2 - x1,
            dy = y2 - y1;
        headSize = headSize * this._zoomFraction;


        var linePath = "M" + x1 + " " + y1 + "L" + x2 + " " + y2;
        var lineAngle = Math.atan(dx / dy);
        var f = (dy < 0 ? 1 : -1);

        // Angle of arrow head is 0.8 radians (0.4 either side of lineAngle)
        var arrowPoint1x = x2 + (f * Math.sin(lineAngle - 0.4) * headSize),
            arrowPoint1y = y2 + (f * Math.cos(lineAngle - 0.4) * headSize),
            arrowPoint2x = x2 + (f * Math.sin(lineAngle + 0.4) * headSize),
            arrowPoint2y = y2 + (f * Math.cos(lineAngle + 0.4) * headSize);

        // Full path goes around the head, past the tip and back to tip so that the tip is 'pointy'
        // and 'fill' is not from a head corner to the start of arrow.
        var arrowPath = linePath + "L" + arrowPoint1x + " " + arrowPoint1y + "L" + arrowPoint2x + " " + arrowPoint2y;
        arrowPath = arrowPath + "L" + x2 + " " + y2 + "L" + arrowPoint1x + " " + arrowPoint1y + "L" + x2 + " " + y2;
        return arrowPath;
    };

    // since we've over-ridden getPath() after it is called
    // during  new Line(options)
    // we need to call it again!
    that.drawShape();

    return that;
};



// Class for creating Lines.
var CreateLine = function CreateLine(options) {

    this.paper = options.paper;
    this.manager = options.manager;
};

CreateLine.prototype.startDrag = function startDrag(startX, startY) {

    var strokeColor = this.manager.getStrokeColor(),
        strokeWidth = this.manager.getStrokeWidth(),
        zoom = this.manager.getZoom();

    this.line = new Line({
        'manager': this.manager,
        'paper': this.paper,
        'x1': startX,
        'y1': startY,
        'x2': startX,
        'y2': startY,
        'strokeWidth': strokeWidth,
        'zoom': zoom,
        'strokeColor': strokeColor});
};

CreateLine.prototype.drag = function drag(dragX, dragY) {

    this.line.setCoords({'x2': dragX, 'y2': dragY});
};

CreateLine.prototype.stopDrag = function stopDrag() {

    var coords = this.line.getCoords();
    if ((Math.abs(coords.x1 - coords.x2) < 2) &&
            (Math.abs(coords.y1 - coords.y2) < 2)) {
        this.line.destroy();
        delete this.line;
        return;
    }
    this.manager.addShape(this.line);
    this.line.setSelected(true);
};


var CreateArrow = function CreateArrow(options) {

    var that = new CreateLine(options);

    that.startDrag = function startDrag(startX, startY) {
        var strokeColor = this.manager.getStrokeColor(),
            strokeWidth = this.manager.getStrokeWidth(),
            zoom = this.manager.getZoom();

        this.line = new Arrow({
            'manager': this.manager,
            'paper': this.paper,
            'x1': startX,
            'y1': startY,
            'x2': startX,
            'y2': startY,
            'strokeWidth': strokeWidth,
            'zoom': zoom,
            'strokeColor': strokeColor});
    };

    return that;
};
