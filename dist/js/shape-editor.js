//! Built on 2015-06-09
//! GPL License. www.openmicroscopy.org

var ShapeEditor = function ShapeEditor(elementId, width, height, options) {

	// Set up Raphael paper...
    this.paper = Raphael(elementId, width, height);
};
