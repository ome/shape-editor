/* globals ShapeManager: false */
/* globals console: false */

$(function() {

    var WIDTH = 512,
        HEIGHT = 512;

    var shapeManager = new ShapeManager("shapesCanvas", WIDTH, HEIGHT);

    var zoomPercent = 100;

    // set state depending on what we want to do,
    // for example to create Rectangle

    $("input[name='state']").click(function(){
        var state = $(this).val();
        shapeManager.setState(state);
    });

    $("input[name='color']").click(function(){
        var color = $(this).val();
        shapeManager.setColor(color);
    });

    $("select[name='lineWidth']").change(function(){
        var lineWidth = $(this).val();
        shapeManager.setLineWidth(lineWidth);
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

    $("button[name='delete']").click(function(){
        shapeManager.deleteSelected();
    });


    $("#shapesCanvas").bind("change:selected", function(){
        var color = shapeManager.getColor();
        $("input[value='" + color + "']").prop('checked', 'checked');
        var lineWidth = shapeManager.getLineWidth();
        $("select[name='lineWidth']").val(lineWidth);
    });

    // Add some shapes to display
    shapeManager.addShapeJson({"type": "Rectangle",
                               "color": "ffffff",
                               "lineWidth": 6,
                               "x": 200, "y": 150,
                               "width": 125, "height": 150});

    shapeManager.addShapeJson({"type": "Ellipse",
                               "cx": 200, "cy": 150,
                               "rx": 125, "ry": 50,
                               "rotation": 45});

    shapeManager.addShapeJson({"type": "Arrow",
                               "color": "ffff00",
                               "lineWidth": 4,
                               "x1": 25, "y1": 450,
                               "x2": 200, "y2": 400});

    shapeManager.addShapeJson({"type": "Line",
                               "color": "00ff00",
                               "lineWidth": 2,
                               "x1": 400, "y1": 400,
                               "x2": 250, "y2": 310});

    // We start off in the 'SELECT' mode
    shapeManager.setState("SELECT");
});
