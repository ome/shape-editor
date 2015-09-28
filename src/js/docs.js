/* globals ShapeManager: false */
/* globals console: false */

$(function() {

    var WIDTH = 512,
        HEIGHT = 512;

    var options = {};

    var shapesClipboard = [];

    // We can choose to display shapes only - No editing
    // options = {'readOnly': true};

    var shapeManager = new ShapeManager("shapesCanvas",
                                        WIDTH, HEIGHT,
                                        options);

    var zoomPercent = 100;

    // set state depending on what we want to do,
    // for example to create Rectangle

    $("input[name='state']").click(function(){
        var state = $(this).val();
        shapeManager.setState(state);
    });

    $("input[name='strokeColor']").click(function(){
        var strokeColor = $(this).val();
        shapeManager.setStrokeColor(strokeColor);
    });

    $("select[name='strokeWidth']").change(function(){
        var strokeWidth = $(this).val();
        shapeManager.setStrokeWidth(strokeWidth);
    });

    var updateZoom = function updateZoom() {
        $("#zoomDisplay").text(zoomPercent + " %");
        shapeManager.setZoom(zoomPercent);
        var w = WIDTH * zoomPercent / 100,
            h = HEIGHT * zoomPercent / 100;
        $(".imageWrapper img").css({'width': w, 'height': h});
    };

    $("button[name='zoomIn']").click(function(){
        zoomPercent += 20;
        updateZoom();
    });
    $("button[name='zoomOut']").click(function(){
        zoomPercent -= 20;
        updateZoom();
    });

    $("button[name='deleteSelected']").click(function(){
        shapeManager.deleteSelected();
    });

    $("button[name='deleteAll']").click(function(){
        shapeManager.deleteAll();
    });

    $("button[name='selectAll']").click(function(){
        shapeManager.selectAll();
    });

    $("button[name='copyShapes']").click(function(){
        shapesClipboard = shapeManager.getSelectedShapesJson();
    });

    $("button[name='pasteShapes']").click(function(){
        // paste shapes, constraining to the image coords
        var p = shapeManager.pasteShapesJson(shapesClipboard, true);
        if (!p) {
            console.log("Shape could not be pasted: outside view port");
        }
    });

    $("button[name='getShapes']").click(function(){
      var json = shapeManager.getShapesJson();
      console.log(json);
    });

    $("button[name='selectShape']").click(function(){
      shapeManager.selectShape(1234);
    });

    $("button[name='setShapes']").click(function(){
        var shapesJson = [
          {"type": "Rectangle",
            "strokeColor": "#ff00ff",
            "strokeWidth": 10,
            "x": 100, "y": 250,
            "width": 325, "height": 250},
          {"type": "Ellipse",
            "cx": 300, "cy": 250,
            "rx": 125, "ry": 250,
            "rotation": 100}
          ];
        shapeManager.setShapesJson(shapesJson);
    });

    $("#shapesCanvas").bind("change:selected", function(){
        var strokeColor = shapeManager.getStrokeColor();
        if (strokeColor) {
          $("input[value='" + strokeColor + "']").prop('checked', 'checked');
        } else {
           $("input[name='strokeColor']").removeProp('checked');
        }
        var strokeWidth = shapeManager.getStrokeWidth() || 1;
        $("select[name='strokeWidth']").val(strokeWidth);
    });

    $("#shapesCanvas").bind("change:shape", function(event, shapes){
        console.log("changed", shapes);
    });

    $("#shapesCanvas").bind("new:shape", function(event, shape){
        console.log("new", shape.toJson());
        console.log("selected", shapeManager.getSelectedShapesJson());
    });

    // Add some shapes to display
    shapeManager.addShapeJson({"id": 1234,
                               "type": "Rectangle",
                               "strokeColor": "#ff00ff",
                               "strokeWidth": 6,
                               "x": 200, "y": 150,
                               "width": 125, "height": 150});

    shapeManager.addShapeJson({"type": "Ellipse",
                               "cx": 200, "cy": 150,
                               "rx": 125, "ry": 50,
                               "rotation": 45});

    shapeManager.addShapeJson({"type": "Arrow",
                               "strokeColor": "#ffff00",
                               "strokeWidth": 4,
                               "x1": 25, "y1": 450,
                               "x2": 200, "y2": 400});

    shapeManager.addShapeJson({"type": "Arrow",
                               "strokeColor": "#ffff00",
                               "strokeWidth": 10,
                               "x1": 25, "y1": 250,
                               "x2": 200, "y2": 200});

    shapeManager.addShapeJson({"type": "Arrow",
                               "strokeColor": "#00ff00",
                               "strokeWidth": 2,
                               "x1": 400, "y1": 400,
                               "x2": 250, "y2": 310});

    // We start off in the 'SELECT' mode
    shapeManager.setState("SELECT");
});
