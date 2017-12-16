/*
// Copyright (C) 2017 University of Dundee & Open Microscopy Environment.
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

var Polygon = function Polygon(options) {

    var self = this;
    this.manager = options.manager;
    this.paper = options.paper;

    if (options.id) {
        this._id = options.id;
    } else {
        this._id = this.manager.getRandomId();
    }
    this._points = options.points;
    // this._rotation = options.rotation || 0;

    this._strokeColor = options.strokeColor;
    this._strokeWidth = options.strokeWidth || 2;
    this._selected = false;
    this._zoomFraction = 1;
    if (options.zoom) {
        this._zoomFraction = options.zoom / 100;
    }
    this.handle_wh = 6;

    this.element = this.paper.path("");
    this.element.attr({'fill-opacity': 0.01,
                        'fill': '#fff',
                        'cursor': 'pointer'});

    if (this.manager.canEdit) {
        // Drag handling of element
        this.element.drag(
            function(dx, dy) {
                // DRAG, update location and redraw
                dx = dx / self._zoomFraction;
                dy = dy / self._zoomFraction;

                var offsetX = dx - this.prevX;
                var offsetY = dy - this.prevY;
                this.prevX = dx;
                this.prevY = dy;

                // Manager handles move and redraw
                self.manager.moveSelectedShapes(offsetX, offsetY, true);
            },
            function() {
                self._handleMousedown();
                this.prevX = 0;
                this.prevY = 0;
                return false;
            },
            function() {
                // STOP
                // notify manager if rectangle has moved
                if (this.prevX !== 0 || this.prevY !== 0) {
                    self.manager.notifySelectedShapesChanged();
                }
                return false;
            }
        );
    }

    // create handles...
    this.createHandles();
    // and draw the Polygon
    this.drawShape();
};

Polygon.prototype.toJson = function toJson() {
    var rv = {
        'type': "Polygon",
        'points': this._points,
        // 'rotation': this._rotation,
        'strokeWidth': this._strokeWidth,
        'strokeColor': this._strokeColor
    };
    if (this._id) {
        rv.id = this._id;
    }
    return rv;
};

Polygon.prototype.compareCoords = function compareCoords(json) {

    // var selfJson = this.toJson(),
    //     match = true;
    // if (json.type !== selfJson.type) {
    //     return false;
    // }
    return false;
};

// Useful for pasting json with an offset
Polygon.prototype.offsetCoords = function offsetCoords(json, dx, dy) {
    // json.x = json.x + dx;
    // json.y = json.y + dy;
    return json;
};

// Shift this shape by dx and dy
Polygon.prototype.offsetShape = function offsetShape(dx, dy) {
    // Offset all coords in points string "229,171 195,214 195,265 233,33"
    var points = this._points.split(" ").map(function(xy){
        var coords = xy.split(",").map(function(c){return parseFloat(c, 10)})
        coords[0] = coords[0] + dx;
        coords[1] = coords[1] + dy;
        return coords.join(",");
    }).join(" ");
    this._points = points;
    this.drawShape();
};

// handle start of drag by selecting this shape
// if not already selected
Polygon.prototype._handleMousedown = function _handleMousedown() {
    if (!this._selected) {
        this.manager.selectShapes([this]);
    }
};

Polygon.prototype.setColor = function setColor(strokeColor) {
    this._strokeColor = strokeColor;
    this.drawShape();
};

Polygon.prototype.getStrokeColor = function getStrokeColor() {
    return this._strokeColor;
};

Polygon.prototype.setStrokeColor = function setStrokeColor(strokeColor) {
    this._strokeColor = strokeColor;
    this.drawShape();
};

Polygon.prototype.setStrokeWidth = function setStrokeWidth(strokeWidth) {
    this._strokeWidth = strokeWidth;
    this.drawShape();
};

Polygon.prototype.getStrokeWidth = function getStrokeWidth() {
    return this._strokeWidth;
};

Polygon.prototype.destroy = function destroy() {
    console.trace('destroy?');
    this.element.remove();
    // this.handles.remove();
};

Polygon.prototype.intersectRegion = function intersectRegion(region) {

    var bbox = this.element.getBBox();
    if (bbox.x > (region.x + region.width) ||
        bbox.y > (region.y + region.height) ||
        (bbox.x + bbox.width) < region.x ||
        (bbox.y + bbox.height < region.y)) {
        return false;
    }
    return true;
};

Polygon.prototype.getPath = function getPath() {
    // Convert points string "229,171 195,214 195,265 233,33"
    // to Raphael path "M229,171L195,214L195,265L233,33Z"
    // Handles scaling by zoomFraction
    var f = this._zoomFraction;
    var path = this._points.split(" ").map(function(xy){
        return xy.split(",").map(function(c){return parseInt(c, 10) * f}).join(",");
    }).join("L");
    path = "M" + path + "Z";
    return path;
};

Polygon.prototype.isSelected = function isSelected() {
    return this._selected;
};

Polygon.prototype.setZoom = function setZoom(zoom) {
    this._zoomFraction = zoom / 100;
    this.drawShape();
};

Polygon.prototype.updateHandle = function updateHandle(handleId, x, y, shiftKey) {
    // Refresh the handle coordinates, then update the specified handle
    // using MODEL coordinates
    // this._handleIds = this.getHandleCoords();
    // var h = this._handleIds[handleId];
    // h.x = x;
    // h.y = y;
    // var resizeWidth = (handleId === "left" || handleId === "right");
    // this.updateShapeFromHandles(resizeWidth, shiftKey);
};

Polygon.prototype.updateShapeFromHandles = function updateShapeFromHandles(resizeWidth, shiftKey) {
    // var hh = this._handleIds,
    //     lengthX = hh.end.x - hh.start.x,
    //     lengthY = hh.end.y - hh.start.y,
    //     widthX = hh.left.x - hh.right.x,
    //     widthY = hh.left.y - hh.right.y,
    //     rot;
    // // Use the 'start' and 'end' handles to get rotation and length
    // if (lengthX === 0){
    //     this._rotation = 90;
    // } else if (lengthX > 0) {
    //     rot = Math.atan(lengthY / lengthX);
    //     this._rotation = Raphael.deg(rot);
    // } else if (lengthX < 0) {
    //     rot = Math.atan(lengthY / lengthX);
    //     this._rotation = 180 + Raphael.deg(rot);
    // }
    
    // // centre is half-way between 'start' and 'end' handles
    // this._x = (hh.start.x + hh.end.x)/2;
    // this._y = (hh.start.y + hh.end.y)/2;
    // // Radius-x is half of distance between handles
    // this._radiusX = Math.sqrt((lengthX * lengthX) + (lengthY * lengthY)) / 2;
    // // Radius-y may depend on handles OR on x/y ratio
    // if (resizeWidth) {
    //     this._radiusY = Math.sqrt((widthX * widthX) + (widthY * widthY)) / 2;
    //     this._yxRatio = this._radiusY / this._radiusX;
    // } else {
    //     if (shiftKey) {
    //         this._yxRatio = 1;
    //     }
    //     this._radiusY = this._yxRatio * this._radiusX;
    // }

    this.drawShape();
};

Polygon.prototype.drawShape = function drawShape() {

    var strokeColor = this._strokeColor,
        strokeW = this._strokeWidth * this._zoomFraction;

    var f = this._zoomFraction;
    //     x = this._x * f,
    //     y = this._y * f,
    //     radiusX = this._radiusX * f,
    //     radiusY = this._radiusY * f;
    var path = this.getPath();
    console.log('Polygon path', path);

    this.element.attr({'path': path,
                       'stroke': strokeColor,
                       'stroke-width': strokeW});
    // this.element.transform('r'+ this._rotation);

    if (this.isSelected()) {
        this.element.toFront();
        this.handles.show().toFront();
    } else {
        this.handles.hide();
    }

    // handles have been updated (model coords)
    var hnd, hx, hy;
    this._points.split(" ").forEach(function(xy, i){
        var xy = xy.split(",");
        hx = parseInt(xy[0]) * this._zoomFraction;
        hy = parseInt(xy[1]) * this._zoomFraction;
        hnd = this.handles[i];
        hnd.attr({'x':hx-this.handle_wh/2, 'y':hy-this.handle_wh/2});
    }.bind(this));
};

Polygon.prototype.setSelected = function setSelected(selected) {
    this._selected = !!selected;
    this.drawShape();
};


Polygon.prototype.createHandles = function createHandles() {
    // ---- Create Handles -----

    // NB: handleIds are used to calculate coords
    // so handledIds are scaled to MODEL coords, not zoomed.
    // this._handleIds = this.getHandleCoords();

    var self = this,
        // map of centre-points for each handle
        handleAttrs = {'stroke': '#4b80f9',
                        'fill': '#fff',
                        'cursor': 'move',
                        'fill-opacity': 1.0};

    // draw handles
    self.handles = this.paper.set();
    // var _handle_drag = function() {
    //     return function (dx, dy, mouseX, mouseY, event) {
    //         dx = dx / self._zoomFraction;
    //         dy = dy / self._zoomFraction;
    //         // on DRAG...
    //         var absX = dx + this.ox,
    //             absY = dy + this.oy;
    //         self.updateHandle(this.h_id, absX, absY, event.shiftKey);
    //         return false;
    //     };
    // };
    // var _handle_drag_start = function() {
    //     return function () {
    //         // START drag: simply note the location we started
    //         // we scale by zoom to get the 'model' coordinates
    //         this.ox = (this.attr("x") + this.attr('width')/2) / self._zoomFraction;
    //         this.oy = (this.attr("y") + this.attr('height')/2) / self._zoomFraction;
    //         return false;
    //     };
    // };
    // var _handle_drag_end = function() {
    //     return function() {
    //         // simply notify manager that shape has changed
    //         self.manager.notifyShapesChanged([self]);
    //         return false;
    //     };
    // };

    var hsize = this.handle_wh,
        hx, hy, handle;
    this._points.split(" ").forEach(function(xy){
        var xy = xy.split(",");
        hx = parseInt(xy[0]);
        hy = parseInt(xy[1]);
    //     // If we have a transformation matrix, apply it...
    //     if (this.Matrix) {
    //         var matrixStr = this.Matrix.toTransformString();
    //         // Matrix that only contains rotation and translation 
    //         // E.g. t111.894472287,-140.195845758r32.881,0,0  Will be handled correctly:
    //         // Resulting handles position and x,y radii will be calculated
    //         // so we don't need to apply transform to ellipse itself
    //         // BUT, if we have other transforms such as skew, we can't do this.
    //         // Best to just show warning if Raphael can't resolve matrix to simpler transforms:
    //         // E.g. m2.39,-0.6,2.1,0.7,-1006,153 
    //         if (matrixStr.indexOf('m') > -1) {
    //             console.log("Matrix only supports rotation & translation. " + matrixStr + " may contain skew for shape: ", this.toJson());
    //         }
    //         var mx = this.Matrix.x(hx, hy);
    //         var my = this.Matrix.y(hx, hy);
    //         hx = mx;
    //         hy = my;
    //         // update the source coordinates
    //         this._handleIds[key].x = hx;
    //         this._handleIds[key].y = hy;
    //     }
        handle = self.paper.rect(hx-hsize/2, hy-hsize/2, hsize, hsize);
        handle.attr({'cursor': 'move'});
        // handle.h_id = key;
        // handle.line = self;

    //     if (this.manager.canEdit) {
    //         handle.drag(
    //             _handle_drag(),
    //             _handle_drag_start(),
    //             _handle_drag_end()
    //         );
    //     }
        self.handles.push(handle);
    });

    self.handles.attr(handleAttrs).hide();     // show on selection
};

// Polygon.prototype.getHandleCoords = function getHandleCoords() {
    // Returns MODEL coordinates (not zoom coordinates)
    // var rot = Raphael.rad(this._rotation),
    //     x = this._x,
    //     y = this._y,
    //     radiusX = this._radiusX,
    //     radiusY = this._radiusY,
    //     startX = x - (Math.cos(rot) * radiusX),
    //     startY = y - (Math.sin(rot) * radiusX),
    //     endX = x + (Math.cos(rot) * radiusX),
    //     endY = y + (Math.sin(rot) * radiusX),
    //     leftX = x + (Math.sin(rot) * radiusY),
    //     leftY = y - (Math.cos(rot) * radiusY),
    //     rightX = x - (Math.sin(rot) * radiusY),
    //     rightY = y + (Math.cos(rot) * radiusY);

    // return {'start':{x: startX, y: startY},
    //         'end':{x: endX, y: endY},
    //         'left':{x: leftX, y: leftY},
    //         'right':{x: rightX, y: rightY}
    //     };
// };


// Class for creating Lines.
var CreatePolygon = function CreatePolygon(options) {

    this.paper = options.paper;
    this.manager = options.manager;

    // Keep track of points during Polygon creation
    this.pointsList = [];
};

CreatePolygon.prototype.startDrag = function startDrag(startX, startY) {

    // var strokeColor = this.manager.getStrokeColor(),
    //     strokeWidth = this.manager.getStrokeWidth(),
    //     zoom = this.manager.getZoom();

    // this.polygon = new Polygon({
    //     'manager': this.manager,
    //     'paper': this.paper,
    //     'x': startX,
    //     'y': startY,
    //     'radiusX': 0,
    //     'radiusY': 0,
    //     'rotation': 0,
    //     'strokeWidth': strokeWidth,
    //     'zoom': zoom,
    //     'strokeColor': strokeColor});

    if (startX === this.startX && startY === this.startY) {
        // Second click in same point as last click...
        // complete shape
        this.polygon === undefined;
    }
    this.startX = startX;
    this.startY = startY;
};

CreatePolygon.prototype.drag = function drag(dragX, dragY, shiftKey) {

    // Update the last point and redraw
    this.pointsList[this.pointsList.length-1] = dragX + "," + dragY;
    this.polygon._points = this.pointsList.join(" ");
    this.polygon.drawShape();
    // this.ellipse.updateHandle('end', dragX, dragY, shiftKey);

};

CreatePolygon.prototype.stopDrag = function stopDrag() {

    if (!this.polygon) {
        var strokeColor = this.manager.getStrokeColor(),
            strokeWidth = this.manager.getStrokeWidth(),
            zoom = this.manager.getZoom();
        // Reset list with first item at current point
        this.pointsList = [this.startX + "," + this.startY,
                           this.startX + "," + this.startY];

        console.log("pointS", this.pointsList.join(" "));
        this.polygon = new Polygon({
            'manager': this.manager,
            'paper': this.paper,
            'points': 'M' + this.pointsList.join(" "),
            'strokeWidth': strokeWidth,
            'zoom': zoom,
            'strokeColor': strokeColor});

        // on the 'new:shape' trigger, this shape will already be selected
        // this.polygon.setSelected(true);
        this.manager.addShape(this.polygon);
    } else {
        this.pointsList.push(this.startX + "," + this.startY);
    }

    console.log('stopDrag', arguments);
};
