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

    this.paper = options.paper;

    this._x = options.x;
    this._y = options.y;
    this._width = options.x2;
    this._height = options.height;
    this._color = options.color;
    this._lineWidth = options.lineWidth || 2;

    this.element = this.paper.rect();
    this.element.attr({'fill-opacity': 0.01, 'fill': '#fff'});

    // TODO: setup drag handling etc.
    this.drawShape();
};


Rect.prototype.setCoords = function setCoords(coords) {
    this._x = coords.x || this._x;
    this._y = coords.y || this._y;
    this._width = coords.width || this._width;
    this._height = coords.height || this._height;
    this.drawShape();
};


Rect.prototype.drawShape = function drawShape() {

    var color = this._color,
        lineW = this._lineWidth;

    this.element.attr({'x':this._x, 'y':this._y,
                       'width':this._width, 'height':this._height,
                       'stroke': '#' + color,
                       'stroke-width': lineW});
};



// Class for creating Lines.
var CreateRect = function CreateRect(options) {

    this.paper = options.paper;
    this.manager = options.manager;
    console.log("CreateRect", this.manager);
};

CreateRect.prototype.startDrag = function startDrag(startX, startY) {

    var color = this.manager.getColor();
    // Also need to get lineWidth and zoom/size etc.
    console.log("CreateRect", this.manager);
    console.log('CreateRect.startDrag', color, startX, startY);

    this.startX = startX;
    this.startY = startY;

    this.rect = new Rect({
        'paper': this.paper,
        'x': startX,
        'y': startY,
        'width': 0,
        'height': 0,
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

    this.manager.addShape(this.rect);
};
