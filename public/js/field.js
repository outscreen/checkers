(function () {
    angular.module('FieldMod', [])
        .factory('field', function () {
        return field;
    });

    var field = {
        fields: [], //array of field cells
        Cell: function (color) {//constructor for creating field cells
            this.color = color;
        },
        setCheckers: function (checkers) {
            //remove checkers from the field
            for (var i = 0; i < 64; i++) {
                this.fields[i].man = null;
            }

            //set checkers at the field
            for (var i = 0, l = checkers.length; i < l; i++) {
                this.fields[checkers[i].isOn].man = checkers[i];
            }
        },
        load: function () {
            //create 64 field cells; if the both x and y are either odd or even, the cell is white, otherwise it is black (y0 is at the top, y7 is at the bottom)
            for (var x = 0; x < 8; x++) {
                for (var y = 0; y < 8; y++) {
                    if ((x + y) % 2) {
                        this.fields.push(new this.Cell('black'));
                    } else {
                        this.fields.push(new this.Cell('white'));
                    }
                }
            }

        }
    }
})();